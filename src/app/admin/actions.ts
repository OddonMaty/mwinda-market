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

  let userId = app.userId;

  if (!userId) {
    const user = await prisma.user.create({
      data: {
        email: app.email,
        name: app.fullName,
        phone: app.phone,
        role: "vendor",
      },
    });
    userId = user.id;
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "vendor" },
    });
  }

  await prisma.vendor.create({
    data: {
      userId,
      shopName: app.shopName,
      whatsapp: app.phone,
      address: app.location || null,
      isActive: true,
      isVerified: true,
      plan: "starter",
    },
  });

  await prisma.sellerApplication.update({
    where: { id: applicationId },
    data: { status: "approved", userId },
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
