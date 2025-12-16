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
} from '@mui/material';

import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import MapIcon from '@mui/icons-material/Map';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { useAuth } from '../../context/AuthContext';
import { getMemberApplications } from '../../api/membersApi';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { hasPermission } = useAuth();

  const canViewApplications = hasPermission('MEMBER_APPROVE') || hasPermission('MEMBER_REJECT');

  const canCreateMemberApplication = hasPermission('MEMBER_CREATE_APPLICATION');
  const canManageRegions = hasPermission('BRANCH_MANAGE') || hasPermission('REGION_LIST');
  const canListUsers = hasPermission('USER_LIST');

  const [pendingApplicationsCount, setPendingApplicationsCount] = useState<number>(0);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

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

  if (!canViewApplications) {
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

      {/* Pending Applications Card */}
      {canViewApplications && (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
                cursor: canViewApplications ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                '&:hover': canViewApplications ? {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${alpha('#fa709a', 0.3)}`,
                } : {},
              }}
              onClick={() => canViewApplications && navigate('/members/applications')}
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
        </Grid>
      )}

      {/* Quick Info Section */}
      {canViewApplications && (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mt: { xs: 2, sm: 3 } }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                  Hızlı Bilgiler
                </Typography>
                <Divider sx={{ mb: 3 }} />
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
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate('/members/applications')}
                      sx={{ mt: 0.5, textTransform: 'none', p: 0 }}
                    >
                      İncele →
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage;