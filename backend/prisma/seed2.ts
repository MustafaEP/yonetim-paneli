import { PrismaClient, ContentType, ContentStatus, DocumentTemplateType, NotificationType, NotificationTargetType, NotificationStatus, NotificationCategory, NotificationChannel, NotificationTypeCategory, SystemSettingCategory, ApprovalStatus, ApprovalEntityType, PaymentType, PositionTitle, MemberStatus, MemberSource, Gender, EducationStatus, PanelUserApplicationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// JSON dosyalarından şehir ve ilçe verilerini yükle
const isProduction = __dirname.includes('dist');
const prismaDir = isProduction ? path.join(__dirname, '..', '..', 'prisma') : __dirname;
const sehirlerPath = path.join(prismaDir, 'sehirler.json');
const ilcelerPath = path.join(prismaDir, 'ilceler.json');

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

const sehirlerData: SehirData[] = JSON.parse(fs.readFileSync(sehirlerPath, 'utf-8'));
const ilcelerData: IlceData[] = JSON.parse(fs.readFileSync(ilcelerPath, 'utf-8'));

// Şehir verilerini formatla
const TURKISH_PROVINCES = sehirlerData.map((sehir) => ({
  name: sehir.sehir_adi,
  code: sehir.sehir_id.padStart(2, '0'),
  sehirId: sehir.sehir_id,
}));

// İlçe verilerini şehir ID'sine göre grupla
const ilceMapBySehirId: Record<string, IlceData[]> = {};

for (const ilce of ilcelerData) {
  if (!ilceMapBySehirId[ilce.sehir_id]) {
    ilceMapBySehirId[ilce.sehir_id] = [];
  }
  ilceMapBySehirId[ilce.sehir_id].push(ilce);
}

async function main() {
  console.log('🌱 İkinci seed işlemi başlatılıyor...');

  // 0. Eski verileri temizle (seed2 senaryosu için tam reset)
  console.log('🗑️  Mevcut veriler temizleniyor...');
  // Foreign key sırasına dikkat ederek, önce child sonra parent tablolar silinir
  await prisma.memberPayment.deleteMany();
  await prisma.userNotification.deleteMany();
  // NotificationRecipient tablosu yoksa hata vermeden devam et
  try {
    await prisma.notificationRecipient.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('   ⚠️  NotificationRecipient tablosu bulunamadı, atlanıyor...');
    } else {
      throw error;
    }
  }
  // NotificationLog tablosu yoksa hata vermeden devam et
  try {
    await prisma.notificationLog.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('   ⚠️  NotificationLog tablosu bulunamadı, atlanıyor...');
    } else {
      throw error;
    }
  }
  await prisma.notification.deleteMany();
  await prisma.memberHistory.deleteMany();
  await prisma.memberDocument.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.tevkifatFile.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.panelUserApplicationScope.deleteMany(); // Must be deleted before PanelUserApplication
  await prisma.panelUserApplication.deleteMany(); // Must be deleted before Member (foreign key constraint)
  await prisma.member.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.tevkifatCenter.deleteMany();
  await prisma.tevkifatTitle.deleteMany();
  await prisma.membershipInfoOption.deleteMany();
  await prisma.memberGroup.deleteMany();
  await prisma.profession.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.userScope.deleteMany();
  await prisma.customRoleScope.deleteMany(); // Must be deleted before CustomRole
  await prisma.customRolePermission.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.userNotificationSettings.deleteMany();
  await prisma.content.deleteMany(); // Must be deleted before User (foreign key constraint)
  await prisma.user.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();

  // 1. İlleri ekle
  console.log('📍 İller ekleniyor...');
  const provinceMap: Record<string, string> = {};
  const provinceMapBySehirId: Record<string, string> = {};
  
  for (const prov of TURKISH_PROVINCES) {
    // İl zaten varsa atla
    const existing = await prisma.province.findFirst({
      where: { code: prov.code },
    });
    
    if (!existing) {
      const created = await prisma.province.create({
        data: {
          name: prov.name,
          code: prov.code,
        },
      });
      provinceMap[prov.name] = created.id;
      provinceMapBySehirId[prov.sehirId] = created.id;
    } else {
      provinceMap[prov.name] = existing.id;
      provinceMapBySehirId[prov.sehirId] = existing.id;
    }
  }
  console.log(`   ✅ İller kontrol edildi/eklendi`);

  // 2. İlçeleri ekle
  console.log('🏘️  İlçeler ekleniyor...');
  const districtMap: Record<string, string> = {};
  let ilceCount = 0;
  
  for (const [sehirId, ilceler] of Object.entries(ilceMapBySehirId)) {
    const provinceId = provinceMapBySehirId[sehirId];
    if (provinceId) {
      for (const ilce of ilceler) {
        const districtKey = `${sehirId}_${ilce.ilce_adi}`;
        if (!districtMap[districtKey]) {
          // İlçe zaten varsa atla
          const existing = await prisma.district.findFirst({
            where: {
              name: ilce.ilce_adi,
              provinceId: provinceId,
            },
          });
          
          if (!existing) {
            const created = await prisma.district.create({
              data: {
                name: ilce.ilce_adi,
                provinceId: provinceId,
              },
            });
            districtMap[districtKey] = created.id;
            ilceCount++;
          } else {
            districtMap[districtKey] = existing.id;
          }
        }
      }
    }
  }
  console.log(`   ✅ ${ilceCount} yeni ilçe eklendi`);

  // 3. Admin kullanıcısı ekle
  console.log('👤 Admin kullanıcısı ekleniyor...');
  const passwordHash = await bcrypt.hash('123456', 10);
  
  // Admin kullanıcısı zaten varsa atla
  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@sendika.local' },
  });
  
  if (!adminUser) {
    // Admin rolünü bul veya oluştur
    let adminRole = await prisma.customRole.findFirst({
      where: { name: 'ADMIN' },
    });
    
    if (!adminRole) {
      adminRole = await prisma.customRole.create({
        data: {
          name: 'ADMIN',
          description: 'Admin rolü',
          isActive: true,
          permissions: {
            create: [
              { permission: 'USER_LIST' },
              { permission: 'USER_VIEW' },
              { permission: 'USER_CREATE' },
              { permission: 'USER_UPDATE' },
              { permission: 'MEMBER_LIST' },
              { permission: 'MEMBER_VIEW' },
              { permission: 'MEMBER_CREATE_APPLICATION' },
              { permission: 'MEMBER_APPROVE' },
            ],
          },
        },
      });
    }
    
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@sendika.local',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        customRoles: {
          connect: { id: adminRole.id },
        },
      },
    });
    console.log('   ✅ Admin kullanıcısı oluşturuldu');
  } else {
    console.log('   ✅ Admin kullanıcısı zaten mevcut');
  }

  // Kullanıcıları ve diğer gerekli verileri al
  const allUsers = await prisma.user.findMany({ take: 10 });
  const allProvinces = await prisma.province.findMany({ take: 10 });
  const allDistricts = await prisma.district.findMany({ take: 10 });
  const allMembers = await prisma.member.findMany({ take: 10 });
  const allBranches = await prisma.branch.findMany({ take: 5 });
  const allInstitutions = await prisma.institution.findMany({ take: 5 });

  // 4. UserScope - 3 veri
  console.log('🔐 UserScope ekleniyor...');
  if (allUsers.length > 0 && allProvinces.length > 0) {
    for (let i = 0; i < 3; i++) {
      const user = allUsers[i % allUsers.length];
      const province = allProvinces[i % allProvinces.length];
      const districts = allDistricts.filter(d => d.provinceId === province.id);
      const district = districts.length > 0 ? districts[i % districts.length] : null;
      
      await prisma.userScope.create({
        data: {
          userId: user.id,
          provinceId: province.id,
          districtId: district?.id || null,
        },
      });
    }
    console.log('   ✅ 3 UserScope eklendi');
  }

  // 4.1. CustomRoleScope - 1 veri
  console.log('🔐 CustomRoleScope ekleniyor...');
  const allCustomRoles = await prisma.customRole.findMany({ take: 1 });
  if (allCustomRoles.length > 0 && allProvinces.length > 0) {
    const role = allCustomRoles[0];
    const province = allProvinces[0];
    const districts = allDistricts.filter(d => d.provinceId === province.id);
    const district = districts.length > 0 ? districts[0] : null;
    
    const existingScope = await prisma.customRoleScope.findFirst({
      where: {
        roleId: role.id,
        provinceId: province.id,
        districtId: district?.id || null,
      },
    });
    
    if (!existingScope) {
      await prisma.customRoleScope.create({
        data: {
          roleId: role.id,
          provinceId: province.id,
          districtId: district?.id || null,
        },
      });
      console.log('   ✅ 1 CustomRoleScope eklendi');
    } else {
      console.log('   ✅ CustomRoleScope zaten mevcut');
    }
  }

  // 5. Content - 3 veri
  console.log('📝 Content ekleniyor...');
  if (allUsers.length > 0) {
    const contentTypes: ContentType[] = [ContentType.NEWS, ContentType.ANNOUNCEMENT, ContentType.EVENT];
    const contentStatuses: ContentStatus[] = [ContentStatus.DRAFT, ContentStatus.PUBLISHED, ContentStatus.ARCHIVED];
    
    for (let i = 0; i < 3; i++) {
      await prisma.content.create({
        data: {
          title: `Örnek ${contentTypes[i]} Başlığı ${i + 1}`,
          content: `Bu bir ${contentTypes[i]} içeriğidir. Detaylı bilgi burada yer alır.`,
          type: contentTypes[i],
          status: contentStatuses[i],
          authorId: adminUser.id,
          publishedAt: contentStatuses[i] === ContentStatus.PUBLISHED ? new Date() : null,
        },
      });
    }
    console.log('   ✅ 3 Content eklendi');
  }

  // 6. DocumentTemplate - 3 veri
  console.log('📄 DocumentTemplate ekleniyor...');
  const templateTypes: DocumentTemplateType[] = [
    DocumentTemplateType.MEMBER_CERTIFICATE,
    DocumentTemplateType.MEMBER_CARD,
    DocumentTemplateType.LETTER,
  ];
  
  let documentTemplateCount = 0;
  for (let i = 0; i < 3; i++) {
    const templateName = `${templateTypes[i]} Şablonu ${i + 1}`;
    const existing = await prisma.documentTemplate.findFirst({
      where: { name: templateName },
    });
    
    if (!existing) {
      await prisma.documentTemplate.create({
        data: {
          name: templateName,
          description: `${templateTypes[i]} için örnek şablon`,
          template: `<!DOCTYPE html><html><body><h1>${templateTypes[i]} Şablonu</h1><p>İçerik buraya gelecek</p></body></html>`,
          type: templateTypes[i],
          isActive: true,
        },
      });
      documentTemplateCount++;
    }
  }
  console.log(`   ✅ ${documentTemplateCount} DocumentTemplate eklendi`);

  // 7. TevkifatTitle - 3 veri
  console.log('👔 TevkifatTitle ekleniyor...');
  const titles = ['Müdür', 'Başhekim', 'Başkan'];
  
  let tevkifatTitleCount = 0;
  for (let i = 0; i < 3; i++) {
    const existing = await prisma.tevkifatTitle.findFirst({
      where: { name: titles[i] },
    });
    
    if (!existing) {
      await prisma.tevkifatTitle.create({
        data: {
          name: titles[i],
          isActive: true,
        },
      });
      tevkifatTitleCount++;
    }
  }
  console.log(`   ✅ ${tevkifatTitleCount} TevkifatTitle eklendi`);

  // 8. TevkifatCenter - 3 veri
  console.log('🏥 TevkifatCenter ekleniyor...');
  let tevkifatCenterCount = 0;
  if (allProvinces.length > 0) {
    for (let i = 0; i < 3; i++) {
      const centerName = `Tevkifat Merkezi ${i + 1}`;
      const existing = await prisma.tevkifatCenter.findFirst({
        where: { name: centerName },
      });
      
      if (!existing) {
        const province = allProvinces[i % allProvinces.length];
        const districts = allDistricts.filter(d => d.provinceId === province.id);
        const district = districts.length > 0 ? districts[i % districts.length] : null;
        
        await prisma.tevkifatCenter.create({
          data: {
            name: centerName,
            isActive: true,
            provinceId: province.id,
            districtId: district?.id || null,
          },
        });
        tevkifatCenterCount++;
      }
    }
    console.log(`   ✅ ${tevkifatCenterCount} TevkifatCenter eklendi`);
  }

  // 9. MembershipInfoOption - 3 veri
  console.log('📋 MembershipInfoOption ekleniyor...');
  const membershipOptions = [
    { label: 'Normal Üye', value: 'NORMAL' },
    { label: 'Fahri Üye', value: 'FAHRI' },
    { label: 'Onursal Üye', value: 'ONURSAL' },
  ];
  
  let membershipInfoOptionCount = 0;
  for (let i = 0; i < 3; i++) {
    const existing = await prisma.membershipInfoOption.findFirst({
      where: { label: membershipOptions[i].label },
    });
    
    if (!existing) {
      await prisma.membershipInfoOption.create({
        data: {
          label: membershipOptions[i].label,
          value: membershipOptions[i].value,
          description: `${membershipOptions[i].label} için üyelik bilgisi`,
          isActive: true,
          order: i,
        },
      });
      membershipInfoOptionCount++;
    }
  }
  console.log(`   ✅ ${membershipInfoOptionCount} MembershipInfoOption eklendi`);

  // 10. Profession - 3 veri
  console.log('💼 Profession ekleniyor...');
  const professions = ['Doktor', 'Hemşire', 'Eczacı'];
  
  let professionCount = 0;
  for (let i = 0; i < 3; i++) {
    const existing = await prisma.profession.findFirst({
      where: { name: professions[i] },
    });
    
    if (!existing) {
      await prisma.profession.create({
        data: {
          name: professions[i],
          isActive: true,
        },
      });
      professionCount++;
    }
  }
  console.log(`   ✅ ${professionCount} Profession eklendi`);

  // 10.1. Branch - 1 veri
  console.log('🏢 Branch ekleniyor...');
  let branchCount = 0;
  if (allProvinces.length > 0 && allUsers.length > 0) {
    const branchName = 'Merkez Şube';
    const existing = await prisma.branch.findFirst({
      where: { name: branchName },
    });
    
    if (!existing) {
      const province = allProvinces[0];
      const districts = allDistricts.filter(d => d.provinceId === province.id);
      const district = districts.length > 0 ? districts[0] : null;
      
      await prisma.branch.create({
        data: {
          name: branchName,
          isActive: true,
          provinceId: province.id,
          districtId: district?.id || null,
          presidentId: allUsers[0].id,
        },
      });
      branchCount++;
    }
    console.log(`   ✅ ${branchCount} Branch eklendi`);
  }

  // 10.2. Institution - 1 veri
  console.log('🏥 Institution ekleniyor...');
  let institutionCount = 0;
  if (allProvinces.length > 0) {
    const institutionName = 'Örnek Kurum';
    const existing = await prisma.institution.findFirst({
      where: { name: institutionName },
    });
    
    if (!existing) {
      const province = allProvinces[0];
      const districts = allDistricts.filter(d => d.provinceId === province.id);
      const district = districts.length > 0 ? districts[0] : null;
      
      await prisma.institution.create({
        data: {
          name: institutionName,
          isActive: true,
          approvedAt: new Date(),
          approvedBy: adminUser.id,
          createdBy: adminUser.id,
          provinceId: province.id,
          districtId: district?.id || null,
        },
      });
      institutionCount++;
    }
    console.log(`   ✅ ${institutionCount} Institution eklendi`);
  }

  // 10.3. MemberGroup - 1 veri
  console.log('👥 MemberGroup ekleniyor...');
  let memberGroupCount = 0;
  const memberGroupName = 'Üye';
  const existingMemberGroup = await prisma.memberGroup.findFirst({
    where: { name: memberGroupName },
  });
  
  if (!existingMemberGroup) {
    await prisma.memberGroup.create({
      data: {
        name: memberGroupName,
        description: 'Üye grubu',
        isActive: true,
        order: 1,
      },
    });
    memberGroupCount++;
  }
  console.log(`   ✅ ${memberGroupCount} MemberGroup eklendi`);

  // 10.4. Member - 1 veri (Branch, Institution, MemberGroup gerekli)
  console.log('👤 Member ekleniyor...');
  let memberCount = 0;
  const allBranchesAfter = await prisma.branch.findMany({ take: 1 });
  const allInstitutionsAfter = await prisma.institution.findMany({ take: 1 });
  const allMemberGroups = await prisma.memberGroup.findMany({ take: 1 });
  const allProfessions = await prisma.profession.findMany({ take: 1 });
  const allTevkifatCenters = await prisma.tevkifatCenter.findMany({ take: 1 });
  const allTevkifatTitles = await prisma.tevkifatTitle.findMany({ take: 1 });
  const allMembershipInfoOptions = await prisma.membershipInfoOption.findMany({ take: 1 });
  
  if (allBranchesAfter.length > 0 && allInstitutionsAfter.length > 0 && allProvinces.length > 0) {
    const existingMember = await prisma.member.findFirst({
      where: { nationalId: '12345678901' },
    });
    
    if (!existingMember) {
      const province = allProvinces[0];
      const districts = allDistricts.filter(d => d.provinceId === province.id);
      const district = districts.length > 0 ? districts[0] : null;
      
      await prisma.member.create({
        data: {
          firstName: 'Örnek',
          lastName: 'Üye',
          nationalId: '12345678901',
          phone: '05551234567',
          email: 'ornek@example.com',
          status: MemberStatus.ACTIVE,
          source: MemberSource.DIRECT,
          branchId: allBranchesAfter[0].id,
          institutionId: allInstitutionsAfter[0].id,
          provinceId: province.id,
          districtId: district?.id || (await prisma.district.findFirst({ where: { provinceId: province.id } }))?.id || '',
          motherName: 'Ayşe',
          fatherName: 'Mehmet',
          birthDate: new Date('1990-01-01'),
          birthplace: 'İstanbul',
          gender: Gender.MALE,
          educationStatus: EducationStatus.COLLEGE,
          professionId: allProfessions.length > 0 ? allProfessions[0].id : null,
          tevkifatCenterId: allTevkifatCenters.length > 0 ? allTevkifatCenters[0].id : null,
          tevkifatTitleId: allTevkifatTitles.length > 0 ? allTevkifatTitles[0].id : null,
          memberGroupId: allMemberGroups.length > 0 ? allMemberGroups[0].id : null,
          membershipInfoOptionId: allMembershipInfoOptions.length > 0 ? allMembershipInfoOptions[0].id : null,
          createdByUserId: adminUser.id,
          approvedByUserId: adminUser.id,
          approvedAt: new Date(),
        },
      });
      memberCount++;
    }
    console.log(`   ✅ ${memberCount} Member eklendi`);
  }

  // 10.5. MemberDocument - 1 veri (Member ve DocumentTemplate gerekli)
  console.log('📄 MemberDocument ekleniyor...');
  const allMembersAfter = await prisma.member.findMany({ take: 1 });
  const allDocumentTemplates = await prisma.documentTemplate.findMany({ take: 1 });
  
  if (allMembersAfter.length > 0 && allDocumentTemplates.length > 0) {
    const member = allMembersAfter[0];
    const template = allDocumentTemplates[0];
    
    await prisma.memberDocument.create({
      data: {
        memberId: member.id,
        templateId: template.id,
        documentType: template.type,
        fileName: `document_${member.id}.pdf`,
        fileUrl: `/uploads/documents/document_${member.id}.pdf`,
        generatedBy: adminUser.id,
      },
    });
    console.log('   ✅ 1 MemberDocument eklendi');
  }

  // 11. SystemSetting - 3 veri
  console.log('⚙️  SystemSetting ekleniyor...');
  const settings = [
    { key: 'SITE_NAME', value: 'Sendika Yönetim Paneli', category: SystemSettingCategory.GENERAL },
    { key: 'MAX_UPLOAD_SIZE', value: '10485760', category: SystemSettingCategory.GENERAL },
    { key: 'EMAIL_FROM', value: 'noreply@sendika.local', category: SystemSettingCategory.EMAIL },
  ];
  
  let systemSettingCount = 0;
  for (let i = 0; i < 3; i++) {
    const existing = await prisma.systemSetting.findFirst({
      where: { key: settings[i].key },
    });
    
    if (!existing) {
      await prisma.systemSetting.create({
        data: {
          key: settings[i].key,
          value: settings[i].value,
          description: `${settings[i].key} ayarı`,
          category: settings[i].category,
          isEditable: true,
          isCritical: false,
          requiresApproval: false,
          updatedBy: adminUser.id,
        },
      });
      systemSettingCount++;
    }
  }
  console.log(`   ✅ ${systemSettingCount} SystemSetting eklendi`);

  // 12. SystemLog - 3 veri
  console.log('📊 SystemLog ekleniyor...');
  const actions = ['USER_LOGIN', 'MEMBER_CREATED', 'SETTING_UPDATED'];
  
  for (let i = 0; i < 3; i++) {
    await prisma.systemLog.create({
      data: {
        action: actions[i],
        entityType: actions[i].split('_')[0],
        entityId: i.toString(),
        userId: adminUser.id,
        details: { message: `${actions[i]} işlemi gerçekleştirildi` },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      },
    });
  }
  console.log('   ✅ 3 SystemLog eklendi');

  // 13. Approval - 3 veri (Member veya Institution için)
  console.log('✅ Approval ekleniyor...');
  if (allMembers.length > 0 || allInstitutions.length > 0) {
    const entityTypes: ApprovalEntityType[] = [
      ApprovalEntityType.MEMBER_CREATE,
      ApprovalEntityType.INSTITUTION,
      ApprovalEntityType.MEMBER_UPDATE,
    ];
    const statuses: ApprovalStatus[] = [
      ApprovalStatus.PENDING,
      ApprovalStatus.APPROVED,
      ApprovalStatus.REJECTED,
    ];
    
    for (let i = 0; i < 3; i++) {
      const entityId = allMembers.length > 0 
        ? allMembers[i % allMembers.length].id 
        : allInstitutions.length > 0 
        ? allInstitutions[i % allInstitutions.length].id 
        : 'temp-id';
      
      await prisma.approval.create({
        data: {
          entityType: entityTypes[i],
          entityId: entityId,
          status: statuses[i],
          requestedBy: adminUser.id,
          approvedBy: statuses[i] === ApprovalStatus.APPROVED ? adminUser.id : null,
          rejectedBy: statuses[i] === ApprovalStatus.REJECTED ? adminUser.id : null,
          requestData: { example: 'data' },
          approvalNote: statuses[i] === ApprovalStatus.APPROVED ? 'Onaylandı' : null,
          rejectionNote: statuses[i] === ApprovalStatus.REJECTED ? 'Reddedildi' : null,
          approvedAt: statuses[i] === ApprovalStatus.APPROVED ? new Date() : null,
          rejectedAt: statuses[i] === ApprovalStatus.REJECTED ? new Date() : null,
        },
      });
    }
    console.log('   ✅ 3 Approval eklendi');
  }

  // 14. MemberHistory - 3 veri
  console.log('📜 MemberHistory ekleniyor...');
  if (allMembers.length > 0) {
    const actions = ['CREATE', 'UPDATE', 'UPDATE'];
    
    for (let i = 0; i < 3; i++) {
      const member = allMembers[i % allMembers.length];
      await prisma.memberHistory.create({
        data: {
          memberId: member.id,
          action: actions[i],
          fieldName: actions[i] === 'CREATE' ? null : 'status',
          oldValue: actions[i] === 'CREATE' ? null : 'PENDING',
          newValue: actions[i] === 'CREATE' ? null : 'ACTIVE',
          changedBy: adminUser.id,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    }
    console.log('   ✅ 3 MemberHistory eklendi');
  }

  // 15. TevkifatFile - 3 veri
  console.log('📁 TevkifatFile ekleniyor...');
  const tevkifatCenters = await prisma.tevkifatCenter.findMany({ take: 3 });
  
  if (tevkifatCenters.length > 0) {
    for (let i = 0; i < 3; i++) {
      const center = tevkifatCenters[i % tevkifatCenters.length];
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      await prisma.tevkifatFile.create({
        data: {
          tevkifatCenterId: center.id,
          totalAmount: 10000 + (i * 5000),
          memberCount: 10 + (i * 5),
          month: month,
          year: year,
          positionTitle: PositionTitle.KADRO_657,
          fileName: `tevkifat_${year}_${month}_${i + 1}.pdf`,
          fileUrl: `/uploads/tevkifat/tevkifat_${year}_${month}_${i + 1}.pdf`,
          fileSize: 102400,
          status: ApprovalStatus.PENDING,
          uploadedBy: adminUser.id,
        },
      });
    }
    console.log('   ✅ 3 TevkifatFile eklendi');
  }

  // 16. MemberPayment - 3 veri
  console.log('💰 MemberPayment ekleniyor...');
  if (allMembers.length > 0) {
    const tevkifatCenters = await prisma.tevkifatCenter.findMany({ take: 3 });
    const tevkifatFiles = await prisma.tevkifatFile.findMany({ take: 3 });
    const paymentTypes: PaymentType[] = [PaymentType.TEVKIFAT, PaymentType.ELDEN, PaymentType.HAVALE];
    
    for (let i = 0; i < 3; i++) {
      const member = allMembers[i % allMembers.length];
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      await prisma.memberPayment.create({
        data: {
          memberId: member.id,
          registrationNumber: member.registrationNumber || `UYE-${String(i + 1).padStart(5, '0')}`,
          paymentPeriodMonth: month,
          paymentPeriodYear: year,
          amount: 100 + (i * 50),
          paymentType: paymentTypes[i],
          tevkifatCenterId: paymentTypes[i] === PaymentType.TEVKIFAT && tevkifatCenters.length > 0 
            ? tevkifatCenters[i % tevkifatCenters.length].id 
            : null,
          tevkifatFileId: paymentTypes[i] === PaymentType.TEVKIFAT && tevkifatFiles.length > 0 
            ? tevkifatFiles[i % tevkifatFiles.length].id 
            : null,
          description: `${paymentTypes[i]} ödemesi`,
          isApproved: i > 0, // İlk ödeme onaylanmamış
          approvedByUserId: i > 0 ? adminUser.id : null,
          approvedAt: i > 0 ? new Date() : null,
          createdByUserId: adminUser.id,
        },
      });
    }
    console.log('   ✅ 3 MemberPayment eklendi');
  }

  // 17. Notification - 3 veri
  console.log('🔔 Notification ekleniyor...');
  const notificationCategories: NotificationCategory[] = [
    NotificationCategory.SYSTEM,
    NotificationCategory.ANNOUNCEMENT,
    NotificationCategory.FINANCIAL,
  ];
  const targetTypes: NotificationTargetType[] = [
    NotificationTargetType.ALL_MEMBERS,
    NotificationTargetType.REGION,
    NotificationTargetType.USER,
  ];
  
  for (let i = 0; i < 3; i++) {
    await prisma.notification.create({
      data: {
        title: `Bildirim ${i + 1}`,
        message: `Bu bir ${notificationCategories[i]} bildirimidir.`,
        category: notificationCategories[i],
        typeCategory: NotificationTypeCategory.ANNOUNCEMENT_GENERAL,
        type: NotificationType.IN_APP,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        targetType: targetTypes[i],
        targetId: targetTypes[i] === NotificationTargetType.USER ? adminUser.id : null,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        sentBy: adminUser.id,
        recipientCount: 10 + (i * 5),
        successCount: 10 + (i * 5),
        failedCount: 0,
      },
    });
  }
  console.log('   ✅ 3 Notification eklendi');

  // 18. NotificationRecipient - 3 veri
  console.log('📧 NotificationRecipient ekleniyor...');
  const notifications = await prisma.notification.findMany({ take: 3 });
  
  if (notifications.length > 0 && allMembers.length > 0) {
    try {
      for (let i = 0; i < 3; i++) {
        const notification = notifications[i % notifications.length];
        const member = allMembers[i % allMembers.length];
        
        await prisma.notificationRecipient.create({
          data: {
            notificationId: notification.id,
            memberId: member.id,
            email: member.email || `member${i}@example.com`,
            channel: NotificationChannel.EMAIL,
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });
      }
      console.log('   ✅ 3 NotificationRecipient eklendi');
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('   ⚠️  NotificationRecipient tablosu bulunamadı, atlanıyor...');
      } else {
        throw error;
      }
    }
  }

  // 19. UserNotification - 3 veri
  console.log('👤 UserNotification ekleniyor...');
  if (notifications.length > 0 && allUsers.length > 0) {
    for (let i = 0; i < 3; i++) {
      const notification = notifications[i % notifications.length];
      const user = allUsers[i % allUsers.length];
      
      await prisma.userNotification.create({
        data: {
          userId: user.id,
          notificationId: notification.id,
          isRead: i > 0, // İlk bildirim okunmamış
          readAt: i > 0 ? new Date() : null,
        },
      });
    }
    console.log('   ✅ 3 UserNotification eklendi');
  }

  // 20. NotificationLog - 3 veri
  console.log('📝 NotificationLog ekleniyor...');
  if (notifications.length > 0) {
    try {
      const recipients = await prisma.notificationRecipient.findMany({ take: 3 }).catch(() => []);
      const actions = ['SENT', 'DELIVERED', 'READ'];
      
      for (let i = 0; i < 3; i++) {
        const notification = notifications[i % notifications.length];
        const recipient = recipients.length > 0 ? recipients[i % recipients.length] : null;
        
        await prisma.notificationLog.create({
          data: {
            notificationId: notification.id,
            recipientId: recipient?.id || null,
            channel: NotificationChannel.EMAIL,
            action: actions[i],
            status: NotificationStatus.SENT,
            message: `${actions[i]} işlemi gerçekleştirildi`,
            metadata: { example: 'data' },
          },
        });
      }
      console.log('   ✅ 3 NotificationLog eklendi');
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('   ⚠️  NotificationLog tablosu bulunamadı, atlanıyor...');
      } else {
        throw error;
      }
    }
  }

  // 20.5. PanelUserApplication - 1 veri (Member ve CustomRole gerekli)
  console.log('📋 PanelUserApplication ekleniyor...');
  const allMembersForApplication = await prisma.member.findMany({ take: 1 });
  const allCustomRolesForApplication = await prisma.customRole.findMany({ take: 1 });
  
  if (allMembersForApplication.length > 0 && allCustomRolesForApplication.length > 0) {
    const member = allMembersForApplication[0];
    const role = allCustomRolesForApplication[0];
    
    const existingApplication = await prisma.panelUserApplication.findFirst({
      where: { memberId: member.id },
    });
    
    if (!existingApplication) {
      const application = await prisma.panelUserApplication.create({
        data: {
          memberId: member.id,
          requestedRoleId: role.id,
          status: PanelUserApplicationStatus.PENDING,
          requestNote: 'Örnek panel kullanıcı başvurusu',
        },
      });
      
      // PanelUserApplicationScope - 1 veri
      if (allProvinces.length > 0) {
        const province = allProvinces[0];
        const districts = allDistricts.filter(d => d.provinceId === province.id);
        const district = districts.length > 0 ? districts[0] : null;
        
        await prisma.panelUserApplicationScope.create({
          data: {
            applicationId: application.id,
            provinceId: province.id,
            districtId: district?.id || null,
          },
        });
      }
      
      console.log('   ✅ 1 PanelUserApplication ve 1 PanelUserApplicationScope eklendi');
    } else {
      console.log('   ✅ PanelUserApplication zaten mevcut');
    }
  }

  // 21. UserNotificationSettings - 3 veri
  console.log('⚙️  UserNotificationSettings ekleniyor...');
  if (allUsers.length > 0) {
    for (let i = 0; i < 3; i++) {
      const user = allUsers[i % allUsers.length];
      
      // Zaten varsa atla
      const existing = await prisma.userNotificationSettings.findUnique({
        where: { userId: user.id },
      });
      
      if (!existing) {
        await prisma.userNotificationSettings.create({
          data: {
            userId: user.id,
            emailEnabled: true,
            smsEnabled: i > 0,
            whatsappEnabled: false,
            inAppEnabled: true,
            timeZone: 'Europe/Istanbul',
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            systemNotificationsEnabled: true,
            financialNotificationsEnabled: true,
            announcementNotificationsEnabled: true,
            reminderNotificationsEnabled: true,
          },
        });
      }
    }
    console.log('   ✅ UserNotificationSettings kontrol edildi/eklendi');
  }

  console.log('✅ İkinci seed işlemi tamamlandı!');
}

main()
  .catch((e) => {
    console.error('❌ Seed işlemi başarısız:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

