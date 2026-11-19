import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError } from '../errors.js';
import { LEGAL_SLUGS, type AdminRole, type AdminService } from '../services/admin.js';

type Parse = <T extends z.ZodTypeAny>(schema: T, data: unknown) => z.infer<T>;
interface Ctx { svc: AdminService; authenticate: (req: FastifyRequest) => Promise<void>; parse: Parse }

const Id = z.object({ id: z.string().regex(/^[0-9A-Za-z]{1,26}$/) });
const Query = z.object({ q: z.string().max(100).optional(), status: z.string().max(12).optional() });
const Roles = z.object({ roles: z.array(z.enum(['moderator', 'finance', 'superadmin'])).max(3) });
const PlanBody = z.object({
  name: z.string().trim().min(1).max(60), priceUsd: z.number().min(0).max(100000), commissionBps: z.number().int().min(0).max(3000),
  maxProducts: z.number().int().positive().max(1_000_000).nullable(), features: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  sort: z.number().int().min(0).max(100).default(0), active: z.boolean().default(true),
});
const PageBody = z.object({ title: z.string().trim().min(1).max(150), body: z.string().trim().min(1).max(60000) });

export function publicPlatformRoutes(r: FastifyInstance, svc: AdminService, parse: Parse): void {
  r.get('/countries', async (_req, reply) => { reply.header('cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600'); return { countries: await svc.countries() }; });
  r.get('/pages/:slug', async (req, reply) => {
    reply.header('cache-control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300');
    return { page: await svc.page(parse(z.object({ slug: z.enum(LEGAL_SLUGS) }), req.params).slug) };
  });
}

export function adminRoutes(r: FastifyInstance, { svc, authenticate, parse }: Ctx): void {
  /** Accès réservé : chaque route liste les rôles autorisés (le super-administrateur peut tout faire). */
  const guard = (...allowed: AdminRole[]) => ({
    preHandler: async (req: FastifyRequest) => {
      await authenticate(req);
      const roles = await svc.roles(req.auth!.user.id);
      if (!roles.includes('superadmin') && !roles.some((x) => allowed.includes(x))) throw new AppError(403, 'forbidden', 'Accès refusé.');
    },
  });
  const me = (req: FastifyRequest) => req.auth!.user.id;
  const ok = { ok: true } as const;
  const MOD: AdminRole[] = ['moderator', 'finance'];

  r.get('/admin/stats', guard(...MOD), async () => ({ stats: await svc.stats() }));
  r.get('/admin/me', guard(...MOD), async (req) => ({ roles: await svc.roles(me(req)) }));

  r.get('/admin/users', guard('moderator'), async (req) => ({ users: await svc.users(parse(Query, req.query).q) }));
  r.patch('/admin/users/:id', guard('moderator'), async (req) => { await svc.setUserStatus(me(req), parse(Id, req.params).id, parse(z.object({ status: z.enum(['active', 'suspended']) }), req.body).status); return ok; });
  r.put('/admin/users/:id/roles', guard(), async (req) => { await svc.setUserRoles(me(req), parse(Id, req.params).id, parse(Roles, req.body).roles); return ok; });

  r.get('/admin/shops', guard('moderator'), async (req) => ({ shops: await svc.shops(parse(Query, req.query).q) }));
  r.patch('/admin/shops/:id', guard('moderator'), async (req) => {
    const b = parse(z.object({ status: z.enum(['pending', 'active', 'suspended']).optional(), plan: z.string().max(20).optional(), planMonths: z.number().int().min(1).max(36).optional() }), req.body);
    if (b.plan) await guard('finance').preHandler(req); // changer le plan d'une boutique relève aussi de la finance
    await svc.updateShop(me(req), parse(Id, req.params).id, b);
    return ok;
  });

  r.get('/admin/products', guard('moderator'), async (req) => { const q = parse(Query, req.query); return { products: await svc.products(q.q, q.status) }; });
  r.patch('/admin/products/:id', guard('moderator'), async (req) => { await svc.setProductStatus(me(req), Number(parse(Id, req.params).id), parse(z.object({ status: z.enum(['active', 'archived']) }), req.body).status); return ok; });

  r.get('/admin/orders', guard('finance', 'moderator'), async (req) => { const q = parse(Query, req.query); return { orders: await svc.orders(q.q, q.status) }; });
  r.patch('/admin/orders/:number', guard('finance'), async (req) => {
    await svc.setOrderStatus(me(req), parse(z.object({ number: z.string().regex(/^STM-[0-9]{1,12}$/) }), req.params).number, parse(z.object({ status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']) }), req.body).status);
    return ok;
  });

  r.get('/admin/plans', guard('finance'), async () => ({ plans: await svc.plans() }));
  r.put('/admin/plans/:code', guard(), async (req) => { await svc.savePlan(me(req), parse(z.object({ code: z.string().regex(/^[a-z][a-z0-9-]{1,19}$/) }), req.params).code, parse(PlanBody, req.body)); return ok; });
  r.get('/admin/plan-requests', guard('finance'), async () => ({ requests: await svc.planRequests() }));
  r.post('/admin/plan-requests/:id/:decision', guard('finance'), async (req) => {
    const p = parse(Id.extend({ decision: z.enum(['approve', 'reject']) }), req.params);
    await svc.decidePlanRequest(me(req), p.id, p.decision === 'approve');
    return ok;
  });

  r.get('/admin/countries', guard('moderator'), async () => ({ countries: await svc.allCountries() }));
  r.patch('/admin/countries/:code', guard(), async (req) => { await svc.setCountryActive(me(req), parse(z.object({ code: z.string().length(2).toUpperCase() }), req.params).code, parse(z.object({ active: z.boolean() }), req.body).active); return ok; });
  r.post('/admin/cities', guard('moderator'), async (req) => { const b = parse(z.object({ countryCode: z.string().length(2).toUpperCase(), name: z.string().trim().min(2).max(100) }), req.body); await svc.addCity(me(req), b.countryCode, b.name); return ok; });

  r.get('/admin/pages', guard('moderator'), async () => ({ pages: await svc.pages() }));
  r.put('/admin/pages/:slug', guard('moderator'), async (req) => { const b = parse(PageBody, req.body); await svc.savePage(me(req), parse(z.object({ slug: z.enum(LEGAL_SLUGS) }), req.params).slug, b.title, b.body); return ok; });
  r.delete('/admin/pages/:slug', guard('moderator'), async (req) => { await svc.deletePage(me(req), parse(z.object({ slug: z.enum(LEGAL_SLUGS) }), req.params).slug); return ok; });

  r.get('/admin/audit', guard(), async () => ({ log: await svc.auditLog() }));
}
