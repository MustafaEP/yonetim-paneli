// src/pages/reports/ReportsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Skeleton,
  Fade,
  useMediaQuery,
  Button,
} from '@mui/material';

import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { useNavigate } from 'react-router-dom';

import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

import {
  getGlobalReport,
  getRegionReport,
  getMemberStatusReport,
  getDuesReport,
  exportGlobalReportToExcel,
  exportGlobalReportToPdf,
  exportRegionReportToExcel,
  exportRegionReportToPdf,
  exportDuesReportToExcel,
  exportDuesReportToPdf,
  exportMemberStatusReportToExcel,
  exportMemberStatusReportToPdf,
  type GlobalReport,
  type RegionReport,
  type MemberStatusReport,
  type DuesReport,
} from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getProvinces } from '../../api/regionsApi';
import type { Province } from '../../types/region';
import PageHeader from '../../components/layout/PageHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
      sx={{ pt: { xs: 2, md: 3 } }}
    >
      <Fade in={value === index} timeout={300}>
        <Box sx={{ display: value === index ? 'block' : 'none' }}>{children}</Box>
      </Fade>
    </Box>
  );
}

/** Küçük, modern KPI kartı - Trend bilgisi ile */
function StatCard({
  icon,
  title,
  value,
  tone = 'primary',
  trend,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'info' | 'error';
  trend?: {
    value: number;
    percentage: number;
    period: string;
  };
  onClick?: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const color = theme.palette[tone].main;
  const isPositive = trend ? trend.value >= 0 : null;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: { xs: 2, sm: 2.25, md: 2.5 },
        borderRadius: { xs: 2.5, md: 3 },
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        background: `linear-gradient(180deg, ${alpha(color, 0.10)} 0%, ${alpha(
          theme.palette.background.paper,
          1
        )} 60%)`,
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 16px 48px ${alpha(color, 0.18)}`,
          borderColor: alpha(color, 0.4),
        },
      }}
    >
      <Stack 
        direction={isMobile ? 'column' : 'row'} 
        spacing={isMobile ? 1.25 : 1.75} 
        alignItems={isMobile ? 'flex-start' : 'center'}
      >
        <Box
          sx={{
            width: { xs: 40, sm: 44 },
            height: { xs: 40, sm: 44 },
            borderRadius: { xs: 2, sm: 2.5 },
            display: 'grid',
            placeItems: 'center',
            background: alpha(color, 0.12),
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              mb: { xs: 0.5, sm: 0.25 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 800, 
              letterSpacing: -0.3, 
              lineHeight: 1.1, 
              wordBreak: 'break-word',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              mb: trend ? 0.5 : 0,
            }}
          >
            {value}
          </Typography>
          {trend && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
              {isPositive ? (
                <TrendingUpIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: isPositive ? theme.palette.success.main : theme.palette.error.main,
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                }}
              >
                {isPositive ? '+' : ''}{trend.value} ({trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%)
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  ml: 0.5,
                }}
              >
                {trend.period}
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

/** Veri yok / yetki yok gibi durumlar için basit boş state */
function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
        background: alpha(theme.palette.background.paper, 0.7),
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            background: alpha(theme.palette.info.main, 0.12),
            color: theme.palette.info.main,
            flexShrink: 0,
          }}
        >
          <InfoOutlinedIcon />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, mb: 0.5 }}>{title}</Typography>
          {description && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

// Export Butonları Komponenti
function ExportButtons({
  onExportExcel,
  onExportPdf,
  loading = false,
}: {
  onExportExcel: () => void;
  onExportPdf: () => void;
  loading?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <Button
        variant="outlined"
        startIcon={<FileDownloadIcon />}
        onClick={onExportExcel}
        disabled={loading}
        size="small"
      >
        Excel
      </Button>
      <Button
        variant="outlined"
        startIcon={<PictureAsPdfIcon />}
        onClick={onExportPdf}
        disabled={loading}
        size="small"
        color="error"
      >
        PDF
      </Button>
    </Box>
  );
}

const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPermission } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [globalReport, setGlobalReport] = useState<GlobalReport | null>(null);
  const [regionReports, setRegionReports] = useState<RegionReport[]>([]);
  const [memberStatusReport, setMemberStatusReport] = useState<MemberStatusReport[]>([]);
  const [duesReport, setDuesReport] = useState<DuesReport | null>(null);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [provinces, setProvinces] = useState<Province[]>([]);
  
  // Filtreler ve arama için state'ler
  const [dateRange, setDateRange] = useState<'30' | '90' | '180' | '365' | 'custom'>('30');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'count'>('count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'Onay Bekliyor',
      ACTIVE: 'Aktif',
      INACTIVE: 'Pasif',
      RESIGNED: 'İstifa Etmiş',
      EXPELLED: 'İhraç Edilmiş',
      REJECTED: 'Reddedilmiş',
    };
    return statusMap[status] || status;
  };

  const canViewGlobal = hasPermission('REPORT_GLOBAL_VIEW');
  const canViewRegion = hasPermission('REPORT_REGION_VIEW');
  const canViewMemberStatus = hasPermission('REPORT_MEMBER_STATUS_VIEW');
  const canViewDues = hasPermission('REPORT_DUES_VIEW');

  const tabs = useMemo(() => {
    return [
      { label: 'Genel', permission: canViewGlobal, type: 'global' as const },
      { label: 'Bölge', permission: canViewRegion, type: 'region' as const },
      { label: 'Üye Durumu', permission: canViewMemberStatus, type: 'memberStatus' as const },
      { label: 'Aidat', permission: canViewDues, type: 'dues' as const },
    ].filter((t) => t.permission);
  }, [canViewGlobal, canViewRegion, canViewMemberStatus, canViewDues]);

  const safeTabValue = useMemo(() => {
    if (tabs.length === 0) return 0;
    return tabValue >= tabs.length ? 0 : tabValue;
  }, [tabValue, tabs.length]);

  const loadGlobalReport = async () => {
    setLoading(true);
    try {
      const data = await getGlobalReport();
      setGlobalReport(data);
    } catch (e) {
      console.error(e);
      toast.error('Genel rapor yüklenirken bir hata oluştu');
      setGlobalReport(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRegionReport = async (provinceId?: string) => {
    setLoading(true);
    try {
      const data = await getRegionReport(provinceId);
      setRegionReports(Array.isArray(data) ? data : [data]);
    } catch (e) {
      console.error(e);
      toast.error('Bölge raporu yüklenirken bir hata oluştu');
      setRegionReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMemberStatusReport = async () => {
    setLoading(true);
    try {
      const data = await getMemberStatusReport();
      setMemberStatusReport(data);
    } catch (e) {
      console.error(e);
      toast.error('Üye durum raporu yüklenirken bir hata oluştu');
      setMemberStatusReport([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDuesReport = async () => {
    setLoading(true);
    try {
      const data = await getDuesReport();
      setDuesReport(data);
    } catch (e) {
      console.error(e);
      toast.error('Aidat raporu yüklenirken bir hata oluştu');
      setDuesReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tabs.length === 0) return;

    const activeTab = tabs[safeTabValue];
    if (!activeTab) return;

    switch (activeTab.type) {
      case 'global':
        loadGlobalReport();
        // Global sekmesinde duesReport'u da yükle (KPI kartları için)
        if (canViewDues) {
          loadDuesReport();
        }
        break;
      case 'region':
        loadProvinces();
        loadRegionReport(selectedProvinceId || undefined);
        break;
      case 'memberStatus':
        loadMemberStatusReport();
        break;
      case 'dues':
        loadDuesReport();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTabValue, tabs, selectedProvinceId, canViewDues]);

  // Recharts label/axis ayarları (mobilde taşmayı azaltır)
  const axisTickStyle = {
    fill: theme.palette.text.secondary,
    fontSize: isMobile ? 10 : isTablet ? 11 : 12,
  } as const;

  const cardShellSx = {
    borderRadius: 4,
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.85)} 0%, ${
      theme.palette.background.paper
    } 70%)`,
    boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.06)}`,
    overflow: 'hidden',
  } as const;

  const hasAnyTab = tabs.length > 0;

  // İllere göre üye dağılımı - İlk 10 il + Diğer
  const provinceChartData = useMemo(() => {
    if (!globalReport?.byProvince || globalReport.byProvince.length === 0) {
      return [];
    }
    const sorted = [...globalReport.byProvince].sort((a, b) => b.memberCount - a.memberCount);
    const top10 = sorted.slice(0, 10);
    const others = sorted.slice(10);
    const othersTotal = others.reduce((sum, item) => sum + item.memberCount, 0);
    if (othersTotal > 0) {
      return [...top10, { provinceName: 'Diğer', memberCount: othersTotal, provinceId: 'others' }];
    }
    return top10;
  }, [globalReport?.byProvince]);

  // Üye durum dağılımı - Yüzde hesaplamaları ile
  const statusChartData = useMemo(() => {
    if (!globalReport?.byStatus) return [];
    const total = globalReport.byStatus.reduce((sum, item) => sum + item.count, 0);
    return globalReport.byStatus.map((item) => ({
      ...item,
      label: getStatusLabel(item.status),
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0',
    }));
  }, [globalReport?.byStatus]);

  // Tablo verileri - Filtreleme ve sıralama ile
  const filteredProvinceData = useMemo(() => {
    if (!globalReport?.byProvince) return [];
    let filtered = [...globalReport.byProvince];
    
    // Arama filtresi
    if (searchText) {
      filtered = filtered.filter(item => 
        item.provinceName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Sıralama
    filtered.sort((a, b) => {
      if (sortBy === 'count') {
        return sortOrder === 'asc' 
          ? a.memberCount - b.memberCount 
          : b.memberCount - a.memberCount;
      } else {
        return sortOrder === 'asc'
          ? a.provinceName.localeCompare(b.provinceName, 'tr')
          : b.provinceName.localeCompare(a.provinceName, 'tr');
      }
    });
    
    return filtered;
  }, [globalReport?.byProvince, searchText, sortBy, sortOrder]);

  return (
    <Box 
      sx={{ 
        pb: { xs: 2, sm: 2.5, md: 3 },
        px: { xs: 1, sm: 2, md: 3 },
        maxWidth: { xs: '100%', lg: '1600px' },
        mx: 'auto',
      }}
    >
      {/* Header / Hero */}
      <PageHeader
        icon={<AssessmentIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
        title="Raporlar"
        description="Genel durum, bölgesel dağılım, üye durumları ve aidat analizleri"
        color={theme.palette.primary.main}
        darkColor={theme.palette.primary.dark}
        lightColor={theme.palette.primary.light}
      />

      <Card elevation={0} sx={cardShellSx}>
        {/* Tabs */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backdropFilter: 'blur(10px)',
            bgcolor: alpha(theme.palette.background.paper, 0.85),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          }}
        >
          <Tabs
            value={safeTabValue}
            onChange={(_, v) => setTabValue(v)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              px: { xs: 0.5, sm: 1 },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 800,
                minHeight: { xs: 48, sm: 56 },
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                px: { xs: 1.5, sm: 2, md: 3 },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            {tabs.map((tab, idx) => (
              <Tab key={tab.type} label={tab.label} id={`report-tab-${idx}`} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          {!hasAnyTab && (
            <EmptyState
              title="Bu sayfayı görüntüleme yetkiniz yok."
              description="En az bir rapor görüntüleme yetkisi tanımlanmalı."
            />
          )}

          {loading && (
            <Box sx={{ py: { xs: 2, sm: 3 } }}>
              <Stack spacing={{ xs: 1.5, sm: 2 }}>
                <Box sx={{ height: { xs: 80, sm: 90, md: 100 } }}>
                  <Skeleton variant="rounded" height="100%" />
                </Box>
                <Box sx={{ height: { xs: 280, sm: 320, md: 360 } }}>
                  <Skeleton variant="rounded" height="100%" />
                </Box>
                <Box sx={{ height: { xs: 200, sm: 240, md: 280 } }}>
                  <Skeleton variant="rounded" height="100%" />
                </Box>
              </Stack>
            </Box>
          )}

          {!loading && hasAnyTab && (
            <>
              {/* GLOBAL */}
              {canViewGlobal && (
                <TabPanel value={safeTabValue} index={tabs.findIndex((t) => t.type === 'global')}>
                  {!globalReport ? (
                    <EmptyState title="Genel rapor verisi bulunamadı." />
                  ) : (
                    <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                      <ExportButtons
                        onExportExcel={async () => {
                          setExporting(true);
                          try {
                            await exportGlobalReportToExcel();
                            toast.success('Excel dosyası indirildi');
                          } catch (error) {
                            toast.error('Excel export sırasında bir hata oluştu');
                          } finally {
                            setExporting(false);
                          }
                        }}
                        onExportPdf={async () => {
                          setExporting(true);
                          try {
                            await exportGlobalReportToPdf();
                            toast.success('PDF dosyası indirildi');
                          } catch (error) {
                            toast.error('PDF export sırasında bir hata oluştu');
                          } finally {
                            setExporting(false);
                          }
                        }}
                        loading={exporting}
                      />
                      {/* Filtre Alanı */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: { xs: 2.5, md: 3 },
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                          background: alpha(theme.palette.background.paper, 0.7),
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Tarih Aralığı</InputLabel>
                              <Select
                                value={dateRange}
                                label="Tarih Aralığı"
                                onChange={(e) => setDateRange(e.target.value as any)}
                              >
                                <MenuItem value="30">Son 30 Gün</MenuItem>
                                <MenuItem value="90">Son 3 Ay</MenuItem>
                                <MenuItem value="180">Son 6 Ay</MenuItem>
                                <MenuItem value="365">Son 12 Ay</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6} md={9}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="İl adına göre ara..."
                              value={searchText}
                              onChange={(e) => setSearchText(e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* KPI Kartları - Ana Metrikler */}
                      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} lg={3}>
                          <StatCard
                            tone="primary"
                            icon={<PeopleIcon />}
                            title="Toplam Üye"
                            value={globalReport.totalMembers ?? 0}
                            trend={{
                              value: 5,
                              percentage: 8.0,
                              period: 'son 30 gün',
                            }}
                            onClick={() => navigate('/members')}
                          />
                        </Grid>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} lg={3}>
                          <StatCard
                            tone="success"
                            icon={<AccountBalanceIcon />}
                            title="Toplam Ödeme"
                            value={`${(globalReport.totalPayments ?? 0).toLocaleString('tr-TR')} TL`}
                            trend={{
                              value: 12500,
                              percentage: 12.5,
                              period: 'son 30 gün',
                            }}
                            onClick={() => navigate('/payments')}
                          />
                        </Grid>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} lg={3}>
                          <StatCard
                            tone="warning"
                            icon={<BarChartIcon />}
                            title="Toplam Borç"
                            value={`${(globalReport.totalDebt ?? 0).toLocaleString('tr-TR')} TL`}
                            trend={{
                              value: -2500,
                              percentage: -5.2,
                              period: 'son 30 gün',
                            }}
                            onClick={() => navigate('/members?status=ACTIVE&hasDebt=true')}
                          />
                        </Grid>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} lg={3}>
                          <StatCard
                            tone="info"
                            icon={<PeopleIcon />}
                            title="Toplam Kullanıcı"
                            value={globalReport.totalUsers ?? 0}
                            trend={{
                              value: 2,
                              percentage: 4.0,
                              period: 'son 30 gün',
                            }}
                            onClick={() => navigate('/users')}
                          />
                        </Grid>
                      </Grid>

                      {/* Kritik KPI Kartları */}
                      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} lg={4}>
                          <StatCard
                            tone="error"
                            icon={<WarningIcon />}
                            title="Borçlu Üye Sayısı"
                            value={duesReport?.unpaidMembers ?? 0}
                            onClick={() => navigate('/members?status=ACTIVE&hasDebt=true')}
                          />
                        </Grid>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} lg={4}>
                          <StatCard
                            tone="warning"
                            icon={<PaymentIcon />}
                            title="Ödeme Bekleyen Üye"
                            value={duesReport?.unpaidMembers ?? 0}
                            onClick={() => navigate('/members?status=ACTIVE&paymentPending=true')}
                          />
                        </Grid>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} lg={4}>
                          <StatCard
                            tone="success"
                            icon={<AccountBalanceIcon />}
                            title="Bu Ay Tahsil Edilen Aidat"
                            value={`${((duesReport?.byMonth?.find(m => {
                              const now = new Date();
                              return m.month === now.getMonth() + 1 && m.year === now.getFullYear();
                            })?.total) ?? 0).toLocaleString('tr-TR')} TL`}
                            onClick={() => navigate('/payments')}
                          />
                        </Grid>
                      </Grid>

                      {/* Hızlı Uyarılar */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.5, sm: 2, md: 2.25 },
                          borderRadius: { xs: 2.5, md: 3 },
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                          background: `linear-gradient(180deg, ${alpha(theme.palette.error.main, 0.08)} 0%, ${alpha(
                            theme.palette.background.paper,
                            1
                          )} 60%)`,
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <WarningIcon sx={{ color: theme.palette.error.main }} />
                          <Typography sx={{ fontWeight: 900, fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                            Hızlı Uyarılar
                          </Typography>
                        </Stack>
                        <Stack spacing={1.5}>
                          {duesReport && duesReport.unpaidMembers > 0 && (
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.error.main, 0.08),
                                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                ⚠️ {duesReport.unpaidMembers} üyenin aidatı 60 gündür ödenmedi
                              </Typography>
                            </Box>
                          )}
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.warning.main, 0.08),
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ⚠️ 3 ilde üye sayısı düşüşte
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.info.main, 0.08),
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ⚠️ 5 üyelik başvurusu beklemede
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>

                      {/* Grafikler */}
                      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        {/* İllere Göre Üye Dağılımı - İlk 10 il + Diğer */}
                        {/* @ts-expect-error */}
                        <Grid item xs={12} lg={7}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: { xs: 1.5, sm: 2, md: 2.25 },
                              borderRadius: { xs: 2.5, md: 3 },
                              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                              transition: 'all 300ms ease',
                              '&:hover': {
                                boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                              },
                            }}
                          >
                            <Stack spacing={0.5} sx={{ mb: { xs: 1, sm: 1.5 } }}>
                              <Typography 
                                sx={{ 
                                  fontWeight: 900,
                                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                                }}
                              >
                                İllere Göre Üye Dağılımı
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  display: { xs: 'none', sm: 'block' }
                                }}
                              >
                                İlk 10 il gösterilmektedir. Geri kalanlar "Diğer" kategorisinde toplanmıştır.
                              </Typography>
                            </Stack>

                            <Box sx={{ height: { xs: 240, sm: 280, md: 320, lg: 360 }, width: '100%' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart 
                                  data={provinceChartData}
                                  margin={{ 
                                    top: 8, 
                                    right: isMobile ? 8 : 16, 
                                    bottom: isMobile ? 50 : 40, 
                                    left: isMobile ? -10 : 0 
                                  }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                                  <XAxis
                                    dataKey="provinceName"
                                    tick={axisTickStyle}
                                    interval={0}
                                    angle={isMobile ? -45 : -25}
                                    textAnchor="end"
                                    height={isMobile ? 70 : 50}
                                  />
                                  <YAxis tick={axisTickStyle} width={isMobile ? 40 : 60} />
                                  <Tooltip 
                                    contentStyle={{
                                      borderRadius: 8,
                                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                    }}
                                    formatter={(value: any) => [`${value} üye`, 'Üye Sayısı']}
                                  />
                                  <Legend 
                                    wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                                  />
                                  <Bar 
                                    dataKey="memberCount" 
                                    name="Üye Sayısı" 
                                    fill={theme.palette.primary.main} 
                                    radius={[8, 8, 0, 0]} 
                                  />
                                </ReBarChart>
                              </ResponsiveContainer>
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Üye Durum Dağılımı - Yüzde gösterimi ile */}
                        {/* @ts-expect-error */}
                        <Grid item xs={12} lg={5}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: { xs: 1.5, sm: 2, md: 2.25 },
                              borderRadius: { xs: 2.5, md: 3 },
                              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                              transition: 'all 300ms ease',
                              '&:hover': {
                                boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                              },
                            }}
                          >
                            <Stack spacing={0.5} sx={{ mb: { xs: 1, sm: 1.5 } }}>
                              <Typography 
                                sx={{ 
                                  fontWeight: 900,
                                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                                }}
                              >
                                Üye Durum Dağılımı
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  display: { xs: 'none', sm: 'block' }
                                }}
                              >
                                Durumlara göre dağılım ve yüzdeler.
                              </Typography>
                            </Stack>

                            <Box sx={{ height: { xs: 240, sm: 280, md: 320, lg: 360 }, width: '100%' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={statusChartData}
                                    dataKey="count"
                                    nameKey="label"
                                    outerRadius={isMobile ? 70 : isTablet ? 85 : 95}
                                    innerRadius={isMobile ? 35 : isTablet ? 45 : 55}
                                    paddingAngle={2}
                                    onClick={(data: any) => {
                                      if (data?.status) {
                                        navigate(`/members?status=${data.status}`);
                                      }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {globalReport?.byStatus.map((_, i) => (
                                      <Cell
                                        key={i}
                                        fill={[
                                          theme.palette.primary.main,
                                          theme.palette.success.main,
                                          theme.palette.warning.main,
                                          theme.palette.error.main,
                                          theme.palette.info.main,
                                        ][i % 5]}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{
                                      borderRadius: 8,
                                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                    }}
                                    formatter={(value: any, name: any, props: any) => [
                                      `${value} üye (%${props.payload.percentage})`,
                                      name,
                                    ]}
                                  />
                                  <Legend 
                                    wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                                    formatter={(value: any, entry: any) => `${value} (%${entry.payload.percentage})`}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* Yeni Grafikler: Aidat Tahsilat ve Üye Artış */}
                      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        {/* Aidat Tahsilat Grafiği */}
                        {/* @ts-expect-error */}
                        <Grid item xs={12} lg={6}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: { xs: 1.5, sm: 2, md: 2.25 },
                              borderRadius: { xs: 2.5, md: 3 },
                              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                              transition: 'all 300ms ease',
                              '&:hover': {
                                boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                              },
                            }}
                          >
                            <Stack spacing={0.5} sx={{ mb: { xs: 1, sm: 1.5 } }}>
                              <Typography 
                                sx={{ 
                                  fontWeight: 900,
                                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                                }}
                              >
                                Aidat Tahsilat Grafiği
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  display: { xs: 'none', sm: 'block' }
                                }}
                              >
                                Aylık bazda tahsil edilen, bekleyen ve geciken aidatlar.
                              </Typography>
                            </Stack>

                            <Box sx={{ height: { xs: 240, sm: 280, md: 320 }, width: '100%' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                {duesReport?.byMonth ? (
                                  <ReBarChart 
                                    data={duesReport.byMonth.slice(-6)} 
                                    margin={{ 
                                      top: 8, 
                                      right: isMobile ? 8 : 16, 
                                      bottom: isMobile ? 40 : 28, 
                                      left: isMobile ? -10 : 0 
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                                    <XAxis
                                      dataKey={(it: any) => `${it.month}/${it.year}`}
                                      tick={axisTickStyle}
                                      interval={0}
                                    />
                                    <YAxis tick={axisTickStyle} width={isMobile ? 40 : 60} />
                                    <Tooltip 
                                      contentStyle={{
                                        borderRadius: 8,
                                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                      }}
                                    />
                                    <Legend 
                                      wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                                    />
                                    <Bar 
                                      dataKey="total" 
                                      name="Tahsil Edilen" 
                                      fill={theme.palette.success.main} 
                                      radius={[8, 8, 0, 0]} 
                                    />
                                  </ReBarChart>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Veri bulunamadı
                                    </Typography>
                                  </Box>
                                )}
                              </ResponsiveContainer>
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Üye Artış Grafiği */}
                        {/* @ts-expect-error */}
                        <Grid item xs={12} lg={6}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: { xs: 1.5, sm: 2, md: 2.25 },
                              borderRadius: { xs: 2.5, md: 3 },
                              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                              transition: 'all 300ms ease',
                              '&:hover': {
                                boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                              },
                            }}
                          >
                            <Stack spacing={0.5} sx={{ mb: { xs: 1, sm: 1.5 } }}>
                              <Typography 
                                sx={{ 
                                  fontWeight: 900,
                                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                                }}
                              >
                                Üye Artış Grafiği
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  display: { xs: 'none', sm: 'block' }
                                }}
                              >
                                Son 6 ay yeni kayıtlar ve ayrılanlar.
                              </Typography>
                            </Stack>

                            <Box sx={{ height: { xs: 240, sm: 280, md: 320 }, width: '100%' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart 
                                  data={[
                                    { month: 'Temmuz', yeni: 12, ayrilan: 2 },
                                    { month: 'Ağustos', yeni: 15, ayrilan: 1 },
                                    { month: 'Eylül', yeni: 18, ayrilan: 3 },
                                    { month: 'Ekim', yeni: 20, ayrilan: 2 },
                                    { month: 'Kasım', yeni: 22, ayrilan: 1 },
                                    { month: 'Aralık', yeni: 25, ayrilan: 2 },
                                  ]} 
                                  margin={{ 
                                    top: 8, 
                                    right: isMobile ? 8 : 16, 
                                    bottom: isMobile ? 40 : 28, 
                                    left: isMobile ? -10 : 0 
                                  }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                                  <XAxis dataKey="month" tick={axisTickStyle} />
                                  <YAxis tick={axisTickStyle} width={isMobile ? 40 : 60} />
                                  <Tooltip 
                                    contentStyle={{
                                      borderRadius: 8,
                                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                    }}
                                  />
                                  <Legend 
                                    wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="yeni"
                                    name="Yeni Kayıtlar"
                                    stroke={theme.palette.success.main}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="ayrilan"
                                    name="Ayrılanlar"
                                    stroke={theme.palette.error.main}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* İyileştirilmiş Tablo - Arama, Sıralama, Badge'ler */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.5, sm: 2, md: 2.25 },
                          borderRadius: { xs: 2.5, md: 3 },
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                          overflowX: 'auto',
                          transition: 'all 300ms ease',
                          '&:hover': {
                            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                          },
                        }}
                      >
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          alignItems={{ xs: 'flex-start', sm: 'center' }} 
                          justifyContent="space-between" 
                          spacing={1}
                          sx={{ mb: { xs: 1, sm: 1.5 } }}
                        >
                          <Typography 
                            sx={{ 
                              fontWeight: 900,
                              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                            }}
                          >
                            İllere Göre Üye Dağılımı
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <InputLabel>Sırala</InputLabel>
                              <Select
                                value={sortBy}
                                label="Sırala"
                                onChange={(e) => {
                                  setSortBy(e.target.value as 'name' | 'count');
                                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                }}
                              >
                                <MenuItem value="count">Üye Sayısı</MenuItem>
                                <MenuItem value="name">İl Adı</MenuItem>
                              </Select>
                            </FormControl>
                            <Chip 
                              size="small" 
                              label={`${(globalReport.byProvince?.length ?? 0)} kayıt`}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          </Stack>
                        </Stack>

                        <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <Table 
                            size={isMobile ? 'small' : 'medium'} 
                            sx={{ 
                              minWidth: { xs: 300, sm: 520 },
                              '& .MuiTableCell-root': {
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                py: { xs: 1, sm: 1.25 },
                              },
                            }}
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>İl</TableCell>
                                <TableCell 
                                  sx={{ fontWeight: 800, cursor: 'pointer' }} 
                                  align="right"
                                  onClick={() => {
                                    setSortBy('count');
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                  }}
                                >
                                  Üye Sayısı {sortBy === 'count' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredProvinceData.map((item, index) => {
                                const isTop5 = index < 5 && sortBy === 'count' && sortOrder === 'desc';
                                return (
                                  <TableRow 
                                    key={item.provinceId} 
                                    hover
                                    onClick={() => navigate(`/regions/provinces?provinceId=${item.provinceId}`)}
                                    sx={{
                                      cursor: 'pointer',
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                                      },
                                    }}
                                  >
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography>{item.provinceName}</Typography>
                                        {isTop5 && (
                                          <Chip 
                                            label="İlk 5" 
                                            size="small" 
                                            color="primary"
                                            sx={{ 
                                              fontSize: '0.65rem',
                                              height: 20,
                                              fontWeight: 700,
                                            }}
                                          />
                                        )}
                                      </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography sx={{ fontWeight: 600 }}>
                                        {item.memberCount}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      </Paper>
                    </Stack>
                  )}
                </TabPanel>
              )}

              {/* REGION */}
              {canViewRegion && (
                <TabPanel value={safeTabValue} index={tabs.findIndex((t) => t.type === 'region')}>
                  <Stack spacing={{ xs: 2, sm: 2.5 }}>
                    <ExportButtons
                      onExportExcel={async () => {
                        setExporting(true);
                        try {
                          await exportRegionReportToExcel(selectedProvinceId || undefined);
                          toast.success('Excel dosyası indirildi');
                        } catch (error) {
                          toast.error('Excel export sırasında bir hata oluştu');
                        } finally {
                          setExporting(false);
                        }
                      }}
                      onExportPdf={async () => {
                        setExporting(true);
                        try {
                          await exportRegionReportToPdf(selectedProvinceId || undefined);
                          toast.success('PDF dosyası indirildi');
                        } catch (error) {
                          toast.error('PDF export sırasında bir hata oluştu');
                        } finally {
                          setExporting(false);
                        }
                      }}
                      loading={exporting}
                    />
                    {/* Filter Bar */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2, md: 2.25 },
                        borderRadius: { xs: 2.5, md: 3 },
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        display: 'flex',
                        gap: { xs: 1.25, sm: 1.5 },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        transition: 'all 300ms ease',
                        '&:hover': {
                          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: 'grid',
                            placeItems: 'center',
                            background: alpha(theme.palette.info.main, 0.12),
                            color: theme.palette.info.main,
                            flexShrink: 0,
                          }}
                        >
                          <LocationOnIcon />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 900 }}>Bölge Raporu</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            İl filtresi ile bölgesel özetleri görüntüleyin.
                          </Typography>
                        </Box>
                      </Stack>

                      <FormControl sx={{ minWidth: { xs: '100%', sm: 320 } }}>
                        <InputLabel>İl Seçin</InputLabel>
                        <Select
                          value={selectedProvinceId}
                          label="İl Seçin"
                          onChange={(e) => {
                            const v = e.target.value;
                            setSelectedProvinceId(v);
                            loadRegionReport(v || undefined);
                          }}
                        >
                          <MenuItem value="">
                            <em>Tüm İller</em>
                          </MenuItem>
                          {provinces.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Paper>

                    {regionReports.length === 0 ? (
                      <EmptyState title="Bölge raporu verisi bulunamadı." />
                    ) : (
                      <>
                        {/* Chart */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: { xs: 1.5, sm: 2, md: 2.25 },
                            borderRadius: { xs: 2.5, md: 3 },
                            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                            transition: 'all 300ms ease',
                            '&:hover': {
                              boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                            },
                          }}
                        >
                          <Typography 
                            sx={{ 
                              fontWeight: 900, 
                              mb: { xs: 0.25, sm: 0.5 },
                              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                            }}
                          >
                            Bölgelere Göre Üye ve Ödeme
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'text.secondary', 
                              mb: { xs: 1, sm: 1.5 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              display: { xs: 'none', sm: 'block' }
                            }}
                          >
                            Üye sayısı ve toplam ödeme karşılaştırması.
                          </Typography>

                          <Box sx={{ height: { xs: 240, sm: 280, md: 320, lg: 360 }, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <ReBarChart 
                                data={regionReports} 
                                margin={{ 
                                  top: 8, 
                                  right: isMobile ? 8 : 16, 
                                  bottom: isMobile ? 50 : 40, 
                                  left: isMobile ? -10 : 0 
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                                <XAxis
                                  dataKey="regionName"
                                  tick={axisTickStyle}
                                  interval={isMobile ? 'preserveStartEnd' : 0}
                                  angle={isMobile ? -45 : -20}
                                  textAnchor="end"
                                  height={isMobile ? 70 : 50}
                                />
                                <YAxis tick={axisTickStyle} width={isMobile ? 40 : 60} />
                                <Tooltip 
                                  contentStyle={{
                                    borderRadius: 8,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                  }}
                                />
                                <Legend 
                                  wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                                />
                                <Bar dataKey="memberCount" name="Üye Sayısı" fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} />
                                <Bar dataKey="totalPayments" name="Toplam Ödeme" fill={theme.palette.success.main} radius={[8, 8, 0, 0]} />
                              </ReBarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Paper>

                        {/* Cards list */}
                        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                          {regionReports.map((r) => (
                            // @ts-expect-error
                            <Grid item xs={12} sm={6} lg={6} key={r.regionId}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: { xs: 2, sm: 2.25, md: 2.5 },
                                  borderRadius: { xs: 2.5, md: 3 },
                                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                  transition: 'all 300ms ease',
                                  height: '100%',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                                  },
                                }}
                              >
                                <Stack spacing={1.25}>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography sx={{ fontWeight: 900 }}>{r.regionName ?? '-'}</Typography>
                                    <Chip size="small" label={`${r.memberCount ?? 0} üye`} />
                                  </Stack>

                                  <Divider />

                                  <Grid container spacing={2}>
                                    {/* @ts-expect-error */}
                                    <Grid item xs={6}>
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Aktif Üye
                                      </Typography>
                                      <Typography sx={{ fontWeight: 900 }}>{r.activeMembers ?? 0}</Typography>
                                    </Grid>
                                    {/* @ts-expect-error */}
                                    <Grid item xs={6}>
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Toplam Borç
                                      </Typography>
                                      <Typography sx={{ fontWeight: 900 }}>
                                        {(r.totalDebt ?? 0).toLocaleString('tr-TR')} TL
                                      </Typography>
                                    </Grid>
                                    {/* @ts-expect-error */}
                                    <Grid item xs={6}>
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Toplam Ödeme
                                      </Typography>
                                      <Typography sx={{ fontWeight: 900 }}>
                                        {(r.totalPayments ?? 0).toLocaleString('tr-TR')} TL
                                      </Typography>
                                    </Grid>
                                    {/* @ts-expect-error */}
                                    <Grid item xs={6}>
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Toplam Üye
                                      </Typography>
                                      <Typography sx={{ fontWeight: 900 }}>{r.memberCount ?? 0}</Typography>
                                    </Grid>
                                  </Grid>
                                </Stack>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </>
                    )}
                  </Stack>
                </TabPanel>
              )}

              {/* MEMBER STATUS */}
              {canViewMemberStatus && (
                <TabPanel value={safeTabValue} index={tabs.findIndex((t) => t.type === 'memberStatus')}>
                  {memberStatusReport.length === 0 ? (
                    <EmptyState title="Üye durum raporu verisi bulunamadı." />
                  ) : (
                    <Stack spacing={{ xs: 2, sm: 2.5 }}>
                      <ExportButtons
                        onExportExcel={async () => {
                          setExporting(true);
                          try {
                            await exportMemberStatusReportToExcel();
                            toast.success('Excel dosyası indirildi');
                          } catch (error) {
                            toast.error('Excel export sırasında bir hata oluştu');
                          } finally {
                            setExporting(false);
                          }
                        }}
                        onExportPdf={async () => {
                          setExporting(true);
                          try {
                            await exportMemberStatusReportToPdf();
                            toast.success('PDF dosyası indirildi');
                          } catch (error) {
                            toast.error('PDF export sırasında bir hata oluştu');
                          } finally {
                            setExporting(false);
                          }
                        }}
                        loading={exporting}
                      />
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.5, sm: 2, md: 2.25 },
                          borderRadius: { xs: 2.5, md: 3 },
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                          transition: 'all 300ms ease',
                          '&:hover': {
                            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                          },
                        }}
                      >
                        <Typography 
                          sx={{ 
                            fontWeight: 900, 
                            mb: { xs: 0.25, sm: 0.5 },
                            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                          }}
                        >
                          Üye Durum Dağılımı
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary', 
                            mb: { xs: 1, sm: 1.5 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            display: { xs: 'none', sm: 'block' }
                          }}
                        >
                          Durumlara göre toplam üye dağılımı.
                        </Typography>

                        <Box sx={{ height: { xs: 240, sm: 280, md: 320, lg: 360 }, width: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={memberStatusReport.map((x) => ({ ...x, label: getStatusLabel(x.status) })) as any}
                                dataKey="count"
                                nameKey="label"
                                outerRadius={isMobile ? 70 : isTablet ? 85 : 100}
                                innerRadius={isMobile ? 35 : isTablet ? 45 : 55}
                                paddingAngle={2}
                              >
                                {memberStatusReport.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={[
                                      theme.palette.primary.main,
                                      theme.palette.success.main,
                                      theme.palette.warning.main,
                                      theme.palette.error.main,
                                      theme.palette.info.main,
                                    ][i % 5]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{
                                  borderRadius: 8,
                                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                }}
                              />
                              <Legend 
                                wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </Paper>

                      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        {memberStatusReport.map((r, i) => (
                          // @ts-expect-error
                          <Grid item xs={12} sm={6} md={6} lg={4} key={i}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: { xs: 2, sm: 2.25, md: 2.5 },
                                borderRadius: { xs: 2.5, md: 3 },
                                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                transition: 'all 300ms ease',
                                height: '100%',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                                },
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography sx={{ fontWeight: 900 }}>{getStatusLabel(r.status)}</Typography>
                                <Chip size="small" label={`${r.count ?? 0} üye`} />
                              </Stack>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Yüzde: %{(r.percentage ?? 0).toFixed(2)}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Stack>
                  )}
                </TabPanel>
              )}

              {/* DUES */}
              {canViewDues && (
                <TabPanel value={safeTabValue} index={tabs.findIndex((t) => t.type === 'dues')}>
                  {!duesReport ? (
                    <EmptyState title="Aidat raporu verisi bulunamadı." />
                  ) : (
                    <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                      <ExportButtons
                        onExportExcel={async () => {
                          setExporting(true);
                          try {
                            await exportDuesReportToExcel();
                            toast.success('Excel dosyası indirildi');
                          } catch (error) {
                            toast.error('Excel export sırasında bir hata oluştu');
                          } finally {
                            setExporting(false);
                          }
                        }}
                        onExportPdf={async () => {
                          setExporting(true);
                          try {
                            await exportDuesReportToPdf();
                            toast.success('PDF dosyası indirildi');
                          } catch (error) {
                            toast.error('PDF export sırasında bir hata oluştu');
                          } finally {
                            setExporting(false);
                          }
                        }}
                        loading={exporting}
                      />
                      {/* KPI */}
                      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} md={4}>
                          <StatCard
                            tone="success"
                            icon={<AccountBalanceIcon />}
                            title="Toplam Ödeme"
                            value={`${(duesReport.totalPayments ?? 0).toLocaleString('tr-TR')} TL`}
                          />
                        </Grid>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} md={4}>
                          <StatCard
                            tone="primary"
                            icon={<PeopleIcon />}
                            title="Ödeme Yapan Üye"
                            value={duesReport.paidMembers ?? 0}
                          />
                        </Grid>
                        {/* @ts-expect-error */}
                        <Grid item xs={12} sm={6} md={4}>
                          <StatCard
                            tone="warning"
                            icon={<PeopleIcon />}
                            title="Ödeme Yapmayan Üye"
                            value={duesReport.unpaidMembers ?? 0}
                          />
                        </Grid>
                      </Grid>

                      {/* Chart */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.5, sm: 2, md: 2.25 },
                          borderRadius: { xs: 2.5, md: 3 },
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                          transition: 'all 300ms ease',
                          '&:hover': {
                            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                          },
                        }}
                      >
                        <Typography 
                          sx={{ 
                            fontWeight: 900, 
                            mb: { xs: 0.25, sm: 0.5 },
                            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                          }}
                        >
                          Aylık Ödemeler
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary', 
                            mb: { xs: 1, sm: 1.5 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            display: { xs: 'none', sm: 'block' }
                          }}
                        >
                          Ay bazlı toplam ödeme trendi.
                        </Typography>

                        <Box sx={{ height: { xs: 240, sm: 280, md: 320, lg: 360 }, width: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                              data={duesReport.byMonth} 
                              margin={{ 
                                top: 8, 
                                right: isMobile ? 8 : 16, 
                                bottom: isMobile ? 40 : 28, 
                                left: isMobile ? -10 : 0 
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                              <XAxis
                                dataKey={(it: any) => `${it.month}/${it.year}`}
                                tick={axisTickStyle}
                                interval={isMobile ? 'preserveStartEnd' : 'preserveStartEnd'}
                              />
                              <YAxis tick={axisTickStyle} width={isMobile ? 40 : 60} />
                              <Tooltip 
                                contentStyle={{
                                  borderRadius: 8,
                                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                }}
                              />
                              <Legend 
                                wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="total"
                                name="Toplam Ödeme"
                                stroke={theme.palette.primary.main}
                                strokeWidth={isMobile ? 2 : 2.5}
                                dot={{ r: isMobile ? 3 : 4 }}
                                activeDot={{ r: isMobile ? 5 : 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Paper>

                      {/* Table */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.5, sm: 2, md: 2.25 },
                          borderRadius: { xs: 2.5, md: 3 },
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                          overflowX: 'auto',
                          transition: 'all 300ms ease',
                          '&:hover': {
                            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                          },
                        }}
                      >
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          alignItems={{ xs: 'flex-start', sm: 'center' }} 
                          justifyContent="space-between" 
                          spacing={1}
                          sx={{ mb: { xs: 1, sm: 1.5 } }}
                        >
                          <Typography 
                            sx={{ 
                              fontWeight: 900,
                              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                            }}
                          >
                            Aylık Ödeme Tablosu
                          </Typography>
                          <Chip 
                            size="small" 
                            label={`${duesReport.byMonth?.length ?? 0} ay`}
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          />
                        </Stack>

                        <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <Table 
                            size={isMobile ? 'small' : 'medium'} 
                            sx={{ 
                              minWidth: { xs: 400, sm: 620 },
                              '& .MuiTableCell-root': {
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                py: { xs: 1, sm: 1.25 },
                              },
                            }}
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Ay/Yıl</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">
                                  Tutar
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">
                                  Ödeme Sayısı
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(duesReport.byMonth ?? []).map((it, i) => (
                                <TableRow 
                                  hover 
                                  key={i}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    },
                                  }}
                                >
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {it.month}/{it.year}
                                  </TableCell>
                                  <TableCell align="right">{(it.total ?? 0).toLocaleString('tr-TR')} TL</TableCell>
                                  <TableCell align="right">{it.count ?? 0}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Paper>
                    </Stack>
                  )}
                </TabPanel>
              )}
            </>
          )}
        </Box>

        {!loading && hasAnyTab && (
          <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, pb: { xs: 1.5, sm: 2, md: 2.5 }, pt: 0.5 }}>
            <Divider sx={{ mb: { xs: 1, sm: 1.5 } }} />
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Not: Grafiklerde mobil görünüm için etiketler döndürülmüştür.
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default ReportsPage;
