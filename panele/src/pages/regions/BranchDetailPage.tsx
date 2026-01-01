// src/pages/regions/BranchDetailPage.tsx
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
  useTheme,
  alpha,
  Divider,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getBranchById, type BranchDetail } from '../../api/branchesApi';
import { getMembers } from '../../api/membersApi';
import type { MemberListItem } from '../../types/member';

const BranchDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentMembers, setRecentMembers] = useState<MemberListItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const canView = hasPermission('BRANCH_MANAGE') || hasPermission('MEMBER_LIST_BY_PROVINCE');

  useEffect(() => {
    if (id && canView) {
      loadBranch();
      loadRecentMembers();
    }
  }, [id, canView]);

  const loadBranch = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getBranchById(id);
      setBranch(data);
    } catch (e: any) {
      console.error('Şube detayı alınırken hata:', e);
      toast.showError('Şube detayı alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentMembers = async () => {
    if (!id) return;
    setLoadingMembers(true);
    try {
      const allMembers = await getMembers();
      const branchMembers = allMembers
        .filter((member) => member.branch?.id === id)
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
      setRecentMembers(branchMembers);
    } catch (e: any) {
      console.error('Üyeler yüklenirken hata:', e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

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

  if (!branch) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Şube bulunamadı</Alert>
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
          onClick={() => navigate('/regions/branches')}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
          }}
        >
          Şube Listesine Dön
        </Button>

        {/* Modern Header Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            overflow: 'visible',
            position: 'relative',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 4,
              padding: '2px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              >
                <BusinessIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'white' }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                    mb: 1,
                    wordBreak: 'break-word',
                  }}
                >
                  {branch.name}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.95,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                  }}
                >
                  Şube Detay Bilgileri ve İstatistikler
                </Typography>
              </Box>
              <Chip
                label={branch.isActive ? 'Aktif' : 'Pasif'}
                color={branch.isActive ? 'success' : 'default'}
                sx={{
                  height: 36,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
            </Box>
          </Box>
        </Card>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }}>
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ color: theme.palette.primary.main }} />
              Genel Bilgiler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {branch.province && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <LocationOnIcon sx={{ color: theme.palette.primary.main, mt: 0.5, fontSize: '1.25rem' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Konum
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {branch.province.name}
                      {branch.district && ` / ${branch.district.name}`}
                    </Typography>
                  </Box>
                </Box>
              )}
              {branch.president && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <PersonIcon sx={{ color: theme.palette.primary.main, mt: 0.5, fontSize: '1.25rem' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Şube Başkanı
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {branch.president.firstName} {branch.president.lastName}
                    </Typography>
                    {branch.president.email && (
                      <Typography variant="caption" color="text.secondary">
                        {branch.president.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CalendarTodayIcon sx={{ color: theme.palette.primary.main, fontSize: '1.25rem' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Oluşturulma Tarihi
                  </Typography>
                  <Typography variant="body1">{formatDate(branch.createdAt)}</Typography>
                </Box>
              </Box>
              {branch.updatedAt && branch.updatedAt !== branch.createdAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarTodayIcon sx={{ color: theme.palette.primary.main, fontSize: '1.25rem' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Son Güncelleme
                    </Typography>
                    <Typography variant="body1">{formatDate(branch.updatedAt)}</Typography>
                  </Box>
                </Box>
              )}
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
                boxShadow: `0 12px 28px ${alpha(theme.palette.success.main, 0.15)}`,
                transform: 'translateY(-4px)',
                borderColor: 'success.main',
              }
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
              İstatistikler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PeopleIcon sx={{ color: theme.palette.primary.main }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Üye Sayısı
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {branch.memberCount || 0}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.2)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PeopleIcon sx={{ color: theme.palette.success.main }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aktif Üye Sayısı
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {branch.activeMemberCount || 0}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.2)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUpIcon sx={{ color: theme.palette.info.main }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tevkifat Merkezlerinden Gelen Toplam Gelir
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    }).format(Number(branch.totalRevenue || 0))}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.2)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoneyIcon sx={{ color: theme.palette.success.main }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Şube Payı ({branch.branchSharePercent || 40}%)
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    }).format(Number(branch.branchShareAmount || 0))}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Son Üyeler */}
        <Grid size={{ xs: 12 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              p: { xs: 2, md: 3 },
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: `0 12px 28px ${alpha(theme.palette.info.main, 0.15)}`,
                transform: 'translateY(-4px)',
                borderColor: 'info.main',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Son Üyeler
                </Typography>
              </Box>
              {branch.memberCount && branch.memberCount > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  color="info"
                  onClick={() => navigate(`/members?branchId=${id}`)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                    }
                  }}
                >
                  Tümünü Gör
                </Button>
              )}
            </Box>
            {loadingMembers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : recentMembers.length === 0 ? (
              <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                <Typography variant="body2" color="text.secondary">
                  Bu şubeye kayıtlı üye bulunmamaktadır
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.info.main, 0.04) }}>
                      <TableCell sx={{ fontWeight: 700 }}>Kayıt No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Ad Soyad</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Kurum</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Durum</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentMembers.map((member) => (
                      <TableRow 
                        key={member.id} 
                        hover
                        sx={{
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.info.main, 0.06),
                          }
                        }}
                      >
                        <TableCell>{member.registrationNumber || '-'}</TableCell>
                        <TableCell>
                          {member.firstName} {member.lastName}
                        </TableCell>
                        <TableCell>{member.institution?.name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              member.status === 'ACTIVE'
                                ? 'Aktif'
                                : member.status === 'PENDING'
                                  ? 'Onay Bekliyor'
                                  : member.status === 'INACTIVE'
                                    ? 'Pasif'
                                    : member.status === 'RESIGNED'
                                      ? 'İstifa'
                                      : member.status === 'EXPELLED'
                                        ? 'İhraç'
                                        : member.status
                            }
                            color={
                              member.status === 'ACTIVE'
                                ? 'success'
                                : member.status === 'PENDING'
                                  ? 'warning'
                                  : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/members/${member.id}`)}
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
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

export default BranchDetailPage;
