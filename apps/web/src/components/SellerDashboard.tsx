'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { USD_TO_CDF, departmentLabels, formatPrice, productImageUrl } from '../lib';
import { api, errorMessage, useAuth } from './AuthProvider';
import { PhotoPicker } from './PhotoPicker';

interface Shop { id: string; name: string; isOfficial: boolean; status: string; countryCode: string | null; city: string | null; plan: string; planName: string; planExpiresAt: string | null; commissionBps: number; maxProducts: number | null; productCount: number; pendingPlan: string | null }
interface Stats { salesUsd: number; commissionUsd: number; netUsd: number; inProgressUsd: number; pendingLines: number; deliveredLines: number }
interface SProduct { id: number; name: string; description: string; priceUsd: number; originalPriceUsd: number | null; department: string; category: string; colors: string[]; sizes: string[]; inStock: boolean; images: string[] }
interface SOrder { number: string; status: string; createdAt: string; customer: string; city: string; phone: string; address: string; totalUsd: number; commissionUsd: number; netUsd: number; items: { name: string; quantity: number; unitPriceUsd: number; color: string; size: string }[] }
const STATUS: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };
const csv = (v: FormDataEntryValue | null): string[] => String(v ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const toUsd = (fc: FormDataEntryValue | null): number => Math.round((Number(fc) / USD_TO_CDF) * 100) / 100;

export function SellerDashboard() {
  const router = useRouter();
  const { user, ready, logout, notify } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<SProduct[]>([]);
  const [orders, setOrders] = useState<SOrder[]>([]);
  const [form, setForm] = useState<{ open: boolean; editing: SProduct | null }>({ open: false, editing: null });
  const [promo, setPromo] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const s = await api<{ shop: Shop | null }>('/seller/shop');
    if (!s.ok || !s.data.shop) { router.replace('/vendeur'); return; }
    setShop(s.data.shop);
    const [p, o, st] = await Promise.all([api<{ products: SProduct[] }>('/seller/products'), api<{ orders: SOrder[] }>('/seller/orders'), api<{ stats: Stats }>('/seller/stats')]);
    if (p.ok) setProducts(p.data.products);
    if (o.ok) setOrders(o.data.orders);
    if (st.ok) setStats(st.data.stats);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/vendeur'); return; }
    void load();
  }, [ready, user, load, router]);

  if (!ready || !user || !shop) return <p className="empty-collection">Chargement…</p>;

  function openForm(p: SProduct | null) { setForm({ open: true, editing: p }); setPromo(!!p?.originalPriceUsd); setPhotos(p?.images ?? []); }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: String(f.get('name')).trim(), description: String(f.get('description')).trim(), department: f.get('department'), category: String(f.get('category')).trim(),
      priceUsd: toUsd(f.get('price')), originalPriceUsd: promo && f.get('originalPrice') ? toUsd(f.get('originalPrice')) : null,
      colors: csv(f.get('colors')), sizes: csv(f.get('sizes')), inStock: !!f.get('inStock'), images: photos,
    };
    const editing = form.editing;
    const r = await api(editing ? `/seller/products/${editing.id}` : '/seller/products', { method: editing ? 'PUT' : 'POST', body });
    if (!r.ok) return notify(r.data.code === 'validation_error' ? 'Vérifiez les champs : prix barré supérieur au prix, 5 photos maximum.' : errorMessage(r.data.code));
    setForm({ open: false, editing: null });
    await load();
    notify(editing ? 'Produit modifié' : 'Produit publié');
  }

  async function orderAction(number: string, action: 'confirm' | 'ship' | 'cancel') {
    if (action === 'cancel' && !window.confirm('Annuler cette commande ?')) return;
    const r = await api(`/seller/orders/${number}/${action}`, { method: 'POST' });
    if (!r.ok) return notify(r.data.message ?? errorMessage(r.data.code));
    await load();
    notify(action === 'confirm' ? 'Commande confirmée' : action === 'ship' ? 'Commande marquée comme expédiée' : 'Commande annulée');
  }

  async function remove(p: SProduct) {
    if (!window.confirm(`Supprimer « ${p.name} » ?`)) return;
    const r = await api(`/seller/products/${p.id}`, { method: 'DELETE' });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await load();
    notify('Produit supprimé');
  }

  const ex = form.editing;
  const inStock = products.filter((p) => p.inStock).length;
  return (
    <>
      <div className="seller-dashboard-header">
        <div>
          <h1>{shop.name} {shop.isOfficial && <span className="product-badge official-badge" style={{ position: 'static', verticalAlign: 'middle' }}>BOUTIQUE OFFICIELLE</span>}</h1>
          <p>Espace vendeur — {user.firstName} {user.lastName} · {user.email}</p>
        </div>
        <div className="seller-dashboard-actions">
          <button type="button" className="btn btn-primary" onClick={() => openForm(null)}><i className="fas fa-plus" /> Ajouter un produit</button>
          <button type="button" className="btn btn-outline" onClick={() => void logout()}>Déconnexion</button>
        </div>
      </div>

      <div className="seller-product-form-wrapper" style={{ marginBottom: '1.25rem' }}>
        <div className="seller-dashboard-header" style={{ padding: 0, marginBottom: 0, borderBottom: 'none' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem' }}>Plan {shop.planName}{shop.isOfficial ? '' : ` · commission ${shop.commissionBps / 100} %`}</h2>
            <p style={{ fontSize: '0.85rem' }}>
              {shop.productCount} produit{shop.productCount > 1 ? 's' : ''} sur {shop.maxProducts ?? 'illimité'}
              {shop.planExpiresAt ? ` · valable jusqu’au ${new Date(shop.planExpiresAt).toLocaleDateString('fr-FR')}` : ''}
              {shop.countryCode ? ` · ${shop.city ?? 'Ville non précisée'} (${shop.countryCode})` : ''}
              {shop.pendingPlan ? ` · demande de plan ${shop.pendingPlan} en attente de validation` : ''}
            </p>
          </div>
          {!shop.isOfficial && <Link href="/tarifs" className="btn btn-outline">Changer de plan</Link>}
        </div>
      </div>

      <div className="seller-stats">
        {stats && <div className="seller-stat-card"><span className="seller-stat-value">{formatPrice(stats.netUsd)}</span><span className="seller-stat-label">Gains nets (commandes livrées)</span></div>}
        {stats && <div className="seller-stat-card"><span className="seller-stat-value">{formatPrice(stats.commissionUsd)}</span><span className="seller-stat-label">Commission payée</span></div>}
        {stats && <div className="seller-stat-card"><span className="seller-stat-value">{formatPrice(stats.inProgressUsd)}</span><span className="seller-stat-label">Commandes en cours</span></div>}
        <div className="seller-stat-card"><span className="seller-stat-value">{products.length}</span><span className="seller-stat-label">Produits en ligne</span></div>
        <div className="seller-stat-card"><span className="seller-stat-value">{inStock}</span><span className="seller-stat-label">En stock</span></div>
        <div className="seller-stat-card"><span className="seller-stat-value">{formatPrice(products.reduce((s, p) => s + p.priceUsd, 0))}</span><span className="seller-stat-label">Valeur du catalogue</span></div>
      </div>

      {form.open && (
        <div id="sellerProductFormWrapper" className="seller-product-form-wrapper" key={ex?.id ?? 'new'}>
          <h2>{ex ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
          <form className="contact-form" onSubmit={save}>
            <div className="form-row">
              <input type="text" name="name" placeholder="Nom du produit *" defaultValue={ex?.name ?? ''} required />
              <select name="department" required defaultValue={ex?.department ?? ''}>
                <option value="" disabled>Choisir un rayon *</option>
                {Object.entries(departmentLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div className="form-row"><input type="text" name="category" placeholder="Catégorie * (ex. Smartphone, Chemises…)" defaultValue={ex?.category ?? ''} required /></div>
            <input type="number" name="price" step="1" min="1" placeholder="Prix de vente (FC) *" defaultValue={ex ? Math.round(ex.priceUsd * USD_TO_CDF) : ''} required />
            <label className="checkbox-label promo-checkbox"><input type="checkbox" checked={promo} onChange={(e) => setPromo(e.target.checked)} /><span>🔥 Mettre ce produit en promotion</span></label>
            <div className="form-row" style={{ display: promo ? 'grid' : 'none' }}>
              <input type="number" name="originalPrice" step="1" min="0" placeholder="Prix barré (FC) — plus élevé que le prix de vente" defaultValue={ex?.originalPriceUsd ? Math.round(ex.originalPriceUsd * USD_TO_CDF) : ''} />
            </div>
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <div className="form-row">
              <input type="text" name="colors" placeholder="Couleurs (séparées par des virgules)" defaultValue={ex?.colors.join(', ') ?? ''} />
              <input type="text" name="sizes" placeholder="Capacités / tailles (séparées par des virgules)" defaultValue={ex?.sizes.join(', ') ?? ''} />
            </div>
            <textarea name="description" rows={4} placeholder="Description du produit *" defaultValue={ex?.description ?? ''} required />
            <label className="checkbox-label"><input type="checkbox" name="inStock" defaultChecked={ex ? ex.inStock : true} /><span>Produit en stock</span></label>
            <p className="seller-form-note">Le rayon détermine dans quelle colonne du menu « Nos produits » votre article apparaîtra sur le site.</p>
            <div className="seller-form-actions">
              <button type="submit" className="btn btn-primary">{ex ? 'Enregistrer les modifications' : 'Publier le produit'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setForm({ open: false, editing: null })}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="seller-products-table-wrapper">
        <h2>Mes produits</h2>
        {products.length === 0 ? (
          <p className="empty-collection">Vous n&apos;avez pas encore ajouté de produit. Cliquez sur « Ajouter un produit » pour commencer à vendre.</p>
        ) : (
          <div className="seller-products-table-scroll">
            <table className="seller-products-table">
              <thead><tr><th></th><th>Nom</th><th>Rayon</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><img src={productImageUrl(p.images[0], 60, 60)} alt={p.name} className="seller-product-thumb" /></td>
                    <td>{p.name}</td>
                    <td>{departmentLabels[p.department] ?? p.department}</td>
                    <td>{p.category}</td>
                    <td>{formatPrice(p.priceUsd)}</td>
                    <td className={p.inStock ? 'in-stock' : 'out-of-stock'}>{p.inStock ? 'En stock' : 'Rupture'}</td>
                    <td className="seller-product-row-actions">
                      <button type="button" className="link-btn" onClick={() => openForm(p)}>Modifier</button>
                      <button type="button" className="link-btn" onClick={() => void remove(p)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="seller-products-table-wrapper">
        <h2>Commandes reçues</h2>
        {orders.length === 0 ? <p className="empty-collection">Aucune commande pour le moment.</p> : orders.map((o) => (
          <div className="seller-product-form-wrapper" style={{ marginBottom: '1.25rem' }} key={o.number}>
            <div className="seller-dashboard-header" style={{ padding: '0 0 1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem' }}>Commande {o.number}</h2>
                <p style={{ fontSize: '0.85rem' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {o.customer} · {o.city} · {o.phone}</p>
              </div>
              <span className="product-badge" style={{ position: 'static' }}>{STATUS[o.status] ?? o.status}</span>
            </div>
            <div className="seller-products-table-scroll">
              <table className="seller-products-table">
                <thead><tr><th>Article</th><th>Qté</th><th>Prix</th></tr></thead>
                <tbody>{o.items.map((i, k) => <tr key={k}><td>{i.name}{i.color ? ` — ${i.color}` : ''}{i.size ? ` — ${i.size}` : ''}</td><td>{i.quantity}</td><td>{formatPrice(i.unitPriceUsd * i.quantity)}</td></tr>)}</tbody>
              </table>
            </div>
            <p style={{ textAlign: 'right', marginTop: '0.75rem', fontWeight: 700 }}>Total : {formatPrice(o.totalUsd)}{!shop.isOfficial && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · commission {formatPrice(o.commissionUsd)} · net {formatPrice(o.netUsd)}</span>}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Livraison : {o.address}</p>
            {(o.status === 'pending' || o.status === 'confirmed') && (
              <div className="seller-form-actions" style={{ marginTop: '1rem' }}>
                {o.status === 'pending' && <button type="button" className="btn btn-primary" onClick={() => void orderAction(o.number, 'confirm')}>Confirmer la commande</button>}
                {o.status === 'confirmed' && <button type="button" className="btn btn-primary" onClick={() => void orderAction(o.number, 'ship')}>Marquer comme expédiée</button>}
                <button type="button" className="btn btn-outline" onClick={() => void orderAction(o.number, 'cancel')}>Annuler</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
