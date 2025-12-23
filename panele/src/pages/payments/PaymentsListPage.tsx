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
  Grid,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaymentIcon from '@mui/icons-material/Payment';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getPayments,
  createPayment,
  type MemberPayment,
  type PaymentListFilters,
  type PaymentType,
  type CreateMemberPaymentDto,
} from '../../api/paymentsApi';
import { getTevkifatCenters } from '../../api/accountingApi';
import { getBranches } from '../../api/branchesApi';
import { getMembers } from '../../api/membersApi';
import type { MemberListItem } from '../../types/member';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../utils/exportUtils';

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
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  
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
  }>({
    memberId: '',
    paymentPeriodMonth: new Date().getMonth() + 1,
    paymentPeriodYear: new Date().getFullYear(),
    amount: '',
    paymentType: 'ELDEN',
    tevkifatCenterId: '',
    description: '',
  });

  const canView = hasPermission('MEMBER_PAYMENT_LIST');
  const canApprove = hasPermission('MEMBER_PAYMENT_APPROVE');
  const canExport = hasPermission('ACCOUNTING_EXPORT');
  const canAddPayment = hasPermission('MEMBER_PAYMENT_ADD');

  useEffect(() => {
    if (canView) {
      loadPayments();
      loadTevkifatCenters();
      loadBranches();
    }
    if (canAddPayment) {
      loadMembers();
    }
  }, [canView, canAddPayment, filters, showAllYear]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const requestFilters = showAllYear 
        ? { ...filters, month: undefined } 
        : filters;
      const data = await getPayments(requestFilters);
      setRows(data);
    } catch (e: any) {
      console.error('Ödemeler yüklenirken hata:', e);
      toast.showError('Ödemeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
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

  const loadBranches = async () => {
    try {
      const data = await getBranches({ isActive: true });
      setBranches(data.map((b) => ({ id: b.id, name: b.name })));
    } catch (e) {
      console.error('Şubeler yüklenirken hata:', e);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await getMembers();
      setMembers(data);
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
          headerName: col.headerName,
          width: col.width,
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
          headerName: col.headerName,
          width: col.width,
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

    // Tevkifat seçilmişse tevkifat merkezi zorunlu
    if (paymentForm.paymentType === 'TEVKIFAT' && !paymentForm.tevkifatCenterId) {
      toast.showError('Tevkifat ödemesi için tevkifat merkezi seçilmelidir');
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
      const payload: CreateMemberPaymentDto = {
        memberId: paymentForm.memberId,
        paymentPeriodMonth: paymentForm.paymentPeriodMonth,
        paymentPeriodYear: paymentForm.paymentPeriodYear,
        amount: normalizedAmount,
        paymentType: paymentForm.paymentType,
        description: paymentForm.description || undefined,
        tevkifatCenterId: paymentForm.paymentType === 'TEVKIFAT' ? paymentForm.tevkifatCenterId : undefined,
      };

      await createPayment(payload);
      toast.showSuccess('Ödeme başarıyla eklendi');
      
      // Formu sıfırla
      setPaymentForm({
        memberId: '',
        paymentPeriodMonth: new Date().getMonth() + 1,
        paymentPeriodYear: new Date().getFullYear(),
        amount: '',
        paymentType: 'ELDEN',
        tevkifatCenterId: '',
        description: '',
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
      valueGetter: (value, row) => row.registrationNumber || row.member?.registrationNumber || '-',
    },
    {
      field: 'memberName',
      headerName: 'Ad Soyad',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row) =>
        row.member
          ? `${row.member.firstName} ${row.member.lastName}`
          : `${row.createdByUser.firstName} ${row.createdByUser.lastName}`,
    },
    {
      field: 'institution',
      headerName: 'Kurum',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row) => row.member?.institution?.name || '-',
    },
    {
      field: 'tevkifatCenter',
      headerName: 'Tevkifat Merkezi',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row) => row.tevkifatCenter?.name || '-',
    },
    {
      field: 'month',
      headerName: 'Ay',
      width: 100,
      valueGetter: (value, row) => monthNames[row.paymentPeriodMonth - 1],
    },
    {
      field: 'year',
      headerName: 'Yıl',
      width: 100,
      valueGetter: (value, row) => row.paymentPeriodYear,
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
      field: 'paymentType',
      headerName: 'Ödeme Türü',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={paymentTypeLabels[params.value as PaymentType]}
          size="small"
          color={params.value === 'TEVKIFAT' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'isApproved',
      headerName: 'Onay Durumu',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Onaylandı' : 'Onay Bekliyor'}
          color={params.value ? 'success' : 'warning'}
          size="small"
        />
      ),
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
            {canApprove && !payment.isApproved && (
              <Tooltip title="Düzenleme sayfası henüz mevcut değil">
                <IconButton
                  size="small"
                  disabled
                  sx={{ color: theme.palette.text.disabled }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
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
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <PaymentIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Ödemeler
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Üye bazlı gerçek ödeme kayıtlarının takibi
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <TextField
            placeholder="Ara (ad, soyad, kayıt no, kurum)..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Ödeme Türü</InputLabel>
            <Select
              value={filters.paymentType || 'ALL'}
              label="Ödeme Türü"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  paymentType: e.target.value === 'ALL' ? undefined : (e.target.value as PaymentType),
                })
              }
            >
              <MenuItem value="ALL">Tümü</MenuItem>
              <MenuItem value="TEVKIFAT">Tevkifat</MenuItem>
              <MenuItem value="ELDEN">Elden</MenuItem>
              <MenuItem value="HAVALE">Havale</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Onay Durumu</InputLabel>
            <Select
              value={filters.isApproved === undefined ? 'ALL' : filters.isApproved ? 'APPROVED' : 'PENDING'}
              label="Onay Durumu"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  isApproved: e.target.value === 'ALL' ? undefined : e.target.value === 'APPROVED',
                })
              }
            >
              <MenuItem value="ALL">Tümü</MenuItem>
              <MenuItem value="APPROVED">Onaylandı</MenuItem>
              <MenuItem value="PENDING">Onay Bekliyor</MenuItem>
            </Select>
          </FormControl>
          {canAddPayment && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setPaymentDialogOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Yeni Ödeme Ekle
            </Button>
          )}
          {canExport && (
            <>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportExcel}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleExportPDF}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                PDF
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          }}
        />
      </Card>

      {/* Ödeme Ekleme Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => !submittingPayment && setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yeni Ödeme Ekle</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) => 
                    `${option.firstName} ${option.lastName}${option.registrationNumber ? ` (${option.registrationNumber})` : ''}`
                  }
                  value={members.find(m => m.id === paymentForm.memberId) || null}
                  onChange={(_, newValue) => {
                    setPaymentForm({ ...paymentForm, memberId: newValue?.id || '' });
                  }}
                  disabled={submittingPayment}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Üye"
                      required
                      placeholder="Üye seçin..."
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Ödeme Dönemi Ay</InputLabel>
                  <Select
                    value={paymentForm.paymentPeriodMonth}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentPeriodMonth: Number(e.target.value) })}
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
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Ödeme Dönemi Yıl"
                  type="number"
                  value={paymentForm.paymentPeriodYear}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentPeriodYear: Number(e.target.value) })}
                  disabled={submittingPayment}
                  required
                  inputProps={{ min: 2020, max: 2100 }}
                />
              </Grid>
              <Grid item xs={12}>
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
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Ödeme Türü</InputLabel>
                  <Select
                    value={paymentForm.paymentType}
                    onChange={(e) => {
                      const newType = e.target.value as PaymentType;
                      setPaymentForm({ 
                        ...paymentForm, 
                        paymentType: newType,
                        tevkifatCenterId: newType === 'TEVKIFAT' ? paymentForm.tevkifatCenterId : '',
                      });
                    }}
                    label="Ödeme Türü"
                    disabled={submittingPayment}
                  >
                    <MenuItem value="ELDEN">Elden Ödeme</MenuItem>
                    <MenuItem value="HAVALE">Havale/EFT</MenuItem>
                    <MenuItem value="TEVKIFAT">Tevkifat</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {paymentForm.paymentType === 'TEVKIFAT' && (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
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
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  multiline
                  rows={3}
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  disabled={submittingPayment}
                  placeholder="Ödeme açıklaması (opsiyonel)"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPaymentDialogOpen(false)} 
            disabled={submittingPayment}
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
              (paymentForm.paymentType === 'TEVKIFAT' && !paymentForm.tevkifatCenterId)
            }
            startIcon={submittingPayment ? <CircularProgress size={16} /> : <PaymentIcon />}
          >
            {submittingPayment ? 'Ekleniyor...' : 'Ödeme Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsListPage;
