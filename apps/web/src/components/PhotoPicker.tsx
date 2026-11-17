'use client';

import { useRef, useState } from 'react';
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
    <div className="form-group">
      <label>Photos du produit ({photos.length}/{MAX_PHOTOS}) — la première est la photo principale</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {photos.map((url, i) => (
          <div key={url} style={{ position: 'relative', width: 96 }}>
            <img src={productImageUrl(url, 96, 96)} alt={`Photo ${i + 1}`} style={{ width: 96, height: 96, objectFit: 'cover', border: i === 0 ? '2px solid var(--primary)' : '1px solid var(--border)' }} />
            <button type="button" aria-label="Retirer la photo" onClick={() => onChange(photos.filter((u) => u !== url))} style={{ position: 'absolute', top: 2, right: 2, width: 24, height: 24, border: 'none', background: 'rgba(0,0,0,.65)', color: '#fff', cursor: 'pointer' }}>×</button>
            {i > 0 && <button type="button" className="link-btn" style={{ fontSize: '0.7rem', padding: 0 }} onClick={() => onChange([url, ...photos.filter((u) => u !== url)])}>Mettre en premier</button>}
          </div>
        ))}
        {busy > 0 && <div style={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Envoi…</div>}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple hidden onChange={(e) => void pick(e.target.files)} />
      <button type="button" className="btn btn-outline" disabled={busy > 0 || photos.length >= MAX_PHOTOS} onClick={() => input.current?.click()}>
        <i className="fas fa-camera" /> Ajouter des photos
      </button>
      <p className="seller-form-note" style={{ marginTop: '0.35rem' }}>Prenez une photo ou choisissez-en dans votre galerie : elles sont réduites automatiquement avant l&apos;envoi.</p>
    </div>
  );
}
