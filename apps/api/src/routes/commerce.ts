import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CommerceService } from '../services/commerce.js';

const phone = z.string().trim().regex(/^\+[1-9][0-9]{6,14}$/, 'phone_e164');
const text = (max: number) => z.string().trim().min(1).max(max);
const list = z.array(z.string().trim().min(1).max(60)).max(20).default([]);
const imageUrl = z.string().trim().url().max(500).refine((u) => u.startsWith('https://'), 'https_required');

const OrderBody = z.object({
  items: z.array(z.object({ id: z.coerce.number().int().positive(), quantity: z.coerce.number().int().min(1).max(100), color: z.string().max(60).optional(), size: z.string().max(60).optional() })).min(1).max(50),
  shippingPhone: phone, shippingCity: text(80), shippingAddress: text(500),
});
const AddressBody = z.object({ label: z.string().trim().max(60).optional(), city: text(80), address: text(500), phone });
const ShopBody = z.object({ name: text(100), phone: phone.optional(), description: z.string().trim().max(1000).optional(), citySlug: z.string().max(100).optional() });
const DEPARTMENTS = ['electronique', 'construction', 'vetements', 'imprimantes'] as const;
const ProductBody = z.object({
  name: text(200), description: text(5000), priceUsd: z.number().positive().max(1_000_000), originalPriceUsd: z.number().positive().max(1_000_000).nullable().optional(),
  department: z.enum(DEPARTMENTS), category: text(80), colors: list, sizes: list, inStock: z.boolean().default(true), images: z.array(imageUrl).max(5).default([]),
}).refine((p) => p.originalPriceUsd == null || p.originalPriceUsd > p.priceUsd, { message: 'original_price_must_exceed_price', path: ['originalPriceUsd'] });
const IdParam = z.object({ id: z.string().regex(/^[0-9A-Za-z]{1,26}$/) });

type Parse = <T extends z.ZodTypeAny>(schema: T, data: unknown) => z.infer<T>;
interface Ctx { svc: CommerceService; authenticate: (req: FastifyRequest) => Promise<void>; parse: Parse }

export function commerceRoutes(r: FastifyInstance, { svc, authenticate, parse }: Ctx): void {
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

  r.get('/seller/shop', pre, async (req) => ({ shop: await svc.getShop(user(req).id) }));
  r.post('/seller/shop', pre, async (req, reply) => reply.code(201).send({ shop: await svc.createShop(user(req), parse(ShopBody, req.body)) }));
  r.get('/seller/products', pre, async (req) => ({ products: await svc.listMyProducts(user(req).id) }));
  r.post('/seller/products', pre, async (req, reply) => reply.code(201).send(await svc.createProduct(user(req).id, parse(ProductBody, req.body))));
  r.put('/seller/products/:id', pre, async (req) => { await svc.updateProduct(user(req).id, Number(parse(IdParam, req.params).id), parse(ProductBody, req.body)); return { ok: true }; });
  r.delete('/seller/products/:id', pre, async (req) => { await svc.archiveProduct(user(req).id, Number(parse(IdParam, req.params).id)); return { ok: true }; });
  r.get('/seller/orders', pre, async (req) => ({ orders: await svc.listShopOrders(user(req).id) }));
}
