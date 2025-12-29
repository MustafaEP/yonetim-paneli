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
  Paper,
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
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import LinkIcon from '@mui/icons-material/Link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getTevkifatCenterById,
  getTevkifatFiles,
  type TevkifatCenterDetail,
  type TevkifatFile,
} from '../../api/accountingApi';
import { getMembers, type MemberListItem } from '../../api/membersApi';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';

const TevkifatCenterDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [center, setCenter] = useState<TevkifatCenterDetail | null>(null);
  const [files, setFiles] = useState<TevkifatFile[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const membersSectionRef = React.useRef<HTMLDivElement>(null);

  const canView = hasPermission('ACCOUNTING_VIEW');

  useEffect(() => {
    if (id && canView) {
      loadCenter();
      loadFiles();
      loadMembers();
    }
  }, [id, canView]);

  const loadCenter = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getTevkifatCenterById(id);
      setCenter(data);
    } catch (e: any) {
      console.error('Tevkifat merkezi detayı alınırken hata:', e);
      toast.showError('Tevkifat merkezi detayı alınamadı');
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
    } catch (e: any) {
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
        (member) => member.tevkifatCenter?.id === id
      );
      setMembers(centerMembers);
    } catch (e: any) {
      console.error('Üyeler yüklenirken hata:', e);
      toast.showError('Üyeler yüklenirken bir hata oluştu');
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
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Tevkifat merkezi bulunamadı</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/accounting/tevkifat-centers')}
          sx={{ mb: 2 }}
        >
          Geri Dön
        </Button>
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
            <BusinessIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
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
              {center.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              {center.code && `Kod: ${center.code}`}
            </Typography>
          </Box>
          <Chip
            label={center.isActive ? 'Aktif' : 'Pasif'}
            color={center.isActive ? 'success' : 'default'}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Genel Bilgiler */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Genel Bilgiler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Kod
                </Typography>
                <Typography variant="body1">{center.code || '-'}</Typography>
              </Box>
              {center.title && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tevkifat Ünvanı
                  </Typography>
                  <Typography variant="body1">{center.title}</Typography>
                </Box>
              )}
              {center.address && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Adres
                  </Typography>
                  <Typography variant="body1">{center.address}</Typography>
                </Box>
              )}
              {center.description && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Açıklama
                  </Typography>
                  <Typography variant="body1">{center.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Toplam Üye Sayısı
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                  onClick={() => {
                    membersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <Typography variant="body1" fontWeight={600}>
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
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              İstatistikler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Toplam Dosya Sayısı
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {center._count.files}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Toplam Ödeme Sayısı
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {center._count.payments}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Yıllık Özet */}
        {center.yearlySummary && center.yearlySummary.length > 0 && (
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                p: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Yıllık Özet
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Yıl</TableCell>
                      <TableCell align="right">Toplam Gelir</TableCell>
                      <TableCell align="right">Ortalama Aylık Gelir</TableCell>
                      <TableCell align="right">Ödeme Yapan Üye Sayısı</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {center.yearlySummary.map((summary) => (
                      <TableRow key={summary.year}>
                        <TableCell>{summary.year}</TableCell>
                        <TableCell align="right">
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
                p: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Aylık Özet (Son 12 Ay)
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ay</TableCell>
                      <TableCell>Yıl</TableCell>
                      <TableCell align="right">Gelen Toplam Tutar</TableCell>
                      <TableCell align="right">Ödeme Yapan Üye Sayısı</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {center.monthlySummary.map((summary, index) => (
                      <TableRow key={index}>
                        <TableCell>{monthNames[summary.month - 1]}</TableCell>
                        <TableCell>{summary.year}</TableCell>
                        <TableCell align="right">
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
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PeopleIcon sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Bağlı Üyeler ({members.length})
              </Typography>
            </Box>
            {loadingMembers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : members.length === 0 ? (
              <Alert severity="info">Bu merkeze bağlı üye bulunmamaktadır</Alert>
            ) : (
              <Box
                sx={{
                  height: 400,
                  '& .MuiDataGrid-root': {
                    border: 'none',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
                          sx={{ color: theme.palette.info.main }}
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
          </Card>
        </Grid>

        {/* Bağlı Dosyalar */}
        <Grid size={{ xs: 12 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Bağlı Dosyalar
            </Typography>
            {loadingFiles ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : files.length === 0 ? (
              <Alert severity="info">Henüz dosya yüklenmemiş</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ay</TableCell>
                      <TableCell>Yıl</TableCell>
                      <TableCell align="right">Üye Sayısı</TableCell>
                      <TableCell align="right">Toplam Tutar</TableCell>
                      <TableCell>Onay Durumu</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>{monthNames[file.month - 1]}</TableCell>
                        <TableCell>{file.year}</TableCell>
                        <TableCell align="right">{file.memberCount}</TableCell>
                        <TableCell align="right">
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
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TevkifatCenterDetailPage;
