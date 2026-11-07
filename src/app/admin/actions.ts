"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notifyStatusChange } from "@/lib/notify";

export async function markOrderPaid(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "paid",
      status: "paid",
      paidAt: new Date(),
    },
  });
  await notifyStatusChange(orderId, "paid");
  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
  revalidatePath("/admin/ventes");
}

export async function updateOrderStatus(orderId: string, status: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
  await notifyStatusChange(orderId, status);
  revalidatePath("/admin/commandes");
}

export async function cancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.status === "cancelled" || order.status === "delivered") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });

    for (const item of order.items) {
      if (item.productId && item.quantity > 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  await notifyStatusChange(orderId, "cancelled");
  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
}

export async function markWithdrawalPaid(withdrawalId: string) {
  await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: "paid", processedAt: new Date() },
  });
  revalidatePath("/admin/retraits");
}

export async function rejectWithdrawal(withdrawalId: string) {
  await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: "rejected", processedAt: new Date() },
  });
  revalidatePath("/admin/retraits");
}

export async function approveSellerApplication(applicationId: string) {
  const app = await prisma.sellerApplication.findUnique({
    where: { id: applicationId },
  });

  if (!app || app.status !== "pending") {
    throw new Error("Candidature introuvable ou déjà traitée.");
  }

  // 1. Recherche de l'utilisateur par userId existant ou par son email (insensible à la casse)
  let user = app.userId ? await prisma.user.findUnique({ where: { id: app.userId } }) : null;
  if (!user && app.email) {
    user = await prisma.user.findUnique({
      where: { email: app.email.trim().toLowerCase() },
    });
  }

  // 2. Si l'utilisateur n'existe pas encore, le créer proprement
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: app.email.trim().toLowerCase(),
        name: app.fullName.trim(),
        phone: app.phone.trim(),
        role: "vendor",
      },
    });
  } else {
    // Si l'utilisateur existe déjà, s'assurer que son rôle est passé à 'vendor'
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "vendor" },
    });
  }

  // 3. Extraire le plan choisi si mentionné dans les notes
  let plan = "starter";
  if (app.notes) {
    const notesLower = app.notes.toLowerCase();
    if (notesLower.includes("élite") || notesLower.includes("elite")) plan = "elite";
    else if (notesLower.includes("pro")) plan = "pro";
  }

  // 4. Upsert de la boutique Vendeur (ouverture validée, certification à faire par le vendeur)
  await prisma.vendor.upsert({
    where: { userId: user.id },
    update: {
      shopName: app.shopName.trim(),
      whatsapp: app.phone.trim(),
      address: app.location || undefined,
      city: app.location || "Kinshasa",
      plan,
      isActive: true,
      isVerified: false, // Non certifiée au départ : la certification légale se fait ensuite par le vendeur
    },
    create: {
      userId: user.id,
      shopName: app.shopName.trim(),
      whatsapp: app.phone.trim(),
      address: app.location || null,
      city: app.location || "Kinshasa",
      plan,
      isActive: true,
      isVerified: false, // Non certifiée au départ : la certification légale se fait ensuite par le vendeur
    },
  });

  // 5. Mettre à jour le statut de la candidature
  await prisma.sellerApplication.update({
    where: { id: applicationId },
    data: { status: "approved", userId: user.id },
  });

  revalidatePath("/admin/vendeurs");
  revalidatePath("/admin");
}

export async function rejectSellerApplication(applicationId: string) {
  await prisma.sellerApplication.update({
    where: { id: applicationId },
    data: { status: "rejected" },
  });
  revalidatePath("/admin/vendeurs");
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  await prisma.product.update({
    where: { id: productId },
    data: { isActive },
  });
  revalidatePath("/admin/catalogue");
  revalidatePath("/admin");
  revalidatePath("/produits");
}

export async function updateProductStock(productId: string, stock: number) {
  await prisma.product.update({
    where: { id: productId },
    data: { stock: Math.max(0, stock) },
  });
  revalidatePath("/admin/catalogue");
  revalidatePath("/produits");
}

export async function deleteProduct(productId: string) {
  await prisma.product.delete({
    where: { id: productId },
  });
  revalidatePath("/admin/catalogue");
  revalidatePath("/admin");
  revalidatePath("/produits");
}

export async function updateUserRole(userId: string, role: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

export async function saveSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  revalidatePath("/admin/reglages");
}
