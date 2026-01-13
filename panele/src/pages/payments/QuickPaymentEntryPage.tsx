// src/pages/payments/QuickPaymentEntryPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
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
  Autocomplete,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getInstitutions } from '../../api/institutionsApi';
import { getMembers } from '../../api/membersApi';
import { createPayment, updatePayment, deletePayment, getPayments, type PaymentType, type CreateMemberPaymentDto, type UpdateMemberPaymentDto } from '../../api/paymentsApi';
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

  // Tablo satırları
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
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

  // Kaldırma onay dialog state
  const [deletePaymentDialog, setDeletePaymentDialog] = useState<{
    open: boolean;
    paymentId: string;
    rowId: string;
    memberName: string;
  }>({
    open: false,
    paymentId: '',
    rowId: '',
    memberName: '',
  });

  const canView = hasPermission('MEMBER_PAYMENT_LIST');
  const canAddPayment = hasPermission('MEMBER_PAYMENT_ADD');

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
    setLoadingMembers(true);
    try {
      // Seçilen statüye göre üyeleri yükle
      const allMembers = await getMembers(status);

      // Kurum filtresi uygula (eğer kurum seçildiyse)
      let filteredMembers = allMembers;
      if (filters.institutionId) {
        filteredMembers = allMembers.filter(
          (m) => m.institution?.id === filters.institutionId
        );
      }

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

      setMembers(filteredMembers);

      if (filteredMembers.length === 0) {
        const statusLabel = status === 'ACTIVE' ? 'aktif' : status === 'PENDING' ? 'bekleyen' : 'başvurusu yapılan';
        const filterLabel = showOnlyUnpaidMembers ? ' (bu ay ödeme yapmayan)' : '';
        const institutionLabel = filters.institutionId ? 'Seçilen kurum için' : 'Tüm kurumlar için';
        toast.showInfo(`${institutionLabel} ${statusLabel} üye bulunamadı${filterLabel}`);
      } else {
        const statusLabel = status === 'ACTIVE' ? 'aktif' : status === 'PENDING' ? 'bekleyen' : 'başvurusu yapılan';
        const filterLabel = showOnlyUnpaidMembers ? ' (bu ay ödeme yapmayan)' : '';
        const institutionLabel = filters.institutionId ? 'Seçilen kurum için' : 'Tüm kurumlar için';
        toast.showSuccess(`${institutionLabel} ${filteredMembers.length} ${statusLabel} üye bulundu${filterLabel}`);
      }
    } catch (e) {
      console.error('Üyeler yüklenirken hata:', e);
      toast.showError('Üyeler yüklenirken bir hata oluştu');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddRow = () => {
    const newRow: PaymentRow = {
      id: `draft-${Date.now()}-${Math.random()}`,
      memberId: null,
      registrationNumber: '',
      firstName: '',
      lastName: '',
      nationalId: '',
      institution: filters.institutionId ? institutions.find((i) => i.id === filters.institutionId)?.name || '' : '',
      amount: '',
      paymentType: 'TEVKIFAT',
      description: '',
      status: 'DRAFT',
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleEditRow = (id: string) => {
    setRows(
      rows.map((row) => {
        if (row.id === id && row.status === 'SAVED') {
          return { ...row, status: 'DRAFT' as const };
        }
        return row;
      })
    );
  };

  const handleDeletePayment = (rowId: string, paymentId: string, memberName: string) => {
    setDeletePaymentDialog({
      open: true,
      paymentId,
      rowId,
      memberName,
    });
  };

  const confirmDeletePayment = async () => {
    const { paymentId, rowId } = deletePaymentDialog;
    
    if (!paymentId) {
      toast.showError('Ödeme ID bulunamadı');
      setDeletePaymentDialog({ open: false, paymentId: '', rowId: '', memberName: '' });
      return;
    }

    try {
      await deletePayment(paymentId);
      
      // Satırı listeden kaldır
      setRows(rows.filter((r) => r.id !== rowId));
      
      toast.showSuccess('Ödeme başarıyla kaldırıldı');
      setDeletePaymentDialog({ open: false, paymentId: '', rowId: '', memberName: '' });
    } catch (e: any) {
      console.error('Ödeme kaldırılırken hata:', e);
      toast.showError(e?.response?.data?.message || 'Ödeme kaldırılırken bir hata oluştu');
      setDeletePaymentDialog({ open: false, paymentId: '', rowId: '', memberName: '' });
    }
  };

  const handleRowChange = (id: string, field: keyof PaymentRow, value: any) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          return updated;
        }
        return row;
      })
    );
  };

  const handleMemberSelect = (id: string, member: MemberListItem | null) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          if (member) {
            return {
              ...row,
              memberId: member.id,
              member: member,
              registrationNumber: member.registrationNumber || '',
              firstName: member.firstName,
              lastName: member.lastName,
              nationalId: member.nationalId || '',
              institution: member.institution?.name || '',
            };
          } else {
            return {
              ...row,
              memberId: null,
              member: undefined,
              registrationNumber: '',
              firstName: '',
              lastName: '',
              nationalId: '',
              institution: filters.institutionId ? institutions.find((i) => i.id === filters.institutionId)?.name || '' : '',
            };
          }
        }
        return row;
      })
    );
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const draftRows = rows.filter((r) => r.status === 'DRAFT');
    if (selectedRows.size === draftRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(draftRows.map((r) => r.id)));
    }
  };

  const validateRow = (row: PaymentRow): string | null => {
    if (!row.memberId) {
      return 'Üye seçilmelidir';
    }
    if (!row.amount || parseFloat(row.amount) <= 0) {
      return 'Geçerli bir tutar girilmelidir';
    }
    return null;
  };

  const handleSaveSelected = async () => {
    if (selectedRows.size === 0) {
      toast.showError('Lütfen kaydedilecek satırları seçin');
      return;
    }

    const rowsToSave = rows.filter((r) => selectedRows.has(r.id) && r.status === 'DRAFT');
    await saveRows(rowsToSave);
  };

  const handleSaveAll = async () => {
    const draftRows = rows.filter((r) => r.status === 'DRAFT');
    if (draftRows.length === 0) {
      toast.showError('Kaydedilecek satır bulunamadı');
      return;
    }
    await saveRows(draftRows);
  };

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

      // Başarılı satırları güncelle ve paymentId'yi sakla
      setRows(
        rows.map((row) => {
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

      setSelectedRows(new Set());
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

  const draftRows = rows.filter((r) => r.status === 'DRAFT');
  const savedRows = rows.filter((r) => r.status === 'SAVED');

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
              >
                <MenuItem value="">Tümü</MenuItem>
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
              disabled={loadingMembers}
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
              disabled={loadingMembers}
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
        {/* Üst Butonlar */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              disabled={!canAddPayment}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Yeni Satır Ekle
            </Button>
            {draftRows.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSelected}
                  disabled={saving || selectedRows.size === 0}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Seçilenleri Kaydet ({selectedRows.size})
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveAll}
                  disabled={saving}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Tümünü Kaydet ({draftRows.length})
                </Button>
              </>
            )}
          </Box>
          <Chip
            label={`${rows.length} satır • ${draftRows.length} taslak • ${savedRows.length} kaydedildi`}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: alpha(theme.palette.info.main, 0.08),
              color: 'text.primary',
            }}
          />
        </Box>

        {/* Tablo */}
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: 'background.paper', fontWeight: 600 }}>
                  <Checkbox
                    checked={draftRows.length > 0 && selectedRows.size === draftRows.length}
                    indeterminate={selectedRows.size > 0 && selectedRows.size < draftRows.length}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Üye Kayıt No</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Ad Soyad</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>TC Kimlik No</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Kurum</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Aidat Tutarı</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>Durum</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', fontSize: '0.8125rem' }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Henüz satır eklenmedi. "Yeni Satır Ekle" butonuna tıklayarak başlayın.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const isSaved = row.status === 'SAVED';
                  const isSelected = selectedRows.has(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      sx={{
                        bgcolor: isSaved ? alpha(theme.palette.success.main, 0.06) : 'transparent',
                      }}
                    >
                      <TableCell padding="checkbox">
                        {!isSaved && (
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectRow(row.id)}
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isSaved ? (
                          <Typography variant="body2">{row.registrationNumber || '-'}</Typography>
                        ) : (
                          <Autocomplete
                            size="small"
                            options={members}
                            value={row.member || null}
                            onChange={(_, newValue) => {
                              handleMemberSelect(row.id, newValue);
                            }}
                            getOptionLabel={(option) =>
                              `${option.firstName} ${option.lastName}${option.registrationNumber ? ` (${option.registrationNumber})` : ''}`
                            }
                            inputValue={row.member ? (row.registrationNumber || '') : ''}
                            onInputChange={(_, _value, reason) => {
                              // Seçim yapıldığında (reason === 'reset') inputValue kayıt no olur
                              // Arama yapılırken (reason === 'input') arama terimi gösterilir
                              if (reason === 'reset' && row.member) {
                                // Seçim yapıldı, zaten handleMemberSelect ile güncellenecek
                                return;
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Üye ara..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                  }
                                }}
                              />
                            )}
                            sx={{ minWidth: 150 }}
                            filterOptions={(options, { inputValue }) => {
                              const searchTerm = inputValue.toLowerCase();
                              return options.filter(
                                (option) =>
                                  `${option.firstName} ${option.lastName}`.toLowerCase().includes(searchTerm) ||
                                  (option.registrationNumber &&
                                    option.registrationNumber.toLowerCase().includes(searchTerm)) ||
                                  (option.nationalId && option.nationalId.includes(searchTerm))
                              );
                            }}
                            noOptionsText="Üye bulunamadı"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isSaved ? (
                          <Typography variant="body2">
                            {row.firstName} {row.lastName}
                          </Typography>
                        ) : (
                          <TextField
                            size="small"
                            value={`${row.firstName} ${row.lastName}`}
                            disabled
                            sx={{ minWidth: 150 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isSaved ? (
                          <Typography variant="body2">{row.nationalId || '-'}</Typography>
                        ) : (
                          <TextField
                            size="small"
                            value={row.nationalId}
                            disabled
                            sx={{ minWidth: 120 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isSaved ? (
                          <Typography variant="body2">{row.institution || '-'}</Typography>
                        ) : (
                          <TextField
                            size="small"
                            value={row.institution}
                            disabled
                            sx={{ minWidth: 150 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isSaved ? (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main, fontSize: '0.875rem' }}>
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
                      <TableCell>
                        <Chip
                          label={isSaved ? 'Hazır' : 'Taslak'}
                          size="small"
                          color={isSaved ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {isSaved ? (
                            <>
                              <Tooltip title="Düzelt">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditRow(row.id)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {row.paymentId && (
                                <Tooltip title="Kaldır">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeletePayment(row.id, row.paymentId!, `${row.firstName} ${row.lastName}`)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            <Tooltip title="Satırı Sil">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRow(row.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

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

      {/* Ödeme Kaldırma Onay Dialog */}
      <Dialog
        open={deletePaymentDialog.open}
        onClose={() => setDeletePaymentDialog({ open: false, paymentId: '', rowId: '', memberName: '' })}
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
                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DeleteIcon sx={{ fontSize: '1.5rem', color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                Ödeme Kaldırma Onayı
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                Bu işlem geri alınamaz
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem', mb: 2 }}>
            <strong>{deletePaymentDialog.memberName}</strong> için kaydedilen ödemeyi kaldırmak istediğinizden emin misiniz?
          </DialogContentText>
          <DialogContentText sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
            Bu işlem ödeme kaydını kalıcı olarak siler ve geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeletePaymentDialog({ open: false, paymentId: '', rowId: '', memberName: '' })}
            variant="outlined"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            İptal
          </Button>
          <Button
            onClick={confirmDeletePayment}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Kaldır
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickPaymentEntryPage;

