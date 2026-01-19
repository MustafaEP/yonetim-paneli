// src/pages/payments/PaymentsListPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaymentIcon from '@mui/icons-material/Payment';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getPayments,
  createPayment,
  uploadPaymentDocument,
  type MemberPayment,
  type PaymentListFilters,
  type PaymentType,
  type CreateMemberPaymentDto,
} from '../../api/paymentsApi';
import { getTevkifatCenters } from '../../api/accountingApi';
import { getMembers } from '../../api/membersApi';
import { getInstitutions } from '../../api/institutionsApi';
import type { MemberListItem } from '../../types/member';
import type { Institution } from '../../api/institutionsApi';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../utils/exportUtils';
import PageHeader from '../../components/layout/PageHeader';

const PaymentsListPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState<MemberPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<PaymentListFilters>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [showAllYear, setShowAllYear] = useState(false);
  const [tevkifatCenters, setTevkifatCenters] = useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  
  // Ödeme ekleme dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    memberId: string;
    paymentPeriodMonth: number;
    paymentPeriodYear: number;
    amount: string;
    paymentType: PaymentType;
    tevkifatCenterId: string;
    description: string;
    documentFile: File | null;
    documentFileName: string;
  }>({
    memberId: '',
    paymentPeriodMonth: new Date().getMonth() + 1,
    paymentPeriodYear: new Date().getFullYear(),
    amount: '',
    paymentType: 'TEVKIFAT',
    tevkifatCenterId: '',
    description: '',
    documentFile: null,
    documentFileName: '',
  });

  const canView = hasPermission('MEMBER_PAYMENT_LIST');
  const canExport = hasPermission('ACCOUNTING_EXPORT');
  const canAddPayment = hasPermission('MEMBER_PAYMENT_ADD');

  useEffect(() => {
    if (canView) {
      loadPayments();
      loadTevkifatCenters();
      loadInstitutions();
    }
    if (canAddPayment) {
      loadMembers();
    }
  }, [canView, canAddPayment, filters, showAllYear, selectedInstitutionId]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const requestFilters: PaymentListFilters = showAllYear 
        ? { ...filters, month: undefined } 
        : { ...filters };
      
      // Kurum filtresi ekle
      if (selectedInstitutionId) {
        // Backend'de institutionId filtresi yok, bu yüzden frontend'de filtreleyeceğiz
        // Ama önce tüm ödemeleri yükleyelim
      }
      
      const data = await getPayments(requestFilters);
      
      // Kurum filtresi varsa frontend'de filtrele
      let filteredData = data;
      if (selectedInstitutionId) {
        filteredData = data.filter((payment) => 
          payment.member?.institution?.id === selectedInstitutionId
        );
      }
      
      setRows(filteredData);
    } catch (e: any) {
      console.error('Ödemeler yüklenirken hata:', e);
      toast.showError('Ödemeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutions = async () => {
    try {
      const data = await getInstitutions({ isActive: true });
      setInstitutions(data);
    } catch (e) {
      console.error('Kurumlar yüklenirken hata:', e);
    }
  };

  const loadTevkifatCenters = async () => {
    try {
      const data = await getTevkifatCenters();
      setTevkifatCenters(data.map((c) => ({ id: c.id, name: c.name })));
    } catch (e) {
      console.error('Tevkifat merkezleri yüklenirken hata:', e);
    }
  };

  const loadMembers = async () => {
    try {
      // Aktif, bekleyen ve onaylanmış üyeleri yükle
      const [activeMembers, pendingMembers, approvedMembers] = await Promise.all([
        getMembers('ACTIVE'),
        getMembers('PENDING'),
        getMembers('APPROVED'),
      ]);
      
      // Tüm üyeleri birleştir ve tekrarları kaldır (id'ye göre)
      const allMembers = [...activeMembers, ...pendingMembers, ...approvedMembers];
      const uniqueMembers = allMembers.filter((member, index, self) =>
        index === self.findIndex((m) => m.id === member.id)
      );
      
      setMembers(uniqueMembers);
    } catch (e) {
      console.error('Üyeler yüklenirken hata:', e);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportColumns: ExportColumn[] = columns
        .filter((col) => col.field !== 'actions')
        .map((col) => ({
          field: col.field,
          headerName: col.headerName || '',
          width: col.width || (col.flex ? (col.flex as number) * 10 : 15),
          valueGetter: col.valueGetter,
        }));
      exportToExcel(filteredRows, exportColumns, `odemeler_${filters.year}${filters.month ? `_${filters.month}` : ''}`);
      toast.showSuccess('Excel dosyası indirildi');
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.showError('Excel export sırasında bir hata oluştu');
    }
  };

  const handleExportPDF = () => {
    try {
      const exportColumns: ExportColumn[] = columns
        .filter((col) => col.field !== 'actions')
        .map((col) => ({
          field: col.field,
          headerName: col.headerName || '',
          width: col.width || (col.flex ? (col.flex as number) * 10 : 15),
          valueGetter: col.valueGetter,
        }));
      const title = `Ödemeler - ${filters.year}${filters.month ? ` ${monthNames[filters.month - 1]}` : ' (Tüm Yıl)'}`;
      exportToPDF(filteredRows, exportColumns, `odemeler_${filters.year}${filters.month ? `_${filters.month}` : ''}`, title);
      toast.showSuccess('PDF dosyası indirildi');
    } catch (error) {
      console.error('PDF export hatası:', error);
      toast.showError('PDF export sırasında bir hata oluştu');
    }
  };

  const handleSubmitPayment = async () => {
    // Validasyon
    if (!paymentForm.memberId || !paymentForm.amount || !paymentForm.paymentPeriodMonth || !paymentForm.paymentPeriodYear) {
      toast.showError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Tevkifat merkezi zorunlu
    if (!paymentForm.tevkifatCenterId) {
      toast.showError('Tevkifat merkezi seçilmelidir');
      return;
    }

    // Tutar formatını kontrol et
    const amountRegex = /^\d+(\.\d{1,2})?$/;
    const normalizedAmount = paymentForm.amount.replace(',', '.');
    if (!amountRegex.test(normalizedAmount)) {
      toast.showError('Tutar formatı geçersiz. Örnek: 250.00');
      return;
    }

    setSubmittingPayment(true);
    try {
      // Önce dosya varsa yükle
      let documentUrl: string | undefined;
      if (paymentForm.documentFile) {
        try {
          const uploadResult = await uploadPaymentDocument(
            paymentForm.documentFile,
            paymentForm.memberId,
            paymentForm.paymentPeriodMonth,
            paymentForm.paymentPeriodYear,
            paymentForm.documentFileName || undefined,
          );
          documentUrl = uploadResult.fileUrl;
        } catch (uploadError: any) {
          console.error('Dosya yüklenirken hata:', uploadError);
          toast.showError(uploadError?.response?.data?.message || 'Dosya yüklenirken bir hata oluştu');
          setSubmittingPayment(false);
          return;
        }
      }

      const payload: CreateMemberPaymentDto = {
        memberId: paymentForm.memberId,
        paymentPeriodMonth: paymentForm.paymentPeriodMonth,
        paymentPeriodYear: paymentForm.paymentPeriodYear,
        amount: normalizedAmount,
        paymentType: paymentForm.paymentType,
        description: paymentForm.description || undefined,
        tevkifatCenterId: paymentForm.tevkifatCenterId,
        documentUrl,
      };

      await createPayment(payload);
      toast.showSuccess('Ödeme başarıyla eklendi');
      
      // Formu sıfırla
      setPaymentForm({
        memberId: '',
        paymentPeriodMonth: new Date().getMonth() + 1,
        paymentPeriodYear: new Date().getFullYear(),
        amount: '',
        paymentType: 'TEVKIFAT',
        tevkifatCenterId: '',
        description: '',
        documentFile: null,
        documentFileName: '',
      });
      
      setPaymentDialogOpen(false);
      
      // Listeyi yenile
      await loadPayments();
    } catch (e: any) {
      console.error('Ödeme eklenirken hata:', e);
      toast.showError(e?.response?.data?.message || 'Ödeme eklenirken bir hata oluştu');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const monthNames = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];

  const paymentTypeLabels: Record<PaymentType, string> = {
    TEVKIFAT: 'Tevkifat',
    ELDEN: 'Elden',
    HAVALE: 'Havale',
  };

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      (row.member?.firstName || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (row.member?.lastName || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (row.registrationNumber || '').includes(searchText) ||
      (row.member?.institution?.name || '').toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const columns: GridColDef<MemberPayment>[] = [
    {
      field: 'registrationNumber',
      headerName: 'Üye Kayıt No',
      width: 130,
      valueGetter: (_value, row) => row.registrationNumber || row.member?.registrationNumber || '-',
    },
    {
      field: 'memberName',
      headerName: 'Ad Soyad',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value, row) =>
        row.member
          ? `${row.member.firstName} ${row.member.lastName}`
          : `${row.createdByUser.firstName} ${row.createdByUser.lastName}`,
    },
    {
      field: 'institution',
      headerName: 'Kurum',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value, row) => row.member?.institution?.name || '-',
    },
    {
      field: 'tevkifatCenter',
      headerName: 'Tevkifat Merkezi',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value, row) => row.tevkifatCenter?.name || '-',
    },
    {
      field: 'month',
      headerName: 'Ay',
      width: 100,
      valueGetter: (_value, row) => monthNames[row.paymentPeriodMonth - 1],
    },
    {
      field: 'year',
      headerName: 'Yıl',
      width: 100,
      valueGetter: (_value, row) => row.paymentPeriodYear,
    },
    {
      field: 'amount',
      headerName: 'Ödenen Tutar',
      width: 150,
      align: 'right',
      valueGetter: (value) =>
        new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY',
        }).format(Number(value)),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        const payment = params.row as MemberPayment;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Detay">
              <IconButton
                size="small"
                onClick={() => navigate(`/payments/${payment.id}`)}
                sx={{ color: theme.palette.info.main }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: (theme) => 
        theme.palette.mode === 'light' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`
          : theme.palette.background.default,
      pb: 4,
    }}>
      {/* Modern Başlık Bölümü */}
      <PageHeader
        icon={<PaymentIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
        title="Ödeme Sorgulama Sayfası"
        description="Üye bazlı gerçek ödeme kayıtlarının takibi"
        color={theme.palette.primary.main}
        darkColor={theme.palette.primary.dark}
        lightColor={theme.palette.primary.light}
        rightContent={
          canAddPayment ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setPaymentDialogOpen(true)}
              size="large"
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                },
              }}
            >
              Yeni Ödeme Ekle
            </Button>
          ) : undefined
        }
        mobileContent={
          canAddPayment ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={() => setPaymentDialogOpen(true)}
              size="large"
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              Yeni Ödeme Ekle
            </Button>
          ) : undefined
        }
      />

      {/* Ana Kart - Filtre ve Tablo */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Gelişmiş Filtre Bölümü */}
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.01)} 100%)`,
            borderBottom: `2px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <SearchIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Filtrele ve Ara
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                Ödemeleri hızlıca bulun ve filtreleyin
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Ara (ad, soyad, kayıt no, kurum)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="medium"
              sx={{ 
                flexGrow: 1, 
                minWidth: { xs: '100%', sm: 250 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '2px',
                    },
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.4rem' }} />
                  </InputAdornment>
                ),
              }}
            />
          <FormControl 
            size="medium" 
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                borderRadius: 2.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
              },
            }}
          >
            <InputLabel>Yıl</InputLabel>
            <Select
              value={filters.year || new Date().getFullYear()}
              label="Yıl"
              onChange={(e) =>
                setFilters({ ...filters, year: Number(e.target.value) })
              }
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl 
            size="medium" 
            sx={{ 
              minWidth: { xs: '100%', sm: 150 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                borderRadius: 2.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
              },
            }}
          >
            <InputLabel>Ay</InputLabel>
            <Select
              value={showAllYear ? 'ALL' : (filters.month || new Date().getMonth() + 1)}
              label="Ay"
              onChange={(e) => {
                if (e.target.value === 'ALL') {
                  setShowAllYear(true);
                  setFilters({ ...filters, month: undefined });
                } else {
                  setShowAllYear(false);
                  setFilters({ ...filters, month: Number(e.target.value) });
                }
              }}
            >
              <MenuItem value="ALL">Tüm Yıl</MenuItem>
              {monthNames.map((month, index) => (
                <MenuItem key={index} value={index + 1}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl 
            size="medium" 
            sx={{ 
              minWidth: { xs: '100%', sm: 200 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                borderRadius: 2.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
              },
            }}
          >
            <InputLabel>Kurum</InputLabel>
            <Select
              value={selectedInstitutionId || ''}
              label="Kurum"
              onChange={(e) => setSelectedInstitutionId(e.target.value)}
            >
              <MenuItem value="">Tümü</MenuItem>
              {institutions.map((institution) => (
                <MenuItem key={institution.id} value={institution.id}>
                  {institution.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl 
            size="medium" 
            sx={{ 
              minWidth: { xs: '100%', sm: 180 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                borderRadius: 2.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
              },
            }}
          >
            <InputLabel>Tevkifat Merkezi</InputLabel>
            <Select
              value={filters.tevkifatCenterId || 'ALL'}
              label="Tevkifat Merkezi"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  tevkifatCenterId: e.target.value === 'ALL' ? undefined : e.target.value,
                })
              }
            >
              <MenuItem value="ALL">Tümü</MenuItem>
              {tevkifatCenters.map((center) => (
                <MenuItem key={center.id} value={center.id}>
                  {center.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          </Box>

          {/* Sonuç Sayısı */}
          {!loading && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.info.dark,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '0.9rem',
                }}
              >
                <PaymentIcon fontSize="small" />
                {filteredRows.length} ödeme listeleniyor
                {filteredRows.length !== rows.length && ` (Toplam ${rows.length} ödemeden)`}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Tablo Bölümü */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {/* Export Butonları */}
          {!loading && canExport && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
              {canExport && (
            <>
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportExcel}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 2.5,
                    fontWeight: 600,
                    px: 3,
                    py: 1.25,
                    fontSize: '0.9rem',
                    borderWidth: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  }}
                >
                  Excel İndir
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleExportPDF}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 2.5,
                    fontWeight: 600,
                    px: 3,
                    py: 1.25,
                    fontSize: '0.9rem',
                    borderWidth: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  }}
                >
                  PDF İndir
                </Button>
              </>
            )}
            </Box>
          )}

          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              height: { xs: 450, sm: 550, md: 650 },
              minHeight: { xs: 450, sm: 550, md: 650 },
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                py: 2,
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-columnHeaders': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                borderRadius: 0,
                minHeight: '56px !important',
                maxHeight: '56px !important',
                '& .MuiDataGrid-columnHeader': {
                  display: 'flex',
                  alignItems: 'center',
                },
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '0.9rem',
                color: theme.palette.text.primary,
              },
              '& .MuiDataGrid-row': {
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.03),
                  boxShadow: `inset 4px 0 0 ${theme.palette.primary.main}`,
                },
                '&:nth-of-type(even)': {
                  backgroundColor: alpha(theme.palette.grey[50], 0.3),
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.grey[50], 0.5),
                minHeight: '52px',
              },
              '& .MuiDataGrid-virtualScroller': {
                minHeight: '200px',
              },
            }}
          >
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 },
                },
              }}
              localeText={{
                noRowsLabel: 'Ödeme bulunamadı',
              }}
            />
          </Box>
        </Box>
      </Card>

      {/* Ödeme Ekleme Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => !submittingPayment && setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <PaymentIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Yeni Ödeme Ekle
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) => 
                    `${option.firstName} ${option.lastName}${option.registrationNumber ? ` (${option.registrationNumber})` : ''}`
                  }
                  value={members.find(m => m.id === paymentForm.memberId) || null}
                  onChange={(_, newValue) => {
                    const newMemberId = newValue?.id || '';
                    // Dosya adını güncelle
                    let newFileName = paymentForm.documentFileName;
                    if (paymentForm.documentFile && newMemberId) {
                      const selectedMember = members.find(m => m.id === newMemberId);
                      if (selectedMember) {
                        const monthNames = [
                          'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
                          'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
                        ];
                        const monthName = monthNames[paymentForm.paymentPeriodMonth - 1] || `Ay${paymentForm.paymentPeriodMonth}`;
                        const memberName = `${selectedMember.firstName}_${selectedMember.lastName}`
                          .replace(/[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]/g, '')
                          .replace(/\s+/g, '_')
                          .substring(0, 50);
                        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
                        const timestamp = Date.now();
                        newFileName = `Odeme_${memberName}_${monthName}${paymentForm.paymentPeriodYear}_${dateStr}_${timestamp}`;
                      }
                    }
                    setPaymentForm({ ...paymentForm, memberId: newMemberId, documentFileName: newFileName });
                  }}
                  disabled={submittingPayment}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Üye"
                      required
                      placeholder="Üye seçin..."
                      sx={{ minWidth: 250 }}
                    />
                  )}
                  sx={{ minWidth: 250 }}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth required sx={{ minWidth: 200 }}>
                  <InputLabel>Ödeme Dönemi Ay</InputLabel>
                  <Select
                    value={paymentForm.paymentPeriodMonth}
                    onChange={(e) => {
                      const newMonth = Number(e.target.value);
                      // Dosya adını güncelle
                      let newFileName = paymentForm.documentFileName;
                      if (paymentForm.documentFile && paymentForm.memberId) {
                        const selectedMember = members.find(m => m.id === paymentForm.memberId);
                        if (selectedMember) {
                          const monthNames = [
                            'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
                            'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
                          ];
                          const monthName = monthNames[newMonth - 1] || `Ay${newMonth}`;
                          const memberName = `${selectedMember.firstName}_${selectedMember.lastName}`
                            .replace(/[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]/g, '')
                            .replace(/\s+/g, '_')
                            .substring(0, 50);
                          const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          const timestamp = Date.now();
                          newFileName = `Odeme_${memberName}_${monthName}${paymentForm.paymentPeriodYear}_${dateStr}_${timestamp}`;
                        }
                      }
                      setPaymentForm({ ...paymentForm, paymentPeriodMonth: newMonth, documentFileName: newFileName });
                    }}
                    label="Ödeme Dönemi Ay"
                    disabled={submittingPayment}
                  >
                    {monthNames.map((month, index) => (
                      <MenuItem key={index} value={index + 1}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Ödeme Dönemi Yıl"
                  type="number"
                  value={paymentForm.paymentPeriodYear}
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    // Dosya adını güncelle
                    let newFileName = paymentForm.documentFileName;
                    if (paymentForm.documentFile && paymentForm.memberId) {
                      const selectedMember = members.find(m => m.id === paymentForm.memberId);
                      if (selectedMember) {
                        const monthNames = [
                          'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
                          'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
                        ];
                        const monthName = monthNames[paymentForm.paymentPeriodMonth - 1] || `Ay${paymentForm.paymentPeriodMonth}`;
                        const memberName = `${selectedMember.firstName}_${selectedMember.lastName}`
                          .replace(/[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]/g, '')
                          .replace(/\s+/g, '_')
                          .substring(0, 50);
                        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
                        const timestamp = Date.now();
                        newFileName = `Odeme_${memberName}_${monthName}${newYear}_${dateStr}_${timestamp}`;
                      }
                    }
                    setPaymentForm({ ...paymentForm, paymentPeriodYear: newYear, documentFileName: newFileName });
                  }}
                  disabled={submittingPayment}
                  required
                  inputProps={{ min: 2020, max: 2100 }}
                  sx={{ minWidth: 200 }}
                />
            </Box>
            <Box>
                <TextField
                  fullWidth
                  label="Tutar"
                  type="text"
                  value={paymentForm.amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.,]/g, '');
                    setPaymentForm({ ...paymentForm, amount: value });
                  }}
                  disabled={submittingPayment}
                  required
                  placeholder="250.00"
                  helperText="Örnek: 250.00"
                  sx={{ minWidth: 250 }}
                />
            </Box>
            <Box>
                <FormControl fullWidth required sx={{ minWidth: 250 }}>
                  <InputLabel>Tevkifat Merkezi</InputLabel>
                  <Select
                    value={paymentForm.tevkifatCenterId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, tevkifatCenterId: e.target.value })}
                    label="Tevkifat Merkezi"
                    disabled={submittingPayment}
                  >
                    {tevkifatCenters.map((center) => (
                      <MenuItem key={center.id} value={center.id}>
                        {center.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
            </Box>
            <Box>
              <Box sx={{ mb: 2 }}>
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="payment-document-upload"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== 'application/pdf') {
                        toast.showError('Sadece PDF dosyaları yüklenebilir');
                        return;
                      }
                      
                      // Otomatik dosya adı oluştur
                      let fileName = '';
                      if (paymentForm.memberId) {
                        const selectedMember = members.find(m => m.id === paymentForm.memberId);
                        if (selectedMember) {
                          const monthNames = [
                            'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
                            'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
                          ];
                          const monthName = monthNames[paymentForm.paymentPeriodMonth - 1] || `Ay${paymentForm.paymentPeriodMonth}`;
                          
                          // Üye adını temizle
                          const memberName = `${selectedMember.firstName}_${selectedMember.lastName}`
                            .replace(/[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]/g, '')
                            .replace(/\s+/g, '_')
                            .substring(0, 50);
                          
                          const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          const timestamp = Date.now();
                          
                          fileName = `Odeme_${memberName}_${monthName}${paymentForm.paymentPeriodYear}_${dateStr}_${timestamp}.pdf`;
                        }
                      }
                      
                      setPaymentForm({ 
                        ...paymentForm, 
                        documentFile: file,
                        documentFileName: fileName || file.name.replace(/\.pdf$/i, ''),
                      });
                    }
                  }}
                  disabled={submittingPayment}
                />
                <label htmlFor="payment-document-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFileIcon />}
                    disabled={submittingPayment}
                    fullWidth
                    sx={{
                      minWidth: 250,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        borderStyle: 'dashed',
                      },
                    }}
                  >
                    {paymentForm.documentFile ? paymentForm.documentFile.name : 'Evrak Yükle (PDF)'}
                  </Button>
                </label>
                {paymentForm.documentFile && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Dosya Adı"
                      value={paymentForm.documentFileName}
                      onChange={(e) => {
                        let value = e.target.value;
                        // .pdf uzantısını kaldır (otomatik eklenecek)
                        value = value.replace(/\.pdf$/i, '');
                        setPaymentForm({ ...paymentForm, documentFileName: value });
                      }}
                      disabled={submittingPayment}
                      helperText="Dosya adı otomatik oluşturuldu. İsterseniz değiştirebilirsiniz. (.pdf uzantısı otomatik eklenecek)"
                      sx={{ minWidth: 250, mb: 1 }}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            size="small"
                            onClick={() => setPaymentForm({ ...paymentForm, documentFile: null, documentFileName: '' })}
                            disabled={submittingPayment}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        ),
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Orijinal dosya: {paymentForm.documentFile.name}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            <Box>
                <TextField
                  fullWidth
                  label="Açıklama"
                  multiline
                  rows={3}
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  disabled={submittingPayment}
                  placeholder="Ödeme açıklaması (opsiyonel)"
                  sx={{ minWidth: 250 }}
                />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.primary.main, 0.04) }}>
          <Button 
            onClick={() => setPaymentDialogOpen(false)} 
            disabled={submittingPayment}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmitPayment}
            variant="contained"
            disabled={
              submittingPayment || 
              !paymentForm.memberId || 
              !paymentForm.amount || 
              !paymentForm.paymentPeriodMonth || 
              !paymentForm.paymentPeriodYear ||
              !paymentForm.tevkifatCenterId
            }
            startIcon={submittingPayment ? <CircularProgress size={16} /> : <PaymentIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }
            }}
          >
            {submittingPayment ? 'Ekleniyor...' : 'Ödeme Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsListPage;
