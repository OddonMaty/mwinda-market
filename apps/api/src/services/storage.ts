import { put } from '@vercel/blob';

/** Stockage externe des photos : renvoie l'adresse publique (https) du fichier enregistré. */
export interface ImageStore {
  put(key: string, bytes: Buffer, contentType: string): Promise<string>;
}

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Vercel Blob (public, adresse non devinable). Le jeton est lu dans BLOB_READ_WRITE_TOKEN. */
export class VercelBlobStore implements ImageStore {
  constructor(private token: string) {}
  async put(key: string, bytes: Buffer, contentType: string): Promise<string> {
    const r = await put(`${key}.${EXT[contentType] ?? 'bin'}`, bytes, { access: 'public', contentType, token: this.token, addRandomSuffix: true, cacheControlMaxAge: 31536000 });
    return r.url;
  }
}
