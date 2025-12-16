// Doküman tipleri ve Türkçe karşılıkları
export const DOCUMENT_TYPES = [
  { value: 'UPLOADED', label: 'Yüklenen' },
  { value: 'MEMBER_REGISTRATION', label: 'Üye Kayıt Belgesi' },
  { value: 'IDENTITY', label: 'Kimlik Fotokopisi' },
  { value: 'CERTIFICATE', label: 'Sertifika' },
  { value: 'CONTRACT', label: 'Sözleşme' },
  { value: 'OTHER', label: 'Diğer' },
] as const;

// Doküman tipini Türkçeye çevir
export const getDocumentTypeLabel = (type: string): string => {
  const found = DOCUMENT_TYPES.find((dt) => dt.value === type);
  return found ? found.label : type;
};
