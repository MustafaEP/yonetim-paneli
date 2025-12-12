// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import LoginPage from './pages/auth/LoginPage';
import MembersListPage from './pages/members/MembersListPage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import DuesPlansPage from './pages/dues/DuesPlansPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DuesDebtsPage from './pages/dues/DuesDebtsPage';
import DuesMonthlyReportPage from './pages/dues/DuesMonthlyReportPage';
import UsersListPage from './pages/users/UsersListPage';
import UserDetailPage from './pages/users/UserDetailPage';
import MembersApplicationsPage from './pages/members/MembersApplicationsPage';
import MemberApplicationCreatePage from './pages/members/MemberApplicationCreatePage';
import MembersRejectedPage from './pages/members/MembersRejectedPage';
import MembersCancelledPage from './pages/members/MembersCancelledPage';
import RegionsProvincesPage from './pages/regions/RegionsProvincesPage';
import RegionsDistrictsPage from './pages/regions/RegionsDistrictsPage';
import RegionsWorkplacesPage from './pages/regions/RegionsWorkplacesPage';
import RegionsDealersPage from './pages/regions/RegionsDealersPage';
import ProfilePage from './pages/profile/ProfilePage';
import RolesListPage from './pages/roles/RolesListPage';
import RoleDetailPage from './pages/roles/RoleDetailPage';
import RoleCreateEditPage from './pages/roles/RoleCreateEditPage';
import { Box, Typography, Button, Container, Paper, alpha, useTheme } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';

// Forbidden Page Component
const ForbiddenPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, sm: 6 },
          textAlign: 'center',
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
        }}
      >
        <BlockIcon sx={{ fontSize: { xs: 64, sm: 80 }, color: 'error.main', mb: 3 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Erişim Engellendi
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
          Bu sayfaya erişim yetkiniz bulunmamaktadır. Lütfen sistem yöneticinizle iletişime geçin.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: `0 4px 12px ${alpha('#667eea', 0.3)}`,
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 20px ${alpha('#667eea', 0.4)}`,
            },
          }}
        >
          Ana Sayfaya Dön
        </Button>
      </Paper>
    </Container>
  );
};

const App: React.FC = () => {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={4000}
    >
      <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Tüm korumalı route'lar: Önce authentication kontrolü, sonra MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Dashboard: sadece login yetiyor */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Üyeler: MEMBER_LIST */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_LIST" />}>
            <Route path="/members" element={<MembersListPage />} />
            <Route path="/members/:id" element={<MemberDetailPage />} />
          </Route>

          {/* Üye Başvuruları */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_APPROVE" />}>
            <Route path="/members/applications" element={<MembersApplicationsPage />} />
          </Route>
          
          {/* Üye Başvurusu Oluşturma: MEMBER_CREATE_APPLICATION */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_CREATE_APPLICATION" />}>
            <Route path="/members/applications/new" element={<MemberApplicationCreatePage />} />
          </Route>

          {/* Reddedilen Üyeler: MEMBER_LIST */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_LIST" />}>
            <Route path="/members/rejected" element={<MembersRejectedPage />} />
            <Route path="/members/cancelled" element={<MembersCancelledPage />} />
          </Route>

          {/* Users: USER_LIST */}
          <Route element={<ProtectedRoute requiredPermission="USER_LIST" />}>
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
          </Route>

          {/* Roles: ROLE_LIST */}
          <Route element={<ProtectedRoute requiredPermission="ROLE_LIST" />}>
            <Route path="/roles" element={<RolesListPage />} />
            <Route path="/roles/new" element={<RoleCreateEditPage />} />
            <Route path="/roles/:id" element={<RoleDetailPage />} />
            <Route path="/roles/:id/edit" element={<RoleCreateEditPage />} />
          </Route>

          {/* Aidat Planları: DUES_PLAN_MANAGE */}
          <Route element={<ProtectedRoute requiredPermission="DUES_PLAN_MANAGE" />}>
            <Route path="/dues/plans" element={<DuesPlansPage />} />
          </Route>

          {/* Borçlu Üyeler: DUES_DEBT_LIST_VIEW */}
          <Route element={<ProtectedRoute requiredPermission="DUES_DEBT_LIST_VIEW" />}>
            <Route path="/dues/debts" element={<DuesDebtsPage />} />
          </Route>

          {/* Aylık Tahsilat Raporu: DUES_REPORT_VIEW */}
          <Route element={<ProtectedRoute requiredPermission="DUES_REPORT_VIEW" />}>
            <Route path="/dues/monthly-report" element={<DuesMonthlyReportPage />} />
          </Route>

          {/* Bölge Yönetimi: REGION_LIST ile görüntüleme */}
          <Route element={<ProtectedRoute requiredPermission="REGION_LIST" />}>
            <Route path="/regions/provinces" element={<RegionsProvincesPage />} />
            <Route path="/regions/districts" element={<RegionsDistrictsPage />} />
          </Route>

          {/* İşyeri: WORKPLACE_LIST */}
          <Route element={<ProtectedRoute requiredPermission="WORKPLACE_LIST" />}>
            <Route path="/regions/workplaces" element={<RegionsWorkplacesPage />} />
          </Route>

          {/* Bayi: DEALER_LIST */}
          <Route element={<ProtectedRoute requiredPermission="DEALER_LIST" />}>
            <Route path="/regions/dealers" element={<RegionsDealersPage />} />
          </Route>

          {/* Profil: Herkes erişebilir */}
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Forbidden Page */}
          <Route path="/forbidden" element={<ForbiddenPage />} />
        </Route>
      </Route>
    </Routes>
    </SnackbarProvider>
  );
};

export default App;