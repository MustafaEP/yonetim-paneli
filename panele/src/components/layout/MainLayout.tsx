// src/components/layout/MainLayout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  useTheme,
  alpha,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import Sidebar, { drawerWidth } from './Sidebar';
import ProfileMenu from './ProfileMenu';
import NotificationCenter from '../notifications/NotificationCenter';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../context/AuthContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import { useDocumentHead } from '../../hooks/useDocumentHead';
import { Avatar } from '@mui/material';

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Desktop sidebar durumu - localStorage'dan yükle
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const { isAuthenticated, isLoading } = useAuth();
  const { getSettingValue } = useSystemSettings();

  const siteName = getSettingValue('SITE_NAME', 'Sendika Yönetim Paneli');
  const siteLogoUrl = getSettingValue('SITE_LOGO_URL', '');
  
  // Footer text'i useMemo ile optimize et
  const footerText = useMemo(() => {
    return getSettingValue('FOOTER_TEXT', `© ${new Date().getFullYear()} Sendika Yönetim Sistemi. Tüm hakları saklıdır.`);
  }, [getSettingValue]);

  // Logo URL'ini çözümle - environment variable veya window.location kullan
  const resolvedLogoUrl = useMemo(() => {
    if (!siteLogoUrl) return '';
    
    // Eğer zaten tam URL ise (http:// veya https:// ile başlıyorsa) direkt kullan
    if (siteLogoUrl.startsWith('http://') || siteLogoUrl.startsWith('https://')) {
      return siteLogoUrl;
    }
    
    // Relative path ise, API base URL'ini kullan
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL 
      : (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000');
    
    try {
      return new URL(siteLogoUrl, API_BASE_URL).toString();
    } catch {
      // URL oluşturulamazsa, basit concatenation yap
      return `${API_BASE_URL}${siteLogoUrl.startsWith('/') ? '' : '/'}${siteLogoUrl}`;
    }
  }, [siteLogoUrl]);

  // Document title ve favicon'u güncelle
  useDocumentHead(
    `${siteName} | Yönetim Paneli`,
    siteLogoUrl || undefined
  );

  // Token kontrolü - eğer token yoksa login'e yönlendir
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Desktop sidebar toggle - localStorage'a kaydet
  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => {
      const newValue = !prev;
      localStorage.setItem('sidebarOpen', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Loading durumunda spinner göster
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  // Token yoksa hiçbir şey render etme (redirect zaten useEffect'te yapılıyor)
  if (!isAuthenticated) {
    return null;
  }

  // Breadcrumb oluşturma
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  const breadcrumbNameMap: { [key: string]: string } = {
    dashboard: 'Dashboard',
    members: 'Üyeler',
    applications: 'Başvurular',
    new: 'Yeni Başvuru',
    users: 'Panel Kullanıcıları',
    roles: 'Roller',
    dues: 'Aidat',
    plans: 'Planlar',
    debts: 'Borçlular',
    regions: 'Bölgeler',
    provinces: 'İller',
    districts: 'İlçeler',
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#ffffff',
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Menu Button - Mobile ve Desktop */}
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={isMobile ? handleDrawerToggle : handleSidebarToggle}
            sx={{ 
              mr: 2,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {resolvedLogoUrl ? (
              <Avatar
                key={resolvedLogoUrl}
                src={resolvedLogoUrl}
                alt="Logo"
                sx={{
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  borderRadius: 2,
                  mr: { xs: 1.5, sm: 2 },
                  boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
                imgProps={{
                  onError: (e) => {
                    const target = e.target as HTMLImageElement;
                    console.error('Logo yüklenemedi:', siteLogoUrl, 'Attempted URL:', target.src);
                    // Fallback: Logo yüklenemezse boş göster
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: { xs: 1.5, sm: 2 },
                  boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <Typography
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                  }}
                >
                  {siteName.charAt(0).toUpperCase()}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { sm: '1rem', md: '1.1rem' },
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {siteName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  display: { xs: 'none', md: 'block' },
                }}
              >
                Tüm üye işlemlerinizi yönetin
              </Typography>
            </Box>
            {/* Mobile Title */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {siteName.length > 20 ? `${siteName.substring(0, 20)}...` : siteName}
              </Typography>
            </Box>
          </Box>
          <NotificationCenter />
          <ProfileMenu />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        onDrawerToggle={handleDrawerToggle}
        desktopOpen={sidebarOpen}
      />

      {/* Ana İçerik */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          overflow: 'hidden',
          direction: 'ltr',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Spacer for AppBar */}
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />

        {/* Breadcrumb Bölümü */}
        {pathnames.length > 0 && (
          <Box
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 1.5, sm: 2, md: 2.5 },
              backgroundColor: '#ffffff',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: '4px',
              },
            }}
          >
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" sx={{ color: alpha(theme.palette.text.secondary, 0.4) }} />}
              aria-label="breadcrumb"
              sx={{
                '& .MuiBreadcrumbs-ol': {
                  flexWrap: 'nowrap',
                },
              }}
            >
              <MuiLink
                component={Link}
                to="/"
                underline="hover"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Ana Sayfa
              </MuiLink>
              {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const breadcrumbText = breadcrumbNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

                return last ? (
                  <Typography
                    key={to}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: theme.palette.primary.main,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {breadcrumbText}
                  </Typography>
                ) : (
                  <MuiLink
                    component={Link}
                    to={to}
                    key={to}
                    underline="hover"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    {breadcrumbText}
                  </MuiLink>
                );
              })}
            </Breadcrumbs>
          </Box>
        )}

        {/* İçerik Alanı */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            maxWidth: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: { xs: 2, sm: 3 },
            px: { xs: 2, sm: 3, md: 4 },
            mt: 'auto',
            backgroundColor: '#ffffff',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
              }}
            >
              {footerText}
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                }}
              >
                Gizlilik
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                }}
              >
                Koşullar
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                }}
              >
                Destek
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;