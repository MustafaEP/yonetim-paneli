// src/components/layout/MainLayout.tsx
import React, { useState } from 'react';
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
} from '@mui/material';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProfileMenu from './ProfileMenu';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import MenuIcon from '@mui/icons-material/Menu';

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Breadcrumb oluşturma
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  const breadcrumbNameMap: { [key: string]: string } = {
    dashboard: 'Dashboard',
    members: 'Üyeler',
    applications: 'Başvurular',
    new: 'Yeni Başvuru',
    users: 'Kullanıcılar',
    roles: 'Roller',
    dues: 'Aidat',
    plans: 'Planlar',
    debts: 'Borçlular',
    regions: 'Bölgeler',
    provinces: 'İller',
    districts: 'İlçeler',
    workplaces: 'İş Yerleri',
    dealers: 'Bayiler',
    institutions: 'Kurumlar',
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
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
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
                S
              </Typography>
            </Box>
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
                Sendika Yönetim Paneli
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
                Sendika Panel
              </Typography>
            </Box>
          </Box>
          <ProfileMenu />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      {/* Ana İçerik */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100%', md: `calc(100% - 260px)` },
          overflow: 'hidden',
          direction: 'ltr',
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
              © {new Date().getFullYear()} Sendika Yönetim Sistemi. Tüm hakları saklıdır.
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: { xs: 2, sm: 3 },
              }}
            >
              <MuiLink
                href="#"
                underline="hover"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Gizlilik
              </MuiLink>
              <MuiLink
                href="#"
                underline="hover"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Koşullar
              </MuiLink>
              <MuiLink
                href="#"
                underline="hover"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Destek
              </MuiLink>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;