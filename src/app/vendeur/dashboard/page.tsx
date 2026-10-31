"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function VendorDashboard() {
  const { user, isLoading, isVendor } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/connexion?redirect=/vendeur/dashboard");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isVendor) return;
    fetch("/api/vendor/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {});
  }, [isVendor]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/vendor/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setImageUrl(data.url);
      setMsg("Image téléversée.");
    } else {
      setMsg(data.error || "Échec upload");
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/vendor/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        priceUsd: Number(price),
        stock: Number(stock),
        imageUrl: imageUrl || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Produit ajouté.");
      setTitle("");
      setPrice("");
      setStock("1");
      setImageUrl("");
    } else {
      setMsg(data.error || "Erreur");
    }
  };

  const changeStatus = async (id: string, status: string) => {
    await fetch(`/api/vendor/orders/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const res = await fetch("/api/vendor/orders");
    const data = await res.json();
    setOrders(data.orders || []);
  };

  if (isLoading) return <div className="p-6">Chargement…</div>;
  if (!user) return null;
  if (!isVendor) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-3">
        <h1 className="text-xl font-bold">Espace vendeur</h1>
        <p>Votre compte n'est pas encore vendeur approuvé.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-primary">Ma boutique</h1>

      <section className="space-y-3">
        <h2 className="font-bold">Commandes</h2>
        {orders.length === 0 && <p className="text-sm text-on-surface-variant">Aucune commande.</p>}
        {orders.map((o) => (
          <div key={o.id} className="border rounded-lg p-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-mono font-bold">{o.reference}</div>
              <div>{o.customerName} — {Number(o.amountUsd).toFixed(2)} $</div>
              <div className="text-xs">Statut : {o.status}</div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {o.status === "paid" && (
                <button onClick={() => changeStatus(o.id, "preparing")} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  J'ai le colis
                </button>
              )}
              {o.status === "preparing" && (
                <button onClick={() => changeStatus(o.id, "shipped")} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                  Expédié
                </button>
              )}
              {o.status === "shipped" && (
                <button onClick={() => changeStatus(o.id, "delivered")} className="text-xs bg-emerald-600 text-white px-2 py-1 rounded">
                  Livré
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <form onSubmit={addProduct} className="bg-surface-container-lowest border rounded-xl p-4 space-y-3">
        <h2 className="font-bold">Ajouter un article</h2>
        <input className="w-full border rounded-lg p-2 text-sm" placeholder="Nom" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div>
          <label className="text-xs font-bold">Photo</label>
          <input type="file" accept="image/*" onChange={handleFile} className="block text-sm mt-1" />
          {uploading && <p className="text-xs">Téléversement…</p>}
          {imageUrl && <p className="text-xs text-emerald-600">Image prête : {imageUrl}</p>}
        </div>
        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg p-2 text-sm" type="number" step="0.01" placeholder="Prix USD" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <input className="w-24 border rounded-lg p-2 text-sm" type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <button type="submit" className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-bold">Ajouter</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </div>
  );
}
