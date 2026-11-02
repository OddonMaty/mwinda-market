const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Connexion à Neon et initialisation des données...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  // 1. Compte Administrateur
  const admin = await prisma.user.upsert({
    where: { email: "admin@mwinda.market" },
    update: { role: "admin", passwordHash },
    create: {
      email: "admin@mwinda.market",
      name: "Admin Mwinda",
      phone: "+243818900125",
      passwordHash,
      role: "admin",
    },
  });
  console.log("Compte Admin vérifié :", admin.email);

  // 2. Compte Vendeur de test
  const vendorUser = await prisma.user.upsert({
    where: { email: "vendeur@mwinda.market" },
    update: { role: "vendor", passwordHash },
    create: {
      email: "vendeur@mwinda.market",
      name: "Boutique Kazi Tech (Kinshasa)",
      phone: "+243818900125",
      passwordHash,
      role: "vendor",
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: { shopName: "Kazi Tech Kinshasa", isActive: true, isVerified: true },
    create: {
      userId: vendorUser.id,
      shopName: "Kazi Tech Kinshasa",
      whatsapp: "+243818900125",
      address: "Boulevard du 30 Juin, Gombe",
      city: "Kinshasa",
      plan: "starter",
      isActive: true,
      isVerified: true,
    },
  });
  console.log("Boutique Vendeur vérifiée :", vendor.shopName);

  // 3. Articles de démonstration
  const productsData = [
    {
      id: "seed-prod-1",
      title: "Panneau Solaire Monocristallin 400W",
      description: "Panneau solaire haute efficacité pour kits résidentiels et commerciaux.",
      priceUsd: 145.0,
      stock: 25,
      imageUrl: "/images/products/panneau-solaire-400w.jpg",
      category: "Énergie Solaire & Onduleurs",
    },
    {
      id: "seed-prod-2",
      title: "Smartphone Samsung Galaxy A54 5G 128Go",
      description: "Écran Super AMOLED 120Hz, triple capteur photo, batterie 5000 mAh.",
      priceUsd: 285.0,
      stock: 12,
      imageUrl: "/images/products/samsung-galaxy-a54-5g.jpg",
      category: "Smartphones & Tablettes",
    },
    {
      id: "seed-prod-3",
      title: "Onduleur Hybride 3.5kVA / 24V MPPT",
      description: "Onduleur solaire hybride onde pure avec régulateur MPPT intégré 80A.",
      priceUsd: 380.0,
      stock: 8,
      imageUrl: "/images/products/onduleur-hybride-3500w.jpg",
      category: "Énergie Solaire & Onduleurs",
    },
    {
      id: "seed-prod-4",
      title: "Robe Wax Moderne Bazin Riche",
      description: "Confection artisanale congolaise haut de gamme, tissu 100% coton.",
      priceUsd: 65.0,
      stock: 15,
      imageUrl: "/images/products/robe-wax-moderne.jpg",
      category: "Mode & Habillement",
    },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        priceUsd: p.priceUsd,
        stock: p.stock,
        imageUrl: p.imageUrl,
        isActive: true,
      },
      create: {
        id: p.id,
        vendorId: vendor.id,
        title: p.title,
        description: p.description,
        priceUsd: p.priceUsd,
        stock: p.stock,
        imageUrl: p.imageUrl,
        isActive: true,
      },
    });
  }
  console.log(`${productsData.length} articles de démo insérés avec succès.`);

  // 4. Paramètres opérationnels de paiement
  await prisma.setting.upsert({
    where: { key: "official_mm_numbers" },
    update: {
      value: "Vodacom M-Pesa : +243 818 900 125 | Airtel Money : +243 999 000 000 | Orange Money : +243 890 000 000",
    },
    create: {
      key: "official_mm_numbers",
      value: "Vodacom M-Pesa : +243 818 900 125 | Airtel Money : +243 999 000 000 | Orange Money : +243 890 000 000",
    },
  });

  await prisma.setting.upsert({
    where: { key: "whatsapp_help_message" },
    update: {
      value: "Bonjour Mwinda Market, j'ai une question concernant ma commande.",
    },
    create: {
      key: "whatsapp_help_message",
      value: "Bonjour Mwinda Market, j'ai une question concernant ma commande.",
    },
  });

  console.log("Initialisation Neon terminée avec succès !");
}

main()
  .catch((e) => {
    console.error("Erreur d'initialisation :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

