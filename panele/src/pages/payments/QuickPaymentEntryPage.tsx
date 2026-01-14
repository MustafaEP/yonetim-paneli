// src/pages/payments/QuickPaymentEntryPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  TablePagination,
  Tooltip,
  Stack,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getInstitutions } from '../../api/institutionsApi';
import { getMembers } from '../../api/membersApi';
import { createPayment, updatePayment, getPayments, type PaymentType, type CreateMemberPaymentDto, type UpdateMemberPaymentDto } from '../../api/paymentsApi';
import type { MemberListItem } from '../../types/member';
import type { Institution } from '../../api/institutionsApi';

interface PaymentRow {
  id: string;
  paymentId?: string; // Mevcut ödeme ID'si (düzenleme için)
  memberId: string | null;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  institution: string;
  amount: string;
  paymentType: PaymentType;
  description: string;
  status: 'DRAFT' | 'SAVED';
  member?: MemberListItem;
}

const QuickPaymentEntryPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filtreler
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    institutionId: '',
  });
  const [showOnlyUnpaidMembers, setShowOnlyUnpaidMembers] = useState(false);

  // Tablo filtreleri
  const [tableFilters, setTableFilters] = useState({
    registrationNumber: '',
    name: '',
    nationalId: '',
    institution: '',
  });

  // Debounced filtreler (performans için)
  const [debouncedFilters, setDebouncedFilters] = useState(tableFilters);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(tableFilters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [tableFilters]);

  // Tablo satırları
  const [rows, setRows] = useState<PaymentRow[]>([]);
  
  // Pagination (performans için)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50); // Sayfa başına 50 satır
  
  // Uyarı dialog state
  const [duplicatePaymentDialog, setDuplicatePaymentDialog] = useState<{
    open: boolean;
    memberName: string;
    memberId: string;
    rowId: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    open: false,
    memberName: '',
    memberId: '',
    rowId: '',
  });


  const canView = hasPermission('MEMBER_PAYMENT_LIST');

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  useEffect(() => {
    if (canView) {
      loadInstitutions();
    }
  }, [canView]);

  const loadInstitutions = async () => {
    try {
      const data = await getInstitutions({ isActive: true });
      setInstitutions(data);
    } catch (e) {
      console.error('Kurumlar yüklenirken hata:', e);
      toast.showError('Kurumlar yüklenirken bir hata oluştu');
    }
  };

  const loadMembers = async (status: 'ACTIVE' | 'PENDING' | 'APPROVED', excludePaidMembers: boolean = false) => {
    if (loadingMembers) {
      return;
    }

    setLoadingMembers(true);
    try {
      // Kurum seçilmemişse uyarı ver ve çık
      if (!filters.institutionId) {
        toast.showWarning('Lütfen önce bir kurum seçin. Tüm üyeleri yüklemek performans sorunlarına yol açar.');
        setLoadingMembers(false);
        return;
      }

      // Seçilen statüye göre üyeleri yükle
      const allMembers = await getMembers(status);

      // Kurum filtresi uygula (zorunlu)
      let filteredMembers = allMembers.filter(
        (m) => m.institution?.id === filters.institutionId
      );

      // Eğer "Sadece bu ay ödeme yapmayan üyeleri göster" seçiliyse, bu ay ödeme yapmış üyeleri filtrele
      if (excludePaidMembers) {
        try {
          // Bu ay/yıl için ödemeleri getir
          const payments = await getPayments({
            year: filters.year,
            month: filters.month,
            isApproved: true,
          });

          // Ödeme yapmış üye ID'lerini topla
          const paidMemberIds = new Set(payments.map((p) => p.memberId));

          // Ödeme yapmamış üyeleri filtrele
          filteredMembers = filteredMembers.filter((m) => !paidMemberIds.has(m.id));
        } catch (e) {
          console.error('Ödemeler yüklenirken hata:', e);
          // Hata durumunda tüm üyeleri göster
        }
      }

      // Mevcut satırlardaki üye ID'lerini topla (duplicate kontrolü için)
      setRows((prevRows) => {
        const existingMemberIds = new Set(
          prevRows.filter((r) => r.memberId).map((r) => r.memberId)
        );

        // Gelen üyeleri tabloya yeni satırlar olarak ekle (batch processing ile)
        let membersToAdd = filteredMembers.filter(
          (member) => !existingMemberIds.has(member.id)
        );
        
        if (membersToAdd.length === 0) {
          const statusLabel = status === 'ACTIVE' ? 'aktif' : status === 'PENDING' ? 'bekleyen' : 'başvurusu yapılan';
          const filterLabel = showOnlyUnpaidMembers ? ' (bu ay ödeme yapmayan)' : '';
          const institutionLabel = 'Seçilen kurum için';
          if (filteredMembers.length === 0) {
            toast.showInfo(`${institutionLabel} ${statusLabel} üye bulunamadı${filterLabel}`);
          } else {
            toast.showInfo(`${institutionLabel} Tüm ${statusLabel} üyeler zaten tabloda mevcut${filterLabel}`);
          }
          return prevRows;
        }

        // Çok fazla üye varsa uyarı ver ve limit uygula
        const MAX_MEMBERS = 1000;
        if (membersToAdd.length > MAX_MEMBERS) {
          toast.showWarning(`Performans için maksimum ${MAX_MEMBERS} üye eklenebilir. İlk ${MAX_MEMBERS} üye ekleniyor. Lütfen filtreleme kullanın.`);
          membersToAdd = membersToAdd.slice(0, MAX_MEMBERS);
        }

        // Batch processing: Çok fazla üye varsa parça parça ekle (requestAnimationFrame ile optimize edildi)
        // Küçük batch size ile UI donmasını önle
        const BATCH_SIZE = 25; // Daha küçük batch size (daha akıcı)
        const batches: PaymentRow[][] = [];
        
        // Batch'leri oluştur
        for (let i = 0; i < membersToAdd.length; i += BATCH_SIZE) {
          const batch = membersToAdd.slice(i, i + BATCH_SIZE).map((member) => ({
            id: `draft-${Date.now()}-${Math.random()}-${member.id}`,
            paymentId: undefined,
            memberId: member.id,
            registrationNumber: member.registrationNumber || '',
            firstName: member.firstName,
            lastName: member.lastName,
            nationalId: member.nationalId || '',
            institution: member.institution?.name || '',
            amount: '',
            paymentType: 'TEVKIFAT' as PaymentType,
            description: '',
            status: 'DRAFT' as const,
            member: member,
          }));
          batches.push(batch);
        }

        // Batch'lerin boş olmamasını kontrol et
        if (batches.length === 0) {
          return prevRows;
        }

        // İlk batch'i hemen ekle (kullanıcı hemen bir şey görsün)
        const firstBatch = batches[0];
        const initialRows = [...prevRows, ...firstBatch];
        
        // Diğer batch'leri requestAnimationFrame ile akıcı şekilde ekle
        if (batches.length > 1) {
          let batchIndex = 1;
          
          const addNextBatch = () => {
            // Index kontrolü
            if (batchIndex >= batches.length) {
              return;
            }
            
            requestAnimationFrame(() => {
              // Batch'in varlığını kontrol et
              const currentBatch = batches[batchIndex];
              if (!currentBatch || !Array.isArray(currentBatch)) {
                return;
              }
              
              setRows((currentRows) => {
                const newRows = [...currentRows, ...currentBatch];
                batchIndex++;
                
                // Sonraki batch'i ekle (eğer varsa)
                if (batchIndex < batches.length) {
                  // Her batch arasında kısa bir bekleme (UI'nin nefes alması için)
                  setTimeout(() => {
                    requestAnimationFrame(addNextBatch);
                  }, 10); // 10ms bekle (çok hızlı ama UI'yi bloklamıyor)
                }
                
                return newRows;
              });
            });
          };
          
          // İlk batch'ten sonra diğer batch'leri eklemeye başla
          requestAnimationFrame(() => {
            setTimeout(() => {
              requestAnimationFrame(addNextBatch);
            }, 16); // ~1 frame bekle (60fps için)
          });
        }

        const statusLabel = status === 'ACTIVE' ? 'aktif' : status === 'PENDING' ? 'bekleyen' : 'başvurusu yapılan';
        const filterLabel = showOnlyUnpaidMembers ? ' (bu ay ödeme yapmayan)' : '';
        const institutionLabel = 'Seçilen kurum için';

        // Başarı mesajını state güncellemesi dışında, bir kez göstermek için
        const addedCount = membersToAdd.length;

        // State'i güncelle
        const nextRows = initialRows;

        // Toast'ı sadece gerçek eklenen satır sayısı > 0 ise göster
        if (addedCount > 0) {
          toast.showSuccess(
            `${institutionLabel} ${addedCount} ${statusLabel} üye tabloya ekleniyor${filterLabel}`
          );
        }

        return nextRows;
      });

      // Members state'ini en son hal ile güncelle
      setMembers(filteredMembers);
    } catch (e) {
      console.error('Üyeler yüklenirken hata:', e);
      toast.showError('Üyeler yüklenirken bir hata oluştu');
    } finally {
      setLoadingMembers(false);
    }
  };



  const handleRowChange = useCallback((id: string, field: keyof PaymentRow, value: any) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  }, []);

  // Filtrelenmiş satırları hesapla (useMemo ile optimize edildi)
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesRegistrationNumber = !debouncedFilters.registrationNumber ||
        row.registrationNumber.toLowerCase().includes(debouncedFilters.registrationNumber.toLowerCase());
      const matchesName = !debouncedFilters.name ||
        `${row.firstName} ${row.lastName}`.toLowerCase().includes(debouncedFilters.name.toLowerCase());
      const matchesNationalId = !debouncedFilters.nationalId ||
        row.nationalId.includes(debouncedFilters.nationalId);
      const matchesInstitution = !debouncedFilters.institution ||
        row.institution.toLowerCase().includes(debouncedFilters.institution.toLowerCase());
      
      return matchesRegistrationNumber && matchesName && matchesNationalId && matchesInstitution;
    });
  }, [rows, debouncedFilters]);

  // Pagination için sayfalanmış satırlar (useMemo ile optimize edildi)
  const paginatedRows = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, page, rowsPerPage]);

  const validateRow = (row: PaymentRow): string | null => {
    if (!row.memberId) {
      return 'Üye seçilmelidir';
    }
    if (!row.amount || parseFloat(row.amount) <= 0) {
      return 'Geçerli bir tutar girilmelidir';
    }
    return null;
  };

  const handleSave = useCallback(async () => {
    // Para eklenen satırları kaydet
    const rowsToSave = rows.filter(
      (r) => r.status === 'DRAFT' && r.amount && parseFloat(r.amount) > 0 && r.memberId
    );

    if (rowsToSave.length === 0) {
      toast.showError('Kaydedilecek ödeme bulunamadı. Lütfen en az bir üye için tutar girin.');
      return;
    }

    await saveRows(rowsToSave);
  }, [rows, toast]);

  const saveRows = async (rowsToSave: PaymentRow[]) => {
    // Validasyon
    const errors: string[] = [];
    rowsToSave.forEach((row, index) => {
      const error = validateRow(row);
      if (error) {
        errors.push(`Satır ${index + 1}: ${error}`);
      }
    });

    if (errors.length > 0) {
      toast.showError(errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      // Tevkifat merkezi kontrolü
      const rowsWithMissingCenter: number[] = [];
      const rowsWithMissingCenterInfo: Array<{ rowNumber: number; memberName: string }> = [];
      
      rowsToSave.forEach((row, index) => {
        const member = row.member || members.find((m) => m.id === row.memberId);
        const tevkifatCenterId = member?.tevkifatCenter?.id;
        
        if (!tevkifatCenterId) {
          rowsWithMissingCenter.push(index + 1);
          rowsWithMissingCenterInfo.push({
            rowNumber: index + 1,
            memberName: member ? `${member.firstName} ${member.lastName}` : 'Bilinmeyen Üye',
          });
        }
      });

      if (rowsWithMissingCenter.length > 0) {
        const errorMessage = rowsWithMissingCenterInfo
          .map((info) => `Satır ${info.rowNumber}: ${info.memberName} - Tevkifat merkezi tanımlı değil`)
          .join('\n');
        toast.showError(errorMessage);
        setSaving(false);
        return;
      }

      // Yeni ödemeler için aynı ay/yıl kontrolü yap ve uyarı göster
      const newPaymentRows = rowsToSave.filter((r) => !r.paymentId);
      const rowsWithExistingPayments: PaymentRow[] = [];
      
      if (newPaymentRows.length > 0) {
        try {
          // Bu ay/yıl için ödemeleri getir
          const existingPayments = await getPayments({
            year: filters.year,
            month: filters.month,
            isApproved: true,
          });

          // Her yeni ödeme için kontrol et
          for (const row of newPaymentRows) {
            const existingPayment = existingPayments.find(
              (p) => p.memberId === row.memberId
            );

            if (existingPayment) {
              rowsWithExistingPayments.push(row);
            }
          }
        } catch (e) {
          console.error('Ödemeler kontrol edilirken hata:', e);
          // Hata durumunda devam et
        }
      }

      // Eğer aynı ayda ödeme yapmış üyeler varsa, her biri için uyarı göster
      const rowsToSkip: Set<string> = new Set();
      
      if (rowsWithExistingPayments.length > 0) {
        for (const row of rowsWithExistingPayments) {
          const member = row.member || members.find((m) => m.id === row.memberId);
          const memberName = member ? `${member.firstName} ${member.lastName}` : 'Bilinmeyen Üye';
          
          // Promise ile dialog'u beklet
          const shouldContinue = await new Promise<boolean>((resolve) => {
            setDuplicatePaymentDialog({
              open: true,
              memberName,
              memberId: row.memberId!,
              rowId: row.id,
              onConfirm: () => {
                setDuplicatePaymentDialog((prev) => ({ ...prev, open: false }));
                resolve(true);
              },
              onCancel: () => {
                setDuplicatePaymentDialog((prev) => ({ ...prev, open: false }));
                resolve(false);
              },
            });
          });

          if (!shouldContinue) {
            // Kullanıcı iptal etti, bu satırı atla
            rowsToSkip.add(row.id);
          }
        }
      }

      // İptal edilen satırları filtrele
      const finalRowsToSave = rowsToSave.filter((r) => !rowsToSkip.has(r.id));
      
      if (finalRowsToSave.length === 0) {
        toast.showInfo('Tüm satırlar iptal edildi');
        setSaving(false);
        return;
      }

      const promises = finalRowsToSave.map(async (row) => {
        // Üyenin tevkifat merkezini al
        const member = row.member || members.find((m) => m.id === row.memberId);
        const tevkifatCenterId = member?.tevkifatCenter?.id;

        // Eğer paymentId varsa güncelleme, yoksa yeni oluşturma
        if (row.paymentId) {
          // Güncelleme
          const updatePayload: UpdateMemberPaymentDto = {
            memberId: row.memberId!,
            paymentPeriodMonth: filters.month,
            paymentPeriodYear: filters.year,
            amount: row.amount,
            paymentType: row.paymentType,
            tevkifatCenterId: tevkifatCenterId!,
            description: undefined,
          };
          return updatePayment(row.paymentId, updatePayload);
        } else {
          // Yeni oluşturma
          const createPayload: CreateMemberPaymentDto = {
            memberId: row.memberId!,
            paymentPeriodMonth: filters.month,
            paymentPeriodYear: filters.year,
            amount: row.amount,
            paymentType: row.paymentType,
            tevkifatCenterId: tevkifatCenterId!,
            description: undefined,
          };
          return createPayment(createPayload);
        }
      });

      const results = await Promise.all(promises);

      // Başarılı satırları güncelle ve paymentId'yi sakla (functional update ile optimize edildi)
      setRows((prevRows) =>
        prevRows.map((row) => {
          const savedRowIndex = finalRowsToSave.findIndex((r) => r.id === row.id);
          if (savedRowIndex !== -1) {
            const savedPayment = results[savedRowIndex];
            return { 
              ...row, 
              status: 'SAVED' as const,
              paymentId: savedPayment.id, // Payment ID'yi sakla
            };
          }
          return row;
        })
      );

      toast.showSuccess(`${finalRowsToSave.length} ödeme başarıyla kaydedildi`);
    } catch (e: any) {
      console.error('Ödemeler kaydedilirken hata:', e);
      toast.showError(e?.response?.data?.message || 'Ödemeler kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Box>
    );
  }

  // Optimize edilmiş hesaplamalar (useMemo ile)
  const draftRows = useMemo(() => rows.filter((r) => r.status === 'DRAFT'), [rows]);
  const savedRows = useMemo(() => rows.filter((r) => r.status === 'SAVED'), [rows]);
  
  // Para eklenen üyeler (tutar girilmiş ve üye seçilmiş satırlar)
  const rowsWithAmount = useMemo(() => {
    return rows.filter(
      (r) => r.status === 'DRAFT' && r.amount && parseFloat(r.amount) > 0 && r.memberId
    );
  }, [rows]);
  
  const totalAmount = useMemo(() => {
    return rowsWithAmount.reduce((sum, row) => sum + parseFloat(row.amount || '0'), 0);
  }, [rowsWithAmount]);

  // Kurum bazlı özet (para eklenen üyeler için)
  const institutionSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        institution: string;
        count: number;
        total: number;
      }
    >();

    rowsWithAmount.forEach((row) => {
      const key = row.institution || 'Diğer / Kurumsuz';
      const existing = map.get(key);
      const amount = parseFloat(row.amount || '0') || 0;

      if (existing) {
        existing.count += 1;
        existing.total += amount;
      } else {
        map.set(key, {
          institution: key,
          count: 1,
          total: amount,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.institution.localeCompare(b.institution, 'tr')
    );
  }, [rowsWithAmount]);

  // Tablodaki satırlara göre kurum bazlı özet (tüm satırlar için)
  const institutionRowSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        institution: string;
        count: number;
      }
    >();

    rows.forEach((row) => {
      const key = row.institution || 'Diğer / Kurumsuz';
      const existing = map.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          institution: key,
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.institution.localeCompare(b.institution, 'tr')
    );
  }, [rows]);

  // Tek satırın tutarını temizle
  const handleClearAmount = useCallback((rowId: string) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              amount: '',
            }
          : row
      )
    );
  }, []);

  // Belirli bir kuruma ait tüm satırların tutarını temizle
  const handleClearInstitutionAmounts = useCallback((institutionName: string) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        (row.institution || 'Diğer / Kurumsuz') === institutionName
          ? {
              ...row,
              amount: '',
            }
          : row
      )
    );
  }, []);

  // Belirli bir kuruma ait tüm satırları tamamen kaldır
  const handleRemoveInstitutionRows = useCallback(
    (institutionName: string) => {
      setRows((prevRows) =>
        prevRows.filter(
          (row) => (row.institution || 'Diğer / Kurumsuz') !== institutionName
        )
      );

      const summary = institutionRowSummaries.find(
        (s) => s.institution === institutionName
      );
      if (summary && summary.count > 0) {
        toast.showInfo(
          `${summary.count} adet "${institutionName}" kurumuna ait satır kaldırıldı.`
        );
      }
    },
    [institutionRowSummaries, toast]
  );

  // Tüm para eklenen üyeleri temizle
  const handleClearAllAmounts = useCallback(() => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.amount && parseFloat(row.amount) > 0
          ? {
              ...row,
              amount: '',
            }
          : row
      )
    );
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`
            : theme.palette.background.default,
        pb: 4,
      }}
    >
      {/* Modern Başlık Bölümü */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: { xs: 56, sm: 64 },
                height: { xs: 56, sm: 64 },
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              <PaymentIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />
            </Box>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                  color: theme.palette.text.primary,
                  mb: 0.5,
                  letterSpacing: '-0.02em',
                }}
              >
                Hızlı Ödeme Girişi
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 500,
                }}
              >
                Toplu ödeme girişi ve yönetimi • {rows.length} satır ({draftRows.length} taslak, {savedRows.length} kaydedildi)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Kullanım İpuçları kaldırıldı */}

      {/* Filtreler */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon sx={{ fontSize: '1.25rem', color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                Filtreler ve Üye Seçimi
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                Ödeme dönemi ve kurum seçimi yapın
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 3 }}>
            <FormControl size="medium" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarMonthIcon fontSize="small" />
                  Yıl
                </Box>
              </InputLabel>
              <Select
                value={filters.year}
                label="Yıl"
                onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="medium" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarMonthIcon fontSize="small" />
                  Ay
                </Box>
              </InputLabel>
              <Select
                value={filters.month}
                label="Ay"
                onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
              >
                {monthNames.map((month, index) => (
                  <MenuItem key={index} value={index + 1}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="medium" sx={{ minWidth: { xs: '100%', sm: 250 }, flexGrow: 1 }}>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BusinessIcon fontSize="small" />
                  Kurum
                </Box>
              </InputLabel>
              <Select
                value={filters.institutionId}
                label="Kurum"
                onChange={(e) => setFilters({ ...filters, institutionId: e.target.value })}
                required
              >
                <MenuItem value="" disabled>
                  <em>Lütfen bir kurum seçin (zorunlu)</em>
                </MenuItem>
                {institutions.map((institution) => (
                  <MenuItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Üye Filtresi */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              background: alpha(theme.palette.warning.main, 0.04),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
              mb: 3,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={showOnlyUnpaidMembers}
                  onChange={(e) => setShowOnlyUnpaidMembers(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    Sadece bu ay ödeme yapmayan üyeleri göster
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, fontSize: '0.75rem' }}>
                    {monthNames[filters.month - 1]} {filters.year} döneminde ödeme yapmamış üyeler
                  </Typography>
                </Box>
              }
              sx={{ m: 0, alignItems: 'flex-start' }}
            />
          </Paper>

          {/* Üye Getir Butonları */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => loadMembers('ACTIVE', showOnlyUnpaidMembers)}
              disabled={loadingMembers || !filters.institutionId}
              startIcon={loadingMembers ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
              sx={{
                flex: { xs: '1 1 100%', sm: '0 1 auto' },
                minWidth: { xs: '100%', sm: 160 },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Aktif Üyeleri Getir
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => loadMembers('PENDING', showOnlyUnpaidMembers)}
              disabled={loadingMembers || !filters.institutionId}
              startIcon={loadingMembers ? <CircularProgress size={18} /> : <HourglassEmptyIcon />}
              sx={{
                flex: { xs: '1 1 100%', sm: '0 1 auto' },
                minWidth: { xs: '100%', sm: 160 },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Bekleyen Üyeleri Getir
            </Button>
            <Button
              variant="outlined"
              color="info"
              onClick={() => loadMembers('APPROVED', showOnlyUnpaidMembers)}
              disabled={loadingMembers || !filters.institutionId}
              startIcon={loadingMembers ? <CircularProgress size={18} /> : <CheckCircleIcon />}
              sx={{
                flex: { xs: '1 1 100%', sm: '0 1 auto' },
                minWidth: { xs: '100%', sm: 200 },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Başvurusu Yapılan Üyeleri Getir
            </Button>
            {!filters.institutionId && (
              <Alert severity="warning" sx={{ flex: '1 1 100%', mt: 1 }}>
                Sistemin performansını korumak için üyeler aşamalı olarak yüklenmektedir. Tüm üyeleri görmek için butonları birkaç kez kullanabilirsiniz.
              </Alert>
            )}
          </Box>
        </Box>
      </Card>

      {/* Tablo ve İşlemler */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Üst Bilgi */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Chip
            label={`${rows.length} satır • ${draftRows.length} taslak • ${savedRows.length} kaydedildi • ${filteredRows.length} görüntüleniyor`}
            size="small"
            sx={{
              alignSelf: 'flex-start',
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: alpha(theme.palette.info.main, 0.08),
              color: 'text.primary',
            }}
          />

          {institutionRowSummaries.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {institutionRowSummaries.map((item) => (
                <Box
                  key={item.institution}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.75,
                    py: 0.65,
                    borderRadius: 999,
                    background: alpha(theme.palette.primary.main, 0.12),
                    boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.8rem', fontWeight: 600, color: theme.palette.primary.dark }}
                  >
                    {item.count} {item.institution} üyesi listeleniyor
                  </Typography>
                  <Tooltip
                    title={`"${item.institution}" kurumuna ait tüm satırları kaldır`}
                  >
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveInstitutionRows(item.institution)}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ×
                      </Typography>
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Tablo */}
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Üye Kayıt No</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Ad Soyad</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>TC Kimlik No</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Kurum</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Aidat Tutarı</TableCell>
              </TableRow>
              {/* Filtre Satırı */}
              <TableRow>
                <TableCell sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5), p: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filtrele..."
                    value={tableFilters.registrationNumber}
                    onChange={(e) => setTableFilters({ ...tableFilters, registrationNumber: e.target.value })}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                  />
                </TableCell>
                <TableCell sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5), p: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filtrele..."
                    value={tableFilters.name}
                    onChange={(e) => setTableFilters({ ...tableFilters, name: e.target.value })}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                  />
                </TableCell>
                <TableCell sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5), p: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filtrele..."
                    value={tableFilters.nationalId}
                    onChange={(e) => setTableFilters({ ...tableFilters, nationalId: e.target.value })}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                  />
                </TableCell>
                <TableCell sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5), p: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filtrele..."
                    value={tableFilters.institution}
                    onChange={(e) => setTableFilters({ ...tableFilters, institution: e.target.value })}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                  />
                </TableCell>
                <TableCell sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {rows.length === 0 
                        ? 'Henüz satır eklenmedi. Üstteki butonlardan birine tıklayarak üyeleri getirin.'
                        : 'Filtre kriterlerine uygun satır bulunamadı.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const isSaved = row.status === 'SAVED';
                  return (
                    <TableRow
                      key={row.id}
                      sx={{
                        bgcolor: isSaved ? alpha(theme.palette.success.main, 0.06) : 'transparent',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {row.registrationNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {row.firstName} {row.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {row.nationalId || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {row.institution || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isSaved ? (
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.success.main,
                              fontSize: '0.875rem',
                            }}
                          >
                            ₺{parseFloat(row.amount || '0').toFixed(2)}
                          </Typography>
                        ) : (
                          <TextField
                            size="small"
                            type="number"
                            value={row.amount}
                            onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ minWidth: 120 }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredRows.length > 0 && (
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100, 200]}
            labelRowsPerPage="Sayfa başına satır:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            sx={{
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: '0.875rem',
              },
            }}
          />
        )}
      </Card>

      {/* Para Eklenen Üyeler Bölümü */}
      {rowsWithAmount.length > 0 && (
        <Card
          elevation={0}
          sx={{
            mt: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PaymentIcon sx={{ fontSize: '1.25rem', color: '#fff' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                  Para Eklenen Üyeler
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}
                >
                  {rowsWithAmount.length} üye • Toplam: ₺{totalAmount.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Tooltip title="Tüm para eklenen üyelerdeki tutarları temizler">
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleClearAllAmounts}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                    }}
                  >
                    Tümünü Temizle
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            {/* Kurum Bazlı Özet */}
            {institutionSummaries.length > 0 && (
              <Box
                sx={{
                  mb: 2.5,
                  p: 1.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.success.main, 0.03),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.18)}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1 }}
                >
                  Kurum Bazlı Özet
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {institutionSummaries.map((item) => (
                    <Box
                      key={item.institution}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 999,
                        background: alpha(theme.palette.success.main, 0.06),
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        {item.institution}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: '0.8rem', color: 'text.secondary' }}
                      >
                        {item.count} üye • ₺{item.total.toFixed(2)}
                      </Typography>
                      <Tooltip title="Bu kuruma ait satırlardaki tutarları temizle">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            handleClearInstitutionAmounts(item.institution)
                          }
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            ×
                          </Typography>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Üye Kayıt No</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Ad Soyad</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>TC Kimlik No</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Kurum</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }} align="right">Tutar</TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        bgcolor: 'background.paper',
                        fontSize: '0.8125rem',
                        textAlign: 'center',
                      }}
                    >
                      İşlemler
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rowsWithAmount.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.04),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.success.main, 0.08),
                        },
                      }}
                    >
                      <TableCell>{row.registrationNumber || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.firstName} {row.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.nationalId || '-'}</TableCell>
                      <TableCell>{row.institution || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: theme.palette.success.main,
                            fontSize: '0.875rem',
                          }}
                        >
                          ₺{parseFloat(row.amount || '0').toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Bu satırdaki tutarı temizle">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleClearAmount(row.id)}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              ×
                            </Typography>
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Kaydet Butonu - sağa hizalı */}
            <Box
              sx={{
                mt: 2.5,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="contained"
                color="success"
                size="medium"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || rowsWithAmount.length === 0}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  px: 3,
                  py: 1,
                  minWidth: 180,
                }}
              >
                {saving ? 'Kaydediliyor...' : `Kaydet (${rowsWithAmount.length} ödeme)`}
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {/* Aynı Ay Ödeme Uyarı Dialog */}
      <Dialog
        open={duplicatePaymentDialog.open}
        onClose={() => {
          duplicatePaymentDialog.onCancel?.();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarningIcon sx={{ fontSize: '1.5rem', color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                Aynı Ayda Ödeme Mevcut
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                Bu işleme devam etmek istediğinizden emin misiniz?
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 1 }}>
              <strong>{duplicatePaymentDialog.memberName}</strong> için{' '}
              <strong>{filters.year} yılı {monthNames[filters.month - 1]} ayı</strong> döneminde zaten bir ödeme kaydı bulunmaktadır.
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
              Bu üye için aynı ayda birden fazla ödeme kaydedebilirsiniz, ancak bu durumun doğru olduğundan emin olun.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => {
              duplicatePaymentDialog.onCancel?.();
            }}
            variant="outlined"
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            İptal Et
          </Button>
          <Button
            onClick={() => {
              duplicatePaymentDialog.onConfirm?.();
            }}
            variant="contained"
            color="warning"
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Devam Et
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default QuickPaymentEntryPage;

