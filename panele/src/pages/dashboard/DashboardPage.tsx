// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Paper,
  Avatar,
  Stack,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  LinearProgress,
} from '@mui/material';

import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import MapIcon from '@mui/icons-material/Map';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { useAuth } from '../../context/AuthContext';
import { getMemberApplications, getMembers } from '../../api/membersApi';
import { getUsers } from '../../api/usersApi';
import type { MemberListItem } from '../../types/member';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { hasPermission } = useAuth();

  const canViewApplications = hasPermission('MEMBER_APPROVE') || hasPermission('MEMBER_REJECT');
  const canListMembers = hasPermission('MEMBER_LIST');
  const canCreateMemberApplication = hasPermission('MEMBER_CREATE_APPLICATION');
  const canManageRegions = hasPermission('BRANCH_MANAGE') || hasPermission('REGION_LIST');
  const canListUsers = hasPermission('USER_LIST');

  const [pendingApplicationsCount, setPendingApplicationsCount] = useState<number>(0);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  
  // Statistics state
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [activeMembers, setActiveMembers] = useState<number>(0);
  const [inactiveMembers, setInactiveMembers] = useState<number>(0);
  const [resignedMembers, setResignedMembers] = useState<number>(0);
  const [expelledMembers, setExpelledMembers] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [membersLoading, setMembersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    const loadApplications = async () => {
      if (!canViewApplications) return;
      setApplicationsLoading(true);
      try {
        const data = await getMemberApplications();
        setPendingApplicationsCount(Array.isArray(data) ? data.length : 0);
      } catch (e) {
        console.error('Başvurular alınırken hata:', e);
        setPendingApplicationsCount(0);
      } finally {
        setApplicationsLoading(false);
      }
    };

    loadApplications();
  }, [canViewApplications]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!canListMembers) return;
      setMembersLoading(true);
      try {
        const data = await getMembers();
        const members = Array.isArray(data) ? data : [];
        setTotalMembers(members.length);
        setActiveMembers(members.filter(m => m.status === 'ACTIVE').length);
        setInactiveMembers(members.filter(m => m.status === 'INACTIVE').length);
        setResignedMembers(members.filter(m => m.status === 'RESIGNED').length);
        setExpelledMembers(members.filter(m => m.status === 'EXPELLED').length);
      } catch (e) {
        console.error('Üyeler alınırken hata:', e);
        setTotalMembers(0);
        setActiveMembers(0);
        setInactiveMembers(0);
        setResignedMembers(0);
        setExpelledMembers(0);
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembers();
  }, [canListMembers]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!canListUsers) return;
      setUsersLoading(true);
      try {
        const data = await getUsers();
        const users = Array.isArray(data) ? data : [];
        setTotalUsers(users.length);
        setActiveUsers(users.filter(u => u.isActive).length);
      } catch (e) {
        console.error('Kullanıcılar alınırken hata:', e);
        setTotalUsers(0);
        setActiveUsers(0);
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, [canListUsers]);

  const hasAnyPermission = canViewApplications || canListMembers || canListUsers || canCreateMemberApplication || canManageRegions;
  
  if (!hasAnyPermission) {
    return (
      <Box>
        <Paper 
          sx={{ 
            p: { xs: 3, sm: 4, md: 6 }, 
            textAlign: 'center',
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
          }}
        >
          <WarningAmberIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Dashboard Erişimi
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Dashboard verilerini görmek için gerekli izinlere sahip değilsiniz. Lütfen sistem yöneticinizle iletişime geçin.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const quickActions = [
    {
      show: canCreateMemberApplication,
      title: 'Üye Başvuruları',
      description: 'Yeni üye başvurusu oluşturun veya bekleyen başvuruları yönetin',
      icon: PersonAddAlt1Icon,
      path: '/members/applications',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea',
    },
    {
      show: canManageRegions,
      title: 'Bölge Yönetimi',
      description: 'İl, ilçe, işyeri ve bayileri yönetin',
      icon: MapIcon,
      path: '/regions/provinces',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f093fb',
    },
    {
      show: canListUsers,
      title: 'Kullanıcı Yönetimi',
      description: 'Panel kullanıcılarını, rollerini ve yetkilerini yönetin',
      icon: ManageAccountsIcon,
      path: '/users',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#4facfe',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography 
          variant={isMobile ? 'h5' : 'h4'} 
          fontWeight={700} 
          gutterBottom
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Sendika yönetim sistemi genel görünümü
        </Typography>
      </Box>

      {/* Hızlı Aksiyon Kartları */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {quickActions.filter(action => action.show).map((action) => (
          <Grid item xs={12} sm={6} md={6} lg={3} key={action.path}>
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                minHeight: { xs: 140, sm: 160 },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 3,
                background: '#fff',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: `0 20px 40px ${alpha(action.color, 0.2)}`,
                  border: `1px solid ${alpha(action.color, 0.3)}`,
                  '& .action-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                  },
                  '& .arrow-icon': {
                    transform: 'translateX(4px)',
                    opacity: 1,
                  },
                },
              }}
              onClick={() => navigate(action.path)}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: action.gradient,
                }}
              />
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    className="action-icon"
                    sx={{
                      width: { xs: 48, sm: 56 },
                      height: { xs: 48, sm: 56 },
                      borderRadius: 2.5,
                      background: action.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: `0 8px 16px ${alpha(action.color, 0.3)}`,
                    }}
                  >
                    <action.icon sx={{ color: 'white', fontSize: { xs: 24, sm: 28 } }} />
                  </Box>
                  <ArrowForwardIcon 
                    className="arrow-icon"
                    sx={{ 
                      color: action.color, 
                      opacity: 0,
                      transition: 'all 0.3s ease',
                      fontSize: 20,
                    }} 
                  />
                </Box>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
                >
                  {action.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    lineHeight: 1.6,
                    fontSize: { xs: '0.85rem', sm: '0.875rem' },
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Statistics Cards */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {/* Pending Applications */}
        {canViewApplications && (
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${alpha('#fa709a', 0.3)}`,
                },
              }}
              onClick={() => navigate('/members/applications')}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Bekleyen Başvurular
                    </Typography>
                    {applicationsLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {pendingApplicationsCount}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha('#fff', 0.2),
                      width: { xs: 44, sm: 48 }, 
                      height: { xs: 44, sm: 48 },
                    }}
                  >
                    <PendingActionsIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Active Members */}
        {canListMembers && (
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${alpha('#667eea', 0.3)}`,
                },
              }}
              onClick={() => navigate('/members')}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Aktif Üyeler
                    </Typography>
                    {membersLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {activeMembers}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Toplam: {totalMembers}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha('#fff', 0.2),
                      width: { xs: 44, sm: 48 }, 
                      height: { xs: 44, sm: 48 },
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Total Users */}
        {canListUsers && (
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${alpha('#4facfe', 0.3)}`,
                },
              }}
              onClick={() => navigate('/users')}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Panel Kullanıcıları
                    </Typography>
                    {usersLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {totalUsers}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Aktif: {activeUsers}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha('#fff', 0.2),
                      width: { xs: 44, sm: 48 }, 
                      height: { xs: 44, sm: 48 },
                    }}
                  >
                    <ManageAccountsIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Inactive/Resigned Members */}
        {canListMembers && (inactiveMembers > 0 || resignedMembers > 0 || expelledMembers > 0) && (
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${alpha('#f093fb', 0.3)}`,
                },
              }}
              onClick={() => navigate('/members')}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Pasif/İptal Üyeler
                    </Typography>
                    {membersLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {inactiveMembers + resignedMembers + expelledMembers}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Pasif: {inactiveMembers} | İstifa: {resignedMembers} | İhraç: {expelledMembers}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha('#fff', 0.2),
                      width: { xs: 44, sm: 48 }, 
                      height: { xs: 44, sm: 48 },
                    }}
                  >
                    <PersonOffIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Detailed Statistics Section */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mt: { xs: 2, sm: 3 } }}>
        {/* Member Statistics */}
        {canListMembers && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 40, height: 40 }}>
                    <PeopleIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                    Üye İstatistikleri
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />
                {membersLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <Stack spacing={2.5}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                          Toplam Üyeler
                        </Typography>
                        <Chip
                          label={totalMembers}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                          },
                        }} 
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                          Aktif Üyeler
                        </Typography>
                        <Chip
                          label={activeMembers}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                    </Box>
                    {(inactiveMembers > 0 || resignedMembers > 0 || expelledMembers > 0) && (
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                            Pasif/İptal Üyeler
                          </Typography>
                          <Chip
                            label={inactiveMembers + resignedMembers + expelledMembers}
                            color="default"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          {inactiveMembers > 0 && (
                            <Chip 
                              label={`Pasif: ${inactiveMembers}`} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {resignedMembers > 0 && (
                            <Chip 
                              label={`İstifa: ${resignedMembers}`} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {expelledMembers > 0 && (
                            <Chip 
                              label={`İhraç: ${expelledMembers}`} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Stack>
                      </Box>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate('/members')}
                      sx={{ mt: 1, textTransform: 'none' }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Tüm Üyeleri Görüntüle
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Quick Info & Applications */}
        {canViewApplications && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), width: 40, height: 40 }}>
                    <PendingActionsIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                    Başvuru Yönetimi
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />
                {applicationsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <Stack spacing={2.5}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                          Bekleyen Başvurular
                        </Typography>
                        <Chip
                          label={pendingApplicationsCount}
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      {pendingApplicationsCount > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                          {pendingApplicationsCount} başvuru onay bekliyor
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate('/members/applications')}
                      sx={{ mt: 1, textTransform: 'none' }}
                      endIcon={<ArrowForwardIcon />}
                      color="warning"
                    >
                      Başvuruları İncele
                    </Button>
                    {canCreateMemberApplication && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/members/applications/new')}
                        sx={{ textTransform: 'none' }}
                        startIcon={<PersonAddAlt1Icon />}
                      >
                        Yeni Başvuru Oluştur
                      </Button>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* User Statistics */}
        {canListUsers && (
          <Grid item xs={12} md={canViewApplications ? 12 : 6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), width: 40, height: 40 }}>
                    <ManageAccountsIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                    Kullanıcı İstatistikleri
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />
                {usersLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <Stack spacing={2.5}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                          Toplam Kullanıcılar
                        </Typography>
                        <Chip
                          label={totalUsers}
                          color="info"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                          },
                        }} 
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                          Aktif Kullanıcılar
                        </Typography>
                        <Chip
                          label={activeUsers}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      {totalUsers > activeUsers && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                          {totalUsers - activeUsers} pasif kullanıcı
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate('/users')}
                      sx={{ mt: 1, textTransform: 'none' }}
                      endIcon={<ArrowForwardIcon />}
                      color="info"
                    >
                      Tüm Kullanıcıları Görüntüle
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DashboardPage;