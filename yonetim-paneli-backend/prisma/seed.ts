// prisma/seed.ts
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // 1) Admin kullanıcı var mı kontrol et
  const adminEmail = "admin@test.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const password = "123456";
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name: "System Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN" as UserRole,
        isActive: true,
      },
    });

    console.log(
      `Admin kullanıcı oluşturuldu: ${admin.email} / şifre: ${password}`
    );
  } else {
    console.log("Admin kullanıcı zaten mevcut, atlanıyor.");
  }

  // 2) Örnek ürünler yoksa birkaç tane ekle
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: "Laptop", price: 25000, stock: 5 },
        { name: "Mouse", price: 500, stock: 50 },
        { name: "Klavye", price: 1200, stock: 20 },
      ],
    });

    console.log("Örnek ürünler eklendi.");
  } else {
    console.log("Ürünler zaten var, atlanıyor.");
  }

  const defaultConfigs = [
    { key: "app_name", value: "Yönetim Paneli" },
    { key: "theme", value: "light" },
    { key: "default_page_limit", value: "10" }
  ];

  for (const config of defaultConfigs) {
    const exist = await prisma.systemConfig.findUnique({
      where: { key: config.key },
    });
    if (!exist) {
      await prisma.systemConfig.create({ data: config });
    }
  }
  console.log("Varsayılan sistem ayarları yüklendi.");


  console.log("Seeding bitti ✅");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
