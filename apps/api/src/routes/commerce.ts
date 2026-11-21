import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DEPARTMENT_SLUGS } from '@saotech/shared';
import type { CommerceService } from '../services/commerce.js';

const phone = z.string().trim().regex(/^\+[1-9][0-9]{6,14}$/, 'phone_e164');
const text = (max: number) => z.string().trim().min(1).max(max);
const list = z.array(z.string().trim().min(1).max(60)).max(20).default([]);
const imageUrl = z.string().trim().max(500).refine((u) => /^\/api\/v1\/images\/[0-9A-Za-z]{26}$/.test(u) || (u.startsWith('https://') && z.string().url().safeParse(u).success), 'https_or_uploaded_required');
const UploadBody = z.object({ data: z.string().min(16).max(2_100_000) });

const OrderBody = z.object({
  items: z.array(z.object({ id: z.coerce.number().int().positive(), quantity: z.coerce.number().int().min(1).max(100), color: z.string().max(60).optional(), size: z.string().max(60).optional() })).min(1).max(50),
  shippingPhone: phone, shippingCity: text(80), shippingAddress: text(500),
});
const AddressBody = z.object({ label: z.string().trim().max(60).optional(), city: text(80), address: text(500), phone });
const ShopBody = z.object({ name: text(100), phone: phone.optional(), description: z.string().trim().max(1000).optional(), citySlug: z.string().max(100).optional(), countryCode: z.string().length(2).toUpperCase().optional() });
const ShopPatch = z.object({ name: text(100).optional(), phone: phone.optional(), description: z.string().trim().max(1000).optional() });
const ProductBody = z.object({
  name: text(200), description: text(5000), priceUsd: z.number().positive().max(1_000_000), originalPriceUsd: z.number().positive().max(1_000_000).nullable().optional(),
  department: z.enum(DEPARTMENT_SLUGS), category: text(80), colors: list, sizes: list, inStock: z.boolean().default(true), images: z.array(imageUrl).max(5).default([]),
}).refine((p) => p.originalPriceUsd == null || p.originalPriceUsd > p.priceUsd, { message: 'original_price_must_exceed_price', path: ['originalPriceUsd'] });
const IdParam = z.object({ id: z.string().regex(/^[0-9A-Za-z]{1,26}$/) });
const ConvId = z.object({ id: z.coerce.number().int().positive() });

type Parse = <T extends z.ZodTypeAny>(schema: T, data: unknown) => z.infer<T>;
interface Ctx { svc: CommerceService; authenticate: (req: FastifyRequest) => Promise<void>; parse: Parse }

export function commerceRoutes(r: FastifyInstance, { svc, authenticate, parse }: Ctx): void {
  r.get('/products', async (_req, reply) => { reply.header('cache-control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300'); return { products: await svc.listPublicProducts() }; });
  r.get('/products/:id', async (req, reply) => { reply.header('cache-control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300'); return { product: await svc.getPublicProduct(Number(parse(IdParam, req.params).id)) }; });

  r.get('/images/:id', async (req, reply) => {
    const img = await svc.getImage(parse(IdParam, req.params).id);
    return reply.header('content-type', img.type).header('cache-control', 'public, max-age=31536000, immutable').header('x-content-type-options', 'nosniff').send(img.bytes);
  });

  const pre = { preHandler: authenticate };
  const user = (req: FastifyRequest) => req.auth!.user;

  r.get('/me/addresses', pre, async (req) => ({ addresses: await svc.listAddresses(user(req).id) }));
  r.post('/me/addresses', pre, async (req) => { await svc.addAddress(user(req).id, parse(AddressBody, req.body)); return { ok: true }; });
  r.delete('/me/addresses/:id', pre, async (req) => { await svc.deleteAddress(user(req).id, parse(IdParam, req.params).id); return { ok: true }; });

  r.post('/orders', pre, async (req, reply) => {
    const b = parse(OrderBody, req.body);
    const order = await svc.placeOrder(user(req), b.items, b);
    return reply.code(201).send({ order });
  });
  r.get('/orders', pre, async (req) => ({ orders: await svc.listOrders(user(req).id) }));
  const Number_ = z.object({ number: z.string().regex(/^STM-[0-9]{1,12}$/) });
  r.post('/orders/:number/cancel', pre, async (req) => svc.buyerOrderAction(user(req).id, parse(Number_, req.params).number, 'cancel'));
  r.post('/orders/:number/receive', pre, async (req) => svc.buyerOrderAction(user(req).id, parse(Number_, req.params).number, 'receive'));
  r.get('/plans', async (_req, reply) => { reply.header('cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600'); return { plans: await svc.listPlans() }; });

  r.get('/seller/shop', pre, async (req) => ({ shop: await svc.getShop(user(req).id) }));
  r.post('/seller/shop', pre, async (req, reply) => reply.code(201).send({ shop: await svc.createShop(user(req), parse(ShopBody, req.body)) }));
  r.patch('/seller/shop', pre, async (req) => ({ shop: await svc.updateShop(user(req).id, parse(ShopPatch, req.body)) }));
  r.post('/seller/plan', pre, async (req) => svc.requestPlan(user(req).id, parse(z.object({ plan: z.string().regex(/^[a-z][a-z0-9-]{1,19}$/) }), req.body).plan));
  r.get('/seller/stats', pre, async (req) => ({ stats: await svc.shopStats(user(req).id) }));
  r.post('/seller/orders/:number/:action', pre, async (req) => {
    const p = parse(Number_.extend({ action: z.enum(['confirm', 'ship', 'cancel']) }), req.params);
    return svc.shopOrderAction(user(req).id, p.number, ({ confirm: 'confirmed', ship: 'shipped', cancel: 'cancelled' } as const)[p.action]);
  });
  r.get('/seller/products', pre, async (req) => ({ products: await svc.listMyProducts(user(req).id) }));
  r.post('/seller/products', pre, async (req, reply) => reply.code(201).send(await svc.createProduct(user(req).id, parse(ProductBody, req.body))));
  r.put('/seller/products/:id', pre, async (req) => { await svc.updateProduct(user(req).id, Number(parse(IdParam, req.params).id), parse(ProductBody, req.body)); return { ok: true }; });
  r.delete('/seller/products/:id', pre, async (req) => { await svc.archiveProduct(user(req).id, Number(parse(IdParam, req.params).id)); return { ok: true }; });
  r.post('/seller/images', { preHandler: authenticate, bodyLimit: 2_300_000 }, async (req, reply) => reply.code(201).send(await svc.uploadImage(user(req).id, parse(UploadBody, req.body).data)));
  r.get('/products/suggest', async (req) => ({ suggestions: await svc.suggest(parse(z.object({ q: z.string().trim().min(2).max(80) }), req.query).q) }));
  r.post('/conversations', pre, async (req, reply) => {
    const b = parse(z.object({ productId: z.coerce.number().int().positive(), message: text(1000) }), req.body);
    return reply.code(201).send(await svc.startConversation(user(req).id, b.productId, b.message));
  });
  r.get('/conversations/lookup', pre, async (req) => svc.findConversation(user(req).id, parse(z.object({ productId: z.coerce.number().int().positive() }), req.query).productId));
  r.get('/conversations', pre, async (req) => ({ conversations: await svc.listConversations(user(req).id, parse(z.object({ as: z.enum(['buyer', 'seller']).default('buyer') }), req.query).as) }));
  r.get('/conversations/:id/messages', pre, async (req) => svc.listMessages(user(req).id, parse(ConvId, req.params).id));
  r.post('/conversations/:id/messages', pre, async (req) => svc.postMessage(user(req).id, parse(ConvId, req.params).id, parse(z.object({ message: text(1000) }), req.body).message));
  r.get('/seller/orders', pre, async (req) => ({ orders: await svc.listShopOrders(user(req).id) }));
}
