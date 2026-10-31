"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function VendorDashboard() {
  const { user, isLoading, isVendor } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/connexion?redirect=/vendeur/dashboard");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isVendor) return;
    // Recharge simple via les pages admin ou future API dédiée
    // Pour l'instant on laisse le vendeur créer des produits
  }, [isVendor]);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/vendor/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priceUsd: Number(price), stock: Number(stock) }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Produit ajouté.");
      setTitle("");
      setPrice("");
      setStock("1");
    } else {
      setMsg(data.error || "Erreur");
    }
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
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Ma boutique</h1>

      <form onSubmit={addProduct} className="bg-surface-container-lowest border rounded-xl p-4 space-y-3">
        <h2 className="font-bold">Ajouter un article</h2>
        <input
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="Nom du produit"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-lg p-2 text-sm"
            type="number"
            step="0.01"
            placeholder="Prix USD"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <input
            className="w-24 border rounded-lg p-2 text-sm"
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <button type="submit" className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-bold">
          Ajouter
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>

      <div className="text-sm text-on-surface-variant">
        Les produits ajoutés apparaissent dans le catalogue public dès qu'ils sont actifs.
        La liste complète et les commandes sont visibles côté admin pour le moment.
      </div>
    </div>
  );
}
