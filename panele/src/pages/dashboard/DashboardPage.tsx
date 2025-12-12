// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
  Paper,
  Avatar,
  Stack,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  TableContainer,
} from '@mui/material';

import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MapIcon from '@mui/icons-material/Map';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BlockIcon from '@mui/icons-material/Block';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { useAuth } from '../../context/AuthContext';
import { getDuesSummary, getDebtsReport } from '../../api/duesApi';
import { getMemberApplications } from '../../api/membersApi';
import type { DuesSummary, DuesDebtItem } from '../../types/dues';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { hasPermission } = useAuth();

  const canViewSummary = hasPermission('DUES_REPORT_VIEW');
  const canViewDebts = hasPermission('DUES_DEBT_LIST_VIEW');
  const canViewApplications = hasPermission('MEMBER_APPROVE') || hasPermission('MEMBER_REJECT');

  const canCreateMemberApplication = hasPermission('MEMBER_CREATE_APPLICATION');
  const canAddDuesPayment = hasPermission('DUES_PAYMENT_ADD');
  const canManageRegions = hasPermission('BRANCH_MANAGE') || hasPermission('REGION_LIST');
  const canListUsers = hasPermission('USER_LIST');

  const [summary, setSummary] = useState<DuesSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [debts, setDebts] = useState<DuesDebtItem[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(false);

  const [pendingApplicationsCount, setPendingApplicationsCount] = useState<number>(0);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      if (!canViewSummary) return;
      setSummaryLoading(true);
      try {
        const data = await getDuesSummary();
        setSummary(data);
      } catch (e) {
        console.error('Dues summary alınırken hata:', e);
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [canViewSummary]);

  useEffect(() => {
    const loadDebts = async () => {
      if (!canViewDebts) return;
      setDebtsLoading(true);
      try {
        const data = await getDebtsReport();
        // Borç miktarına göre azalan sıralama (en borçlu en üstte)
        const sorted = Array.isArray(data) 
          ? [...data].sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0))
          : [];
        setDebts(sorted);
      } catch (e) {
        console.error('Dues debts alınırken hata:', e);
        setDebts([]);
      } finally {
        setDebtsLoading(false);
      }
    };

    loadDebts();
  }, [canViewDebts]);

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

  const paidRate = useMemo(() => {
    if (!summary || summary.totalMembers === 0) return 0;
    // Bu ay ödeme yapan üyeler / Toplam üye
    return summary.paidMembers / summary.totalMembers;
  }, [summary]);

  const monthlyChartData = useMemo(() => {
    if (!summary || !summary.byMonth) return [];
    // Backend'den gelen veri zaten sıralı olmalı, ama yine de sıralayalım
    const sorted = [...summary.byMonth].filter(m => m.year && m.month).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    // Son 5 ayı al (en yeni ay en sonda)
    return sorted.slice(-5);
  }, [summary]);

  // Bu ay ve önceki ay tahsilat karşılaştırması
  const monthlyComparison = useMemo(() => {
    if (!summary || !summary.byMonth || summary.byMonth.length < 2) return null;
    const sorted = [...summary.byMonth].filter(m => m.year && m.month).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    const currentMonth = sorted[sorted.length - 1];
    const previousMonth = sorted[sorted.length - 2];
    if (!currentMonth || !previousMonth) return null;
    
    const change = currentMonth.total - previousMonth.total;
    const changePercent = previousMonth.total > 0 
      ? ((change / previousMonth.total) * 100) 
      : (currentMonth.total > 0 ? 100 : 0);
    
    return {
      current: currentMonth.total,
      previous: previousMonth.total,
      change,
      changePercent,
      isPositive: change >= 0,
    };
  }, [summary]);

  // Toplam borç hesaplama
  const totalDebt = useMemo(() => {
    return debts.reduce((sum, d) => sum + (d.totalDebt || 0), 0);
  }, [debts]);

  // Ortalama aylık ödeme
  const averageMonthlyPayment = useMemo(() => {
    if (!summary || !summary.byMonth || summary.byMonth.length === 0) return 0;
    const validMonths = summary.byMonth.filter(m => m.total > 0);
    if (validMonths.length === 0) return 0;
    const total = validMonths.reduce((sum, m) => sum + m.total, 0);
    return total / validMonths.length;
  }, [summary]);

  if (!canViewSummary && !canViewDebts) {
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
      show: canAddDuesPayment,
      title: 'Aidat Ödemeleri',
      description: 'Üyeler için aidat ödemesi kaydedin ve ödeme geçmişini görüntüleyin',
      icon: ReceiptLongIcon,
      path: '/dues/payments',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      color: '#11998e',
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

      {/* İstatistik Kartları */}
      {canViewSummary && (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Toplam Tahsilat
                    </Typography>
                    {summaryLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {summary
                          ? `${summary.totalPayments.toLocaleString('tr-TR', {
                              maximumFractionDigits: 0,
                            })} ₺`
                          : '-'}
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
                    <TrendingUpIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Toplam Üye
                    </Typography>
                    {summaryLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {summary ? summary.totalMembers.toLocaleString('tr-TR') : '-'}
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
                    <PeopleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Bu Ay Ödeme Yapan
                    </Typography>
                    {summaryLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : summary ? (
                      <>
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                          {summary.paidMembers.toLocaleString('tr-TR')}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                          / {summary.totalMembers.toLocaleString('tr-TR')} üye
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        -
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
                    <CheckCircleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Ödeme Oranı
                    </Typography>
                    {summaryLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : summary && summary.totalMembers > 0 ? (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        %{(paidRate * 100).toFixed(1)}
                      </Typography>
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        -
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
                    <ReceiptLongIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
                {!summaryLoading && summary && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, paidRate * 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha('#fff', 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'white',
                        borderRadius: 3,
                      },
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Ek İstatistik Kartları - İkinci Satır */}
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

          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Bu Ay Tahsilat
                    </Typography>
                    {summaryLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : monthlyComparison ? (
                      <>
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                          {monthlyComparison.current.toLocaleString('tr-TR', {
                            maximumFractionDigits: 0,
                          })} ₺
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                          {monthlyComparison.isPositive ? (
                            <TrendingUpIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <TrendingDownIcon sx={{ fontSize: 16 }} />
                          )}
                          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            %{Math.abs(monthlyComparison.changePercent).toFixed(1)}
                          </Typography>
                        </Stack>
                      </>
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        -
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
                    <AttachMoneyIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                color: '#333',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Ortalama Aylık Ödeme
                    </Typography>
                    {summaryLoading ? (
                      <CircularProgress size={24} sx={{ color: 'primary.main' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {averageMonthlyPayment > 0
                          ? `${averageMonthlyPayment.toLocaleString('tr-TR', {
                              maximumFractionDigits: 0,
                            })} ₺`
                          : '-'}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      width: { xs: 44, sm: 48 }, 
                      height: { xs: 44, sm: 48 },
                    }}
                  >
                    <AssessmentIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: 'primary.main' }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                color: '#333',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
                cursor: canViewDebts ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                '&:hover': canViewDebts ? {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${alpha('#ff9a9e', 0.3)}`,
                } : {},
              }}
              onClick={() => canViewDebts && navigate('/dues/debts')}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Toplam Borç
                    </Typography>
                    {debtsLoading ? (
                      <CircularProgress size={24} sx={{ color: 'error.main' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {totalDebt > 0
                          ? `${totalDebt.toLocaleString('tr-TR', {
                              maximumFractionDigits: 0,
                            })} ₺`
                          : '-'}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      width: { xs: 44, sm: 48 }, 
                      height: { xs: 44, sm: 48 },
                    }}
                  >
                    <AccountBalanceIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: 'error.main' }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Üçüncü Satır: Bu Ay Gelen ve İptal Edilen Üyeler */}
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Bu Ay Gelen Üye
                    </Typography>
                    {summaryLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {summary ? summary.newMembersThisMonth.toLocaleString('tr-TR') : '-'}
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
                    <PersonAddIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                minHeight: { xs: 130, sm: 140 },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Bu Ay İptal Edilen
                    </Typography>
                    {summaryLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
                        {summary ? summary.cancelledMembersThisMonth.toLocaleString('tr-TR') : '-'}
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
                    <BlockIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Alt Bölüm: Grafik ve Borçlular */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {/* Aylık Tahsilat */}
        {canViewSummary && (
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                    Aylık Tahsilat Trendi (Son 5 Ay)
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/dues/monthly-report')}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Tüm Aylar
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                {summaryLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: { xs: 200, sm: 300 } }}>
                    <CircularProgress />
                  </Box>
                ) : monthlyChartData.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: { xs: 6, sm: 8 } }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      Gösterilecek aylık tahsilat verisi bulunamadı
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {monthlyChartData.map((m) => {
                      const label = `${m.month.toString().padStart(2, '0')}.${m.year}`;
                      const maxTotal = Math.max(...monthlyChartData.map((x) => x.total));
                      const ratio = maxTotal > 0 ? Math.round((m.total / maxTotal) * 100) : 0;

                      return (
                        <Box key={label} sx={{ mb: { xs: 2, sm: 2.5 } }}>
                          <Stack 
                            direction={{ xs: 'column', sm: 'row' }} 
                            justifyContent="space-between" 
                            alignItems={{ xs: 'flex-start', sm: 'center' }} 
                            sx={{ mb: 1, gap: { xs: 0.5, sm: 0 } }}
                          >
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                              {label}
                            </Typography>
                            <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
                              <Chip
                                label={`${m.count} ödeme`}
                                size="small"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              />
                              <Typography variant="body2" fontWeight={600} color="primary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                                {m.total.toLocaleString('tr-TR', {
                                  maximumFractionDigits: 0,
                                })}{' '}
                                ₺
                              </Typography>
                            </Stack>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={ratio}
                            sx={{
                              height: { xs: 8, sm: 10 },
                              borderRadius: 5,
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* En Borçlu Üyeler */}
        {canViewDebts && (
          <Grid item xs={12} lg={canViewSummary ? 4 : 12}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                  En Borçlu Üyeler
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {debtsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: { xs: 200, sm: 300 } }}>
                    <CircularProgress />
                  </Box>
                ) : debts.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: { xs: 6, sm: 8 } }}>
                    <CheckCircleIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'success.main', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      Borçlu üye kaydı bulunamadı
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ 
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': {
                      height: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      borderRadius: '3px',
                    },
                  }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Üye</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Son Ödeme</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Geciken</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Borç</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {debts.slice(0, 5).map((d) => (
                          <TableRow
                            key={d.memberId}
                            sx={{
                              '&:hover': {
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                {d.member?.firstName && d.member?.lastName
                                  ? `${d.member.firstName} ${d.member.lastName}`
                                  : d.memberId || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                {d.lastPaymentDate
                                  ? new Date(d.lastPaymentDate).toLocaleDateString('tr-TR')
                                  : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={`${d.monthsOverdue ?? 0} ay`}
                                color={
                                  (d.monthsOverdue ?? 0) >= 6
                                    ? 'error'
                                    : (d.monthsOverdue ?? 0) >= 3
                                    ? 'warning'
                                    : 'default'
                                }
                                sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color="error.main" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                {d.totalDebt != null
                                  ? `${d.totalDebt.toLocaleString('tr-TR', {
                                      maximumFractionDigits: 0,
                                    })} ₺`
                                  : '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Üye Durumu Dağılımı ve Hızlı Bilgiler */}
      {canViewSummary && (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mt: { xs: 2, sm: 3 } }}>
          {/* Üye Durumu Özeti */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                  Üye Durumu Özeti
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {summaryLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <CircularProgress />
                  </Box>
                ) : summary ? (
                  <Box>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                            }}
                          />
                          <Typography variant="body2" fontWeight={500}>
                            Ödeme Yapan Üyeler
                          </Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          {summary.paidMembers}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: 'warning.main',
                            }}
                          />
                          <Typography variant="body2" fontWeight={500}>
                            Ödeme Yapmayan Üyeler
                          </Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight={700} color="warning.main">
                          {summary.unpaidMembers}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight={600}>
                          Toplam
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {summary.totalMembers}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={paidRate * 100}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 5,
                              background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`,
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                          Ödeme Oranı: %{(paidRate * 100).toFixed(1)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Veri bulunamadı
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Hızlı Bilgiler */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                  Hızlı Bilgiler
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Stack spacing={2.5}>
                  {monthlyComparison && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                          Aylık Değişim
                        </Typography>
                        <Chip
                          icon={monthlyComparison.isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
                          label={`%${Math.abs(monthlyComparison.changePercent).toFixed(1)}`}
                          color={monthlyComparison.isPositive ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Önceki aya göre {monthlyComparison.isPositive ? 'artış' : 'azalış'}
                      </Typography>
                    </Box>
                  )}
                  
                  {canViewApplications && (
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
                  )}

                  {canViewDebts && totalDebt > 0 && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                          Toplam Borç
                        </Typography>
                        <Chip
                          label={`${totalDebt.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`}
                          color="error"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('/dues/debts')}
                        sx={{ mt: 0.5, textTransform: 'none', p: 0 }}
                      >
                        Detaylar →
                      </Button>
                    </Box>
                  )}

                  {summary && averageMonthlyPayment > 0 && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                          Ortalama Aylık Ödeme
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {averageMonthlyPayment.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                        </Typography>
                      </Stack>
                    </Box>
                  )}
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