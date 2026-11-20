'use client';

import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { productImageUrl } from '../lib';
import { api, errorMessage, useAuth } from './AuthProvider';

const MAX_PHOTOS = 5;
const MAX_SIDE = 1200;

/** Réduit la photo (téléphones : 4 à 12 Mo) à ~150 Ko avant l'envoi. Renvoie du base64 JPEG. */
async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#fff'; // PNG transparents → fond blanc
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const q of [0.82, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', q));
    if (blob && blob.size <= 1_300_000) {
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(bin);
    }
  }
  throw new Error('too_large');
}

export function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const { notify } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);

  async function pick(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) notify(`${MAX_PHOTOS} photos maximum : seules les ${room} premières sont ajoutées.`);
    const added: string[] = [];
    const list = [...files].slice(0, Math.max(room, 0));
    setBusy(list.length);
    for (const f of list) {
      try {
        const data = await compress(f);
        const r = await api<{ url: string }>('/seller/images', { method: 'POST', body: { data } });
        if (r.ok) added.push(r.data.url);
        else notify(errorMessage(r.data.code));
      } catch {
        notify(`« ${f.name} » n'a pas pu être lue. Utilisez une photo JPEG, PNG ou WebP.`);
      }
      setBusy((n) => n - 1);
    }
    if (added.length) onChange([...photos, ...added]);
    if (input.current) input.current.value = '';
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Photos du produit ({photos.length}/{MAX_PHOTOS}) <span className="font-normal text-muted-foreground">— la première est la photo principale</span></p>
      <div className="flex flex-wrap gap-3">
        {photos.map((url, i) => (
          <div key={url} className="relative w-24">
            <img src={productImageUrl(url, 96, 96)} alt={`Photo ${i + 1}`} className={`size-24 rounded-xl object-cover ${i === 0 ? 'border-2 border-primary' : 'border'}`} />
            <button type="button" aria-label="Retirer la photo" onClick={() => onChange(photos.filter((u) => u !== url))} className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-sm text-white">×</button>
            {i > 0 && <button type="button" className="mt-1 text-xs text-primary hover:underline" onClick={() => onChange([url, ...photos.filter((u) => u !== url)])}>Mettre en premier</button>}
          </div>
        ))}
        {busy > 0 && <div className="flex size-24 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">Envoi…</div>}
        {photos.length < MAX_PHOTOS && busy === 0 && (
          <button type="button" onClick={() => input.current?.click()} className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-primary/50 bg-accent/50 text-xs font-medium text-accent-foreground hover:bg-accent">
            <Camera className="size-5 text-primary" />Ajouter
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple hidden onChange={(e) => void pick(e.target.files)} />
      <p className="text-xs text-muted-foreground">Prenez une photo ou choisissez-en dans votre galerie : elles sont réduites automatiquement avant l&apos;envoi.</p>
    </div>
  );
}
