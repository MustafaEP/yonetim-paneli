import { ApiProperty } from '@nestjs/swagger';
import { MemberSource, Gender, EducationStatus, PositionTitle } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, Matches } from 'class-validator';

export class CreateMemberApplicationDto {
  @ApiProperty({
    description: 'Üye adı',
    example: 'Mehmet',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Üye soyadı',
    example: 'Demir',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'TC Kimlik Numarası (zorunlu)',
    example: '12345678901',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, {
    message: 'TC Kimlik Numarası 11 haneli ve sadece rakam olmalıdır.',
  })
  nationalId: string;

  @ApiProperty({
    description: 'Telefon numarası',
    example: '05551234567',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'E-posta adresi',
    example: 'mehmet.demir@example.com',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Üyelik kaynağı',
    example: MemberSource.DIRECT,
    enum: MemberSource,
    required: false,
    default: MemberSource.DIRECT,
  })
  @IsOptional()
  @IsEnum(MemberSource)
  source?: MemberSource;

  // 🔹 Üyelik & Yönetim Kurulu Bilgileri
  @ApiProperty({
    description: 'Üyelik bilgisi seçeneği ID (seçmeli, admin tarafından yönetilen seçeneklerden)',
    example: 'membership-info-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  membershipInfoOptionId?: string;

  @ApiProperty({
    description: 'Üye kayıt numarası (Admin tarafından belirlenir, başvuru aşamasında opsiyonel - backend geçici değer oluşturur)',
    example: 'UYE-00001',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiProperty({
    description: 'Yönetim kurulu karar tarihi (Admin)',
    example: '2025-01-15',
    type: String,
    format: 'date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  boardDecisionDate?: string;

  @ApiProperty({
    description: 'Yönetim kurulu karar defter no (Admin)',
    example: 'DEF-2025-001',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  boardDecisionBookNo?: string;

  // 🔹 Kimlik & Kişisel Bilgiler
  @ApiProperty({
    description: 'Anne adı (seçmeli)',
    example: 'Ayşe',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  motherName?: string;

  @ApiProperty({
    description: 'Baba adı (seçmeli)',
    example: 'Ali',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  fatherName?: string;

  @ApiProperty({
    description: 'Doğum tarihi (seçmeli)',
    example: '1990-01-15',
    type: String,
    format: 'date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiProperty({
    description: 'Doğum yeri (seçmeli)',
    example: 'İstanbul',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  birthplace?: string;

  @ApiProperty({
    description: 'Cinsiyet (seçmeli)',
    example: Gender.MALE,
    enum: Gender,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  // 🔹 Eğitim & İletişim Bilgileri
  @ApiProperty({
    description: 'Öğrenim durumu (seçmeli)',
    example: EducationStatus.COLLEGE,
    enum: EducationStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(EducationStatus)
  educationStatus?: EducationStatus;

  // 🔹 Kurum Bilgileri
  @ApiProperty({
    description: 'Çalıştığı kurum ID',
    example: 'institution-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  institutionId?: string;

  @ApiProperty({
    description: 'Tevkifat merkezi ID (seçmeli)',
    example: 'tevkifat-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  tevkifatCenterId?: string;

  @ApiProperty({
    description: 'Tevkifat ünvanı ID (seçmeli)',
    example: 'tevkifat-title-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  tevkifatTitleId?: string;

  @ApiProperty({
    description: 'Bağlı olduğu şube ID (zorunlu)',
    example: 'branch-uuid-123',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  // Mevcut alanlar (kayıtlı olduğu yer)
  @ApiProperty({
    description: 'İl ID (opsiyonel, kullanıcının scope\'una göre otomatik set edilir)',
    example: 'province-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  provinceId?: string;

  @ApiProperty({
    description: 'İlçe ID (opsiyonel, kullanıcının scope\'una göre otomatik set edilir)',
    example: 'district-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  districtId?: string;

  // 🔹 Kurum Detay Bilgileri
  @ApiProperty({
    description: 'Görev Birimi',
    example: 'Acil Servis',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  dutyUnit?: string;

  @ApiProperty({
    description: 'Kurum Adresi',
    example: 'Atatürk Cad. No:123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  institutionAddress?: string;

  @ApiProperty({
    description: 'Kurum İli ID',
    example: 'province-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  institutionProvinceId?: string;

  @ApiProperty({
    description: 'Kurum İlçesi ID',
    example: 'district-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  institutionDistrictId?: string;

  @ApiProperty({
    description: 'Meslek/Unvan ID',
    example: 'profession-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  professionId?: string;

  @ApiProperty({
    description: 'Kurum Sicil No',
    example: '12345',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  institutionRegNo?: string;

  @ApiProperty({
    description: 'Kadro Unvan Kodu',
    example: 'K001',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  staffTitleCode?: string;
}
