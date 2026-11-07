import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo max par photo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function POST(req: NextRequest) {
  try {
    const uid = req.cookies.get("mwinda_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { vendor: true },
    });

    if (!user?.vendor) {
      return NextResponse.json({ error: "Compte vendeur requis." }, { status: 403 });
    }

    const form = await req.formData();
    // Supporte soit un champ unique "file", soit des champs multiples "files" ou "file"
    const rawFiles = form.getAll("files").concat(form.getAll("file"));
    const files = rawFiles.filter(
      (f): f is File => f instanceof File && f.size > 0
    );

    if (files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const processedUrls: string[] = [];

    // Traiter jusqu'à 5 photos
    for (const file of files.slice(0, 5)) {
      if (file.size > MAX_SIZE) {
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        continue;
      }

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Compression WebP optimisée 800x800 pour affichage rapide et stockage PostgreSQL léger
        const processed = await sharp(buffer)
          .rotate()
          .resize(900, 900, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 78, effort: 4 })
          .toBuffer();

        // Stockage en Data URL WebP : 100% compatible Vercel Serverless (pas d'écriture disque EROFS)
        const base64Data = `data:image/webp;base64,${processed.toString("base64")}`;
        processedUrls.push(base64Data);
      } catch (sharpErr) {
        console.error("Erreur sharp traitement image:", sharpErr);
      }
    }

    if (processedUrls.length === 0) {
      return NextResponse.json({ error: "Impossible de traiter les images (formats acceptés: JPEG, PNG, WebP)." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: processedUrls[0],
      urls: processedUrls,
      count: processedUrls.length,
    });
  } catch (err: any) {
    console.error("[api/vendor/upload]", err);
    return NextResponse.json({ error: err.message || "Erreur serveur lors de l'upload." }, { status: 500 });
  }
}
