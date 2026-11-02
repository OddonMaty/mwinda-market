import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Mwinda Market...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@mwinda.market" },
    update: {},
    create: {
      email: "admin@mwinda.market",
      name: "Admin Mwinda",
      passwordHash,
      role: "admin",
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: "vendeur@mwinda.market" },
    update: {},
    create: {
      email: "vendeur@mwinda.market",
      name: "Boutique Test",
      phone: "+243818900125",
      passwordHash,
      role: "vendor",
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      shopName: "Boutique Test Kinshasa",
      whatsapp: "+243818900125",
      city: "Kinshasa",
      isActive: true,
      isVerified: true,
    },
  });

  await prisma.product.upsert({
    where: { id: "seed-product-1" },
    update: {},
    create: {
      id: "seed-product-1",
      vendorId: vendor.id,
      title: "Robe wax premium (démo)",
      description: "Produit de démonstration pour tests.",
      priceUsd: 45.0,
      stock: 10,
      isActive: true,
    },
  });

  await prisma.setting.upsert({
    where: { key: "mm_numbers" },
    update: {},
    create: {
      key: "mm_numbers",
      value: "M-Pesa: 0818 900 125 | Airtel: 0990 000 000",
    },
  });

  console.log("Seed terminé. Admin: admin@mwinda.market / admin123");
  console.log("Vendeur: vendeur@mwinda.market / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
