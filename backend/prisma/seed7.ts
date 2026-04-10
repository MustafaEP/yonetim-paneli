/**
 * seed7.ts - Tüm verileri temizler ve temel verileri ekler.
 *
 * Eklenenler:
 *  - Tüm iller ve ilçeler (sehirler.json / ilceler.json)
 *  - Admin kullanıcısı (.env'den ADMIN_EMAIL / ADMIN_PASSWORD)
 *  - 1 adet üye grubu (seed.ts ile aynı: 'Üye')
 *  - Admin'e ek olarak: IL_BASKANI, ILCE_BASKANI, GENEL_BASKAN rolleri
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Permission } from '../src/auth/permission.enum';

// Yerel geliştirme için backend/.env dosyasını yükle.
// Docker/VPS ortamında env değişkenleri docker-compose üzerinden zaten set edilmiştir.
dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface SehirData {
  sehir_id: string;
  sehir_adi: string;
}

interface IlceData {
  ilce_id: string;
  ilce_adi: string;
  sehir_id: string;
  sehir_adi: string;
}

const isProduction = __dirname.includes('dist');
const prismaDir = isProduction ? path.join(__dirname, '..', '..', 'prisma') : __dirname;

const sehirlerData: SehirData[] = JSON.parse(
  fs.readFileSync(path.join(prismaDir, 'sehirler.json'), 'utf-8'),
);
const ilcelerData: IlceData[] = JSON.parse(
  fs.readFileSync(path.join(prismaDir, 'ilceler.json'), 'utf-8'),
);

const prisma = new PrismaClient();

const IL_BASKANI_PERMISSIONS = [
  Permission.MEMBER_LIST,
  Permission.MEMBER_VIEW,
  Permission.MEMBER_CREATE_APPLICATION,
  Permission.MEMBER_UPDATE,
  Permission.REGION_LIST,
  Permission.DOCUMENT_MEMBER_HISTORY_VIEW,
  Permission.DOCUMENT_UPLOAD,
  Permission.INSTITUTION_LIST,
  Permission.INSTITUTION_VIEW,
  Permission.INSTITUTION_CREATE,
  Permission.PROFESSION_VIEW,
  Permission.PROFESSION_CREATE,
  Permission.TEVKIFAT_VIEW,
  Permission.TEVKIFAT_TITLE_VIEW,
  Permission.TEVKIFAT_TITLE_CREATE,
  Permission.TEVKIFAT_CENTER_VIEW,
  Permission.TEVKIFAT_CENTER_CREATE,
  Permission.INVOICE_VIEW,
  Permission.INVOICE_CREATE,
];

const ILCE_BASKANI_PERMISSIONS = [
  Permission.MEMBER_LIST,
  Permission.MEMBER_VIEW,
  Permission.MEMBER_CREATE_APPLICATION,
  Permission.MEMBER_UPDATE,
  Permission.REGION_LIST,
  Permission.DOCUMENT_MEMBER_HISTORY_VIEW,
  Permission.DOCUMENT_UPLOAD,
  Permission.INSTITUTION_LIST,
  Permission.INSTITUTION_VIEW,
  Permission.INSTITUTION_CREATE,
  Permission.PROFESSION_VIEW,
  Permission.PROFESSION_CREATE,
  Permission.TEVKIFAT_VIEW,
  Permission.TEVKIFAT_TITLE_VIEW,
  Permission.TEVKIFAT_TITLE_CREATE,
  Permission.TEVKIFAT_CENTER_VIEW,
  Permission.INVOICE_VIEW,
];

const GENEL_BASKAN_PERMISSIONS = Object.values(Permission).filter(
  (permission) =>
    permission !== Permission.SYSTEM_SETTINGS_VIEW &&
    permission !== Permission.SYSTEM_SETTINGS_MANAGE,
);

async function createRoleWithPermissions(
  name: string,
  description: string,
  permissions: string[],
  hasScopeRestriction: boolean,
) {
  await prisma.customRole.create({
    data: {
      name,
      description,
      isActive: true,
      hasScopeRestriction,
      permissions: {
        create: permissions.map((permission) => ({ permission })),
      },
    },
  });
}

async function main() {
  console.log('🌱 seed7: Veriler temizleniyor ve temel veriler ekleniyor...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      '❌ ADMIN_EMAIL veya ADMIN_PASSWORD .env dosyasında tanımlı değil.',
    );
  }

  // ─── 1. Tüm Verileri Temizle ───
  console.log('🗑️  Mevcut veriler temizleniyor...');

  await prisma.memberPayment.deleteMany();

  try {
    await prisma.memberAdvance.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('MemberAdvance')) {
      console.log('   ⚠️  MemberAdvance tablosu bulunamadı, atlanıyor...');
    } else {
      throw error;
    }
  }

  try {
    await prisma.memberMembershipPeriod.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('MemberMembershipPeriod')) {
      console.log('   ⚠️  MemberMembershipPeriod tablosu bulunamadı, atlanıyor...');
    } else {
      throw error;
    }
  }

  await prisma.userNotification.deleteMany();

  try {
    await prisma.notificationRecipient.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('   ⚠️  NotificationRecipient tablosu bulunamadı, atlanıyor...');
    } else {
      throw error;
    }
  }

  try {
    await prisma.notificationLog.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('   ⚠️  NotificationLog tablosu bulunamadı, atlanıyor...');
    } else {
      throw error;
    }
  }

  await prisma.userNotificationSettings.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.tevkifatFile.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.memberHistory.deleteMany();
  await prisma.memberDocument.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.content.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.panelUserApplicationScope.deleteMany();
  await prisma.panelUserApplication.deleteMany();
  await prisma.member.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.tevkifatTitle.deleteMany();
  await prisma.tevkifatCenter.deleteMany();
  await prisma.membershipInfoOption.deleteMany();
  await prisma.memberGroup.deleteMany();
  await prisma.profession.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.userScope.deleteMany();
  await prisma.customRoleScope.deleteMany();
  await prisma.customRolePermission.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();

  console.log('   ✅ Tüm veriler temizlendi');

  // ─── 2. İller ───
  console.log('📍 İller ekleniyor...');
  const provinceMapBySehirId: Record<string, string> = {};

  for (const sehir of sehirlerData) {
    const created = await prisma.province.create({
      data: {
        name: sehir.sehir_adi,
        code: sehir.sehir_id.padStart(2, '0'),
      },
    });
    provinceMapBySehirId[sehir.sehir_id] = created.id;
  }
  console.log(`   ✅ ${sehirlerData.length} il eklendi`);

  // ─── 3. İlçeler ───
  console.log('🏘️  İlçeler ekleniyor...');
  let ilceCount = 0;

  for (const ilce of ilcelerData) {
    const provinceId = provinceMapBySehirId[ilce.sehir_id];
    if (!provinceId) continue;
    await prisma.district.create({
      data: {
        name: ilce.ilce_adi,
        provinceId,
      },
    });
    ilceCount++;
  }
  console.log(`   ✅ ${ilceCount} ilçe eklendi`);

  // ─── 4. Roller ───
  console.log('🎭 Roller ekleniyor...');
  const adminRole = await prisma.customRole.create({
    data: {
      name: 'ADMIN',
      description: 'Admin rolü',
      isActive: true,
      hasScopeRestriction: false,
      permissions: {
        create: [
          { permission: 'USER_LIST' },
          { permission: 'USER_VIEW' },
          { permission: 'USER_CREATE' },
          { permission: 'USER_UPDATE' },
          { permission: 'MEMBER_LIST' },
          { permission: 'MEMBER_VIEW' },
          { permission: 'MEMBER_HISTORY_VIEW' },
          { permission: 'MEMBER_CREATE_APPLICATION' },
          { permission: 'MEMBER_APPROVE' },
        ],
      },
    },
  });
  console.log('   ✅ ADMIN rolü oluşturuldu');

  await createRoleWithPermissions(
    'IL_BASKANI',
    'İl başkanı rolü',
    IL_BASKANI_PERMISSIONS,
    true,
  );
  console.log(`   ✅ IL_BASKANI (${IL_BASKANI_PERMISSIONS.length} izin)`);

  await createRoleWithPermissions(
    'ILCE_BASKANI',
    'İlçe başkanı rolü',
    ILCE_BASKANI_PERMISSIONS,
    true,
  );
  console.log(`   ✅ ILCE_BASKANI (${ILCE_BASKANI_PERMISSIONS.length} izin)`);

  await createRoleWithPermissions(
    'GENEL_BASKAN',
    'Genel başkan rolü (sistem ayarları hariç)',
    GENEL_BASKAN_PERMISSIONS,
    false,
  );
  console.log(`   ✅ GENEL_BASKAN (${GENEL_BASKAN_PERMISSIONS.length} izin)`);

  // ─── 5. Admin Kullanıcısı ───
  console.log(`👤 Admin kullanıcısı ekleniyor: ${adminEmail}`);
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      customRoles: { connect: { id: adminRole.id } },
    },
  });
  console.log('   ✅ Admin kullanıcısı oluşturuldu');

  // ─── 6. Üye Grubu ───
  console.log('👥 Üye grubu ekleniyor...');
  await prisma.memberGroup.create({
    data: {
      name: 'Üye',
      description: 'Üye grubu',
      order: 1,
    },
  });
  console.log('   ✅ 1 üye grubu eklendi');

  console.log('\n✅ seed7 tamamlandı.');
  console.log(`   - Admin: ${adminEmail}`);
  console.log('   - Üye grubu: Üye');
  console.log('   - Roller: ADMIN, IL_BASKANI, ILCE_BASKANI, GENEL_BASKAN');
}

main()
  .catch((e) => {
    console.error('❌ seed7 hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
