// src/pages/accounting/TevkifatCenterDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import { useAuth } from '../../../app/providers/AuthContext';
import { useToast } from '../../../shared/hooks/useToast';
import { getApiErrorMessage } from '../../../shared/utils/errorUtils';
import {
  getTevkifatCenterById,
  getTevkifatFiles,
  getTevkifatCenters,
  type TevkifatCenterDetail,
  type TevkifatFile,
  type TevkifatCenter,
} from '../services/accountingApi';
import DeleteTevkifatCenterDialog from '../components/DeleteTevkifatCenterDialog';
import { getMembers } from '../../members/services/membersApi';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import PageHeader from '../../../shared/components/layout/PageHeader';

const TevkifatCenterDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [center, setCenter] = useState<TevkifatCenterDetail | null>(null);
  const [files, setFiles] = useState<TevkifatFile[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const membersSectionRef = React.useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [availableCenters, setAvailableCenters] = useState<TevkifatCenter[]>([]);

  const canView = hasPermission('ACCOUNTING_VIEW');
  const canManage = hasPermission('ACCOUNTING_VIEW');

  useEffect(() => {
    if (id && canView) {
      loadCenter();
      loadFiles();
      loadMembers();
      loadAvailableCenters();
    }
  }, [id, canView]);

  const loadAvailableCenters = async () => {
    try {
      const data = await getTevkifatCenters();
      setAvailableCenters(data);
    } catch (e: unknown) {
      console.error('Tevkifat merkezleri yüklenirken hata:', e);
    }
  };

  const loadCenter = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getTevkifatCenterById(id);
      setCenter(data);
    } catch (e: unknown) {
      console.error('Tevkifat merkezi detayı alınırken hata:', e);
      toast.showError(getApiErrorMessage(e, 'Tevkifat merkezi detayı alınamadı'));
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    if (!id) return;
    setLoadingFiles(true);
    try {
      const data = await getTevkifatFiles({ tevkifatCenterId: id });
      setFiles(data);
    } catch (e: unknown) {
      console.error('Tevkifat dosyaları yüklenirken hata:', e);
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadMembers = async () => {
    if (!id) return;
    setLoadingMembers(true);
    try {
      const allMembers = await getMembers();
      // Bu tevkifat merkezine bağlı üyeleri filtrele
      const centerMembers = allMembers.filter(
        (member: any) => member.tevkifatCenter?.id === id
      );
      setMembers(centerMembers);
    } catch (e: unknown) {
      console.error('Üyeler yüklenirken hata:', e);
      toast.showError(getApiErrorMessage(e, 'Üyeler yüklenirken bir hata oluştu'));
    } finally {
      setLoadingMembers(false);
    }
  };


  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Onay Bekliyor';
      case 'APPROVED':
        return 'Onaylandı';
      case 'REJECTED':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'warning';
    }
  };

  const handleDeleteSuccess = () => {
    navigate('/accounting/tevkifat-centers');
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

  if (!canView) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            borderRadius: 3,
            boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`,
          }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            Yetkisiz İşlem
          </Typography>
          <Typography color="text.secondary">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!center) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert 
          severity="error"
          sx={{
            borderRadius: 2.5,
            boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`,
          }}
        >
          Tevkifat merkezi bulunamadı
        </Alert>
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
      {/* Back Button */}
      <Box sx={{ mb: 3, pt: { xs: 2, md: 3 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/accounting/tevkifat-centers')}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
          }}
        >
          Geri Dön
        </Button>

        {/* Modern Header Card */}
        <PageHeader
          icon={<BusinessIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
          title={center.name}
          description="Tevkifat Merkezi Detayları"
          color={theme.palette.primary.main}
          darkColor={theme.palette.primary.dark}
          lightColor={theme.palette.primary.light}
          rightContent={
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={center.isActive ? 'Aktif' : 'Pasif'}
                color={center.isActive ? 'success' : 'default'}
                sx={{
                  height: 36,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  backgroundColor: 'white',
                  color: center.isActive ? theme.palette.success.main : theme.palette.text.secondary,
                }}
              />
              {canManage && (
                <>
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/accounting/tevkifat-centers/${id}/edit`)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: 'white',
                        color: theme.palette.primary.main,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                        '&:hover': {
                          backgroundColor: alpha('#fff', 0.9),
                          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                        },
                      }}
                    >
                      Düzenle
                    </Button>
                    {center.isActive && (
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<BlockIcon />}
                        onClick={() => {
                          setDeleteDialogOpen(true);
                        }}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          backgroundColor: 'white',
                          borderColor: 'white',
                          color: theme.palette.warning.main,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.warning.main, 0.1),
                            borderColor: 'white',
                          },
                        }}
                      >
                        Kaldır
                      </Button>
                    )}
                  </>
                )}
              </Box>
          }
        />
      </Box>

      <Grid container spacing={3}>
        {/* Genel Bilgiler */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              p: { xs: 2, md: 3 },
              height: '100%',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.15)}`,
                transform: 'translateY(-4px)',
                borderColor: 'primary.main',
              }
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ color: theme.palette.primary.main }} />
              Genel Bilgiler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {(center as any).title && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                    Tevkifat Ünvanı
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {(center as any).title}
                  </Typography>
                </Box>
              )}
              {(center as any).address && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                    Adres
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {(center as any).address}
                  </Typography>
                </Box>
              )}
              {(center as any).description && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                    Açıklama
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {(center as any).description}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Toplam Üye Sayısı
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.main,
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => {
                    membersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {members.length || center._count.members}
                  </Typography>
                  <LinkIcon fontSize="small" sx={{ opacity: 0.6 }} />
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* İstatistikler */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              p: { xs: 2, md: 3 },
              height: '100%',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: `0 12px 28px ${alpha(theme.palette.info.main, 0.15)}`,
                transform: 'translateY(-4px)',
                borderColor: 'info.main',
              }
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon sx={{ color: theme.palette.info.main }} />
              İstatistikler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Toplam Dosya Sayısı
                </Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">
                  {center._count.files}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Toplam Ödeme Sayısı
                </Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {center._count.payments}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Yıllık Özet */}
        {center.yearlySummary && center.yearlySummary.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: `0 12px 28px ${alpha(theme.palette.warning.main, 0.15)}`,
                  transform: 'translateY(-4px)',
                  borderColor: 'warning.main',
                }
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                  Yıllık Özet
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.06) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Yıl</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Toplam Gelir</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Ortalama Aylık Gelir</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Ödeme Yapan Üye Sayısı</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {center.yearlySummary.map((summary) => (
                        <TableRow key={summary.year} sx={{ '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.02) } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{summary.year}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                            }).format(summary.totalAmount)}
                          </TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                            }).format(summary.averageMonthlyAmount)}
                          </TableCell>
                          <TableCell align="right">{summary.memberCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Card>
          </Grid>
        )}

        {/* Aylık Özet */}
        {center.monthlySummary && center.monthlySummary.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: `0 12px 28px ${alpha(theme.palette.info.main, 0.15)}`,
                  transform: 'translateY(-4px)',
                  borderColor: 'info.main',
                }
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                  Aylık Özet (Son 12 Ay)
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.info.main, 0.06) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Ay</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Yıl</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Gelen Toplam Tutar</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Ödeme Yapan Üye Sayısı</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {center.monthlySummary.map((summary, index) => (
                        <TableRow key={index} sx={{ '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.02) } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{monthNames[summary.month - 1]}</TableCell>
                          <TableCell>{summary.year}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                            }).format(summary.totalAmount)}
                          </TableCell>
                          <TableCell align="right">{summary.memberCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Card>
          </Grid>
        )}

        {/* Bağlı Üyeler */}
        <Grid size={{ xs: 12 }}>
          <Card
            ref={membersSectionRef}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.15)}`,
                transform: 'translateY(-4px)',
                borderColor: 'primary.main',
              }
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PeopleIcon sx={{ color: theme.palette.primary.main, fontSize: '1.25rem' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Bağlı Üyeler ({members.length})
                </Typography>
              </Box>
              {loadingMembers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : members.length === 0 ? (
                <Alert 
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  Bu merkeze bağlı üye bulunmamaktadır
                </Alert>
              ) : (
                <Box
                  sx={{
                    height: 500,
                    '& .MuiDataGrid-root': {
                      border: 'none',
                      borderRadius: 2,
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      fontSize: '0.875rem',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.06),
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    },
                    '& .MuiDataGrid-row': {
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      },
                    },
                  }}
                >
                  <DataGrid
                    rows={members}
                    columns={[
                      {
                        field: 'registrationNumber',
                        headerName: 'Kayıt No',
                        width: 130,
                        valueGetter: (value) => value || '-',
                      },
                      {
                        field: 'fullName',
                        headerName: 'Ad Soyad',
                        flex: 1,
                        minWidth: 200,
                        valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
                      },
                      {
                        field: 'institution',
                        headerName: 'Kurum',
                        flex: 1,
                        minWidth: 200,
                        valueGetter: (_value, row) => row.institution?.name || '-',
                      },
                      {
                        field: 'branch',
                        headerName: 'Şube',
                        flex: 1,
                        minWidth: 150,
                        valueGetter: (_value, row) => row.branch?.name || '-',
                      },
                      {
                        field: 'actions',
                        headerName: 'İşlemler',
                        width: 100,
                        sortable: false,
                        renderCell: (params) => (
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/members/${params.row.id}`)}
                            sx={{ 
                              color: theme.palette.info.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                              },
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        ),
                      },
                    ]}
                    loading={loadingMembers}
                    getRowId={(row) => row.id}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    disableRowSelectionOnClick
                  />
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Bağlı Dosyalar */}
        <Grid size={{ xs: 12 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: `0 12px 28px ${alpha(theme.palette.success.main, 0.15)}`,
                transform: 'translateY(-4px)',
                borderColor: 'success.main',
              }
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DescriptionIcon sx={{ color: theme.palette.success.main, fontSize: '1.25rem' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Bağlı Dosyalar
                </Typography>
              </Box>
              {loadingFiles ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : files.length === 0 ? (
                <Alert 
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  Henüz dosya yüklenmemiş
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.success.main, 0.06) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Ay</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Yıl</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Üye Sayısı</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Toplam Tutar</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Onay Durumu</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id} sx={{ '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.02) } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{monthNames[file.month - 1]}</TableCell>
                          <TableCell>{file.year}</TableCell>
                          <TableCell align="right">{file.memberCount}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                            }).format(Number(file.totalAmount))}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(file.status)}
                              color={getStatusColor(file.status)}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                borderRadius: 1.5,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Tevkifat Merkezi Kaldırma Dialog */}
      {center && (
        <DeleteTevkifatCenterDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          center={{
            id: center.id,
            name: center.name,
            memberCount: center._count.members,
          }}
          availableCenters={availableCenters}
          loadingCenters={false}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </Box>
  );
};

export default TevkifatCenterDetailPage;
