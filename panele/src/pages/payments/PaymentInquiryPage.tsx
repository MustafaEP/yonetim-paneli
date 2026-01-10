// src/pages/payments/PaymentInquiryPage.tsx
import React, { useState, useEffect } from 'react';
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
  Alert,
  useTheme,
  alpha,
  Paper,
  Grid,
  CircularProgress,
  Divider,
  Autocomplete,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getPayments,
  type MemberPayment,
  type PaymentType,
} from '../../api/paymentsApi';
import { getMembers } from '../../api/membersApi';
import type { MemberListItem } from '../../types/member';

const PaymentInquiryPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'registrationNumber' | 'name'>('registrationNumber');
  const [selectedMember, setSelectedMember] = useState<MemberListItem | null>(null);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [rows, setRows] = useState<MemberPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const canView = hasPermission('MEMBER_PAYMENT_LIST');

  useEffect(() => {
    if (searchType === 'name' && members.length === 0) {
      loadMembers();
    }
  }, [searchType]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (e) {
      console.error('Üyeler yüklenirken hata:', e);
      toast.showError('Üyeler yüklenirken bir hata oluştu');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSearch = async () => {
    if (searchType === 'registrationNumber' && !searchQuery.trim()) {
      toast.showError('Lütfen bir kayıt numarası girin');
      return;
    }

    if (searchType === 'name' && !selectedMember) {
      toast.showError('Lütfen bir üye seçin');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const filters: any = {};
      
      if (searchType === 'registrationNumber') {
        filters.registrationNumber = searchQuery.trim();
      } else if (searchType === 'name' && selectedMember) {
        filters.memberId = selectedMember.id;
      }

      const data = await getPayments(filters);
      setRows(data);
      
      if (data.length === 0) {
        toast.showInfo('Sorgu kriterlerine uygun ödeme bulunamadı');
      } else {
        toast.showSuccess(`${data.length} ödeme bulundu`);
      }
    } catch (e: any) {
      console.error('Ödeme sorgulama hatası:', e);
      toast.showError('Ödeme sorgulanırken bir hata oluştu');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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
      field: 'paymentDate',
      headerName: 'Ödeme Tarihi',
      width: 150,
      valueGetter: (value) => {
        if (!value) return '-';
        return new Date(value as string).toLocaleDateString('tr-TR');
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
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
              <SearchIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />
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
                Ödeme Sorgulama
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 500,
                }}
              >
                Üye kayıt numarası veya ad-soyad ile ödeme sorgulama
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Sorgulama Kartı */}
      <Card
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
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
                Sorgulama Kriterleri
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                Üye bilgileri ile ödeme kayıtlarını sorgulayın
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 1, minWidth: 200 }}>
                <Button
                  variant={searchType === 'registrationNumber' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setSearchType('registrationNumber');
                    setSelectedMember(null);
                    setSearchQuery('');
                  }}
                  size="small"
                  sx={{
                    flex: 1,
                    textTransform: 'none',
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  Kayıt No
                </Button>
                <Button
                  variant={searchType === 'name' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setSearchType('name');
                    setSearchQuery('');
                    if (members.length === 0) {
                      loadMembers();
                    }
                  }}
                  size="small"
                  sx={{
                    flex: 1,
                    textTransform: 'none',
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  Ad-Soyad
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={7}>
              {searchType === 'registrationNumber' ? (
                <TextField
                  fullWidth
                  placeholder="Üye kayıt numarası girin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  size="medium"
                  sx={{ 
                    minWidth: 300,
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
              ) : (
                <Autocomplete
                  fullWidth
                  options={members}
                  loading={loadingMembers}
                  value={selectedMember}
                  onChange={(_, newValue) => {
                    setSelectedMember(newValue);
                    if (newValue) {
                      setSearchQuery(`${newValue.firstName} ${newValue.lastName}`);
                    } else {
                      setSearchQuery('');
                    }
                  }}
                  getOptionLabel={(option) => 
                    `${option.firstName} ${option.lastName}${option.registrationNumber ? ` (${option.registrationNumber})` : ''}`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Üye adı-soyadı ile arayın veya seçin..."
                      size="medium"
                      sx={{ 
                        minWidth: 300,
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
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.4rem' }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter(
                      (option) =>
                        `${option.firstName} ${option.lastName}`.toLowerCase().includes(searchTerm) ||
                        (option.registrationNumber && option.registrationNumber.toLowerCase().includes(searchTerm))
                    );
                  }}
                  noOptionsText="Üye bulunamadı"
                  loadingText="Üyeler yükleniyor..."
                />
              )}
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={loading || (searchType === 'registrationNumber' ? !searchQuery.trim() : !selectedMember)}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                size="large"
                sx={{
                  minWidth: 120,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  },
                  '&:disabled': {
                    background: theme.palette.action.disabledBackground,
                  },
                }}
              >
                {loading ? 'Aranıyor...' : 'Sorgula'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Sonuçlar Kartı */}
      {searched && (
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
          <Box
            sx={{
              p: { xs: 3, sm: 4 },
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
              borderBottom: `2px solid ${alpha(theme.palette.divider, 0.08)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  <PaymentIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Sorgulama Sonuçları
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {rows.length > 0 
                      ? `${rows.length} ödeme kaydı bulundu`
                      : 'Sorgu kriterlerine uygun ödeme bulunamadı'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {rows.length > 0 ? (
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    borderRadius: 0,
                    minHeight: '56px !important',
                    maxHeight: '56px !important',
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
                  rows={rows}
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
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Sorgu kriterlerine uygun ödeme kaydı bulunamadı. Lütfen farklı bir kriter deneyin.
              </Alert>
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
};

export default PaymentInquiryPage;

