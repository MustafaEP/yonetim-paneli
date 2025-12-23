// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import LoginPage from './pages/auth/LoginPage';
import MembersListPage from './pages/members/MembersListPage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import UsersListPage from './pages/users/UsersListPage';
import UserDetailPage from './pages/users/UserDetailPage';
import MembersApplicationsPage from './pages/members/MembersApplicationsPage';
import MemberApplicationCreatePage from './pages/members/MemberApplicationCreatePage';
import MemberUpdatePage from './pages/members/MemberUpdatePage';
import RegionsProvincesPage from './pages/regions/RegionsProvincesPage';
import RegionsWorkplacesPage from './pages/regions/RegionsWorkplacesPage';
import RegionsDealersPage from './pages/regions/RegionsDealersPage';
import ProfilePage from './pages/profile/ProfilePage';
import RolesListPage from './pages/roles/RolesListPage';
import RoleDetailPage from './pages/roles/RoleDetailPage';
import RoleCreateEditPage from './pages/roles/RoleCreateEditPage';
import ContentListPage from './pages/content/ContentListPage';
import DocumentTemplatesPage from './pages/documents/DocumentTemplatesPage';
import MemberDocumentsPage from './pages/documents/MemberDocumentsPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import MyNotificationsPage from './pages/notifications/MyNotificationsPage';
import NotificationSettingsPage from './pages/notifications/NotificationSettingsPage';
import SystemSettingsPage from './pages/system/SystemSettingsPage';
import SystemLogsPage from './pages/system/SystemLogsPage';
import BranchesPage from './pages/regions/BranchesPage';
import TevkifatCentersPage from './pages/accounting/TevkifatCentersPage';
import TevkifatCenterDetailPage from './pages/accounting/TevkifatCenterDetailPage';
import PaymentsListPage from './pages/payments/PaymentsListPage';
import PaymentDetailPage from './pages/payments/PaymentDetailPage';
import BranchDetailPage from './pages/regions/BranchDetailPage';
import InstitutionsPage from './pages/institutions/InstitutionsPage';
import InstitutionDetailPage from './pages/institutions/InstitutionDetailPage';
import InstitutionCreatePage from './pages/institutions/InstitutionCreatePage';
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

          {/* Üyeler: MEMBER_LIST veya MEMBER_LIST_BY_PROVINCE */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_LIST" alternativePermission="MEMBER_LIST_BY_PROVINCE" />}>
            <Route path="/members" element={<MembersListPage />} />
            <Route path="/members/:id" element={<MemberDetailPage />} />
          </Route>

          {/* Üye Güncelleme: MEMBER_UPDATE */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_UPDATE" />}>
            <Route path="/members/:id/update" element={<MemberUpdatePage />} />
          </Route>

          {/* Üye Başvuruları */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_APPROVE" />}>
            <Route path="/members/applications" element={<MembersApplicationsPage />} />
          </Route>
          
          {/* Üye Başvurusu Oluşturma: MEMBER_CREATE_APPLICATION */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_CREATE_APPLICATION" />}>
            <Route path="/members/applications/new" element={<MemberApplicationCreatePage />} />
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

          {/* Bölge Yönetimi: REGION_LIST ile görüntüleme */}
          <Route element={<ProtectedRoute requiredPermission="REGION_LIST" />}>
            <Route path="/regions" element={<Navigate to="/regions/provinces" replace />} />
            <Route path="/regions/provinces" element={<RegionsProvincesPage />} />
          </Route>

          {/* İşyeri: WORKPLACE_LIST */}
          <Route element={<ProtectedRoute requiredPermission="WORKPLACE_LIST" />}>
            <Route path="/regions/workplaces" element={<RegionsWorkplacesPage />} />
          </Route>

          {/* Bayi: DEALER_LIST */}
          <Route element={<ProtectedRoute requiredPermission="DEALER_LIST" />}>
            <Route path="/regions/dealers" element={<RegionsDealersPage />} />
          </Route>

          {/* Şube Yönetimi: BRANCH_MANAGE */}
          <Route element={<ProtectedRoute requiredPermission="BRANCH_MANAGE" alternativePermission="MEMBER_LIST_BY_PROVINCE" />}>
            <Route path="/regions/branches" element={<BranchesPage />} />
            <Route path="/regions/branches/:id" element={<BranchDetailPage />} />
          </Route>

          {/* Kurumlar: INSTITUTION_LIST */}
          <Route element={<ProtectedRoute requiredPermission="INSTITUTION_LIST" />}>
            <Route path="/institutions" element={<InstitutionsPage />} />
          </Route>
          
          {/* Kurum Detay: INSTITUTION_VIEW */}
          <Route element={<ProtectedRoute requiredPermission="INSTITUTION_VIEW" />}>
            <Route path="/institutions/:id" element={<InstitutionDetailPage />} />
          </Route>
          
          {/* Kurum Oluştur: INSTITUTION_CREATE */}
          <Route element={<ProtectedRoute requiredPermission="INSTITUTION_CREATE" />}>
            <Route path="/institutions/new" element={<InstitutionCreatePage />} />
          </Route>

          {/* İçerik Yönetimi: CONTENT_MANAGE */}
          <Route element={<ProtectedRoute requiredPermission="CONTENT_MANAGE" />}>
            <Route path="/content" element={<ContentListPage />} />
          </Route>

          {/* Doküman Yönetimi: DOCUMENT_TEMPLATE_MANAGE */}
          <Route element={<ProtectedRoute requiredPermission="DOCUMENT_TEMPLATE_MANAGE" />}>
            <Route path="/documents/templates" element={<DocumentTemplatesPage />} />
          </Route>

          {/* Üye Doküman Geçmişi: DOCUMENT_MEMBER_HISTORY_VIEW */}
          <Route element={<ProtectedRoute requiredPermission="DOCUMENT_MEMBER_HISTORY_VIEW" />}>
            <Route path="/documents/members" element={<MemberDocumentsPage />} />
            <Route path="/documents/members/:memberId" element={<MemberDocumentsPage />} />
          </Route>

          {/* Raporlar: REPORT_GLOBAL_VIEW, REPORT_REGION_VIEW, REPORT_MEMBER_STATUS_VIEW, REPORT_DUES_VIEW */}
          <Route element={<ProtectedRoute requiredPermission="REPORT_GLOBAL_VIEW" alternativePermission="REPORT_REGION_VIEW" alternativePermission2="REPORT_MEMBER_STATUS_VIEW" alternativePermission3="REPORT_DUES_VIEW" />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Bildirimler: NOTIFY_ALL_MEMBERS, NOTIFY_REGION, NOTIFY_OWN_SCOPE */}
          <Route element={<ProtectedRoute requiredPermission="NOTIFY_ALL_MEMBERS" alternativePermission="NOTIFY_REGION" alternativePermission2="NOTIFY_OWN_SCOPE" />}>
            <Route path="/notifications/send" element={<NotificationsPage />} />
          </Route>

          {/* Kullanıcı Bildirimleri - Herkes erişebilir */}
          <Route path="/notifications" element={<MyNotificationsPage />} />
          <Route path="/notifications/settings" element={<NotificationSettingsPage />} />

          {/* Sistem Ayarları: SYSTEM_SETTINGS_VIEW */}
          <Route element={<ProtectedRoute requiredPermission="SYSTEM_SETTINGS_VIEW" />}>
            <Route path="/system/settings" element={<SystemSettingsPage />} />
          </Route>

          {/* Sistem Logları: LOG_VIEW_ALL, LOG_VIEW_OWN_SCOPE */}
          <Route element={<ProtectedRoute requiredPermission="LOG_VIEW_ALL" alternativePermission="LOG_VIEW_OWN_SCOPE" />}>
            <Route path="/system/logs" element={<SystemLogsPage />} />
          </Route>

          {/* Muhasebe: ACCOUNTING_VIEW */}
          <Route element={<ProtectedRoute requiredPermission="ACCOUNTING_VIEW" />}>
            <Route path="/accounting/tevkifat-centers" element={<TevkifatCentersPage />} />
            <Route path="/accounting/tevkifat-centers/:id" element={<TevkifatCenterDetailPage />} />
          </Route>

          {/* Ödemeler: MEMBER_PAYMENT_LIST */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_PAYMENT_LIST" />}>
            <Route path="/payments" element={<PaymentsListPage />} />
          </Route>
          {/* Ödeme Detay: MEMBER_PAYMENT_VIEW */}
          <Route element={<ProtectedRoute requiredPermission="MEMBER_PAYMENT_VIEW" />}>
            <Route path="/payments/:id" element={<PaymentDetailPage />} />
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