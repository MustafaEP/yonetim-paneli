import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../../shared/components/layout/MainLayout';
import ForbiddenPage from './ForbiddenPage';
import NotFoundPage from './NotFoundPage';

import LoginPage from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import MembersListPage from '../../features/members/pages/MembersListPage';
import MembersByStatusPage from '../../features/members/pages/MembersByStatusPage';
import MemberDetailPage from '../../features/members/pages/MemberDetailPage';
import MemberUpdatePage from '../../features/members/pages/MemberUpdatePage';
import MembersApplicationsPage from '../../features/members/pages/MembersApplicationsPage';
import ApprovedMembersPage from '../../features/members/pages/ApprovedMembersPage';
import ActiveWaitingMembersPage from '../../features/members/pages/ActiveWaitingMembersPage';
import MemberApplicationCreatePage from '../../features/members/pages/MemberApplicationCreatePage';
import BulkMemberRegistrationPage from '../../features/members/pages/BulkMemberRegistrationPage';
import UsersListPage from '../../features/users/pages/UsersListPage';
import PanelUserApplicationsPage from '../../features/users/pages/PanelUserApplicationsPage';
import RolesListPage from '../../features/roles/pages/RolesListPage';
import RoleDetailPage from '../../features/roles/pages/RoleDetailPage';
import RoleCreateEditPage from '../../features/roles/pages/RoleCreateEditPage';
import RegionsPage from '../../features/regions/pages/RegionsPage';
import BranchesPage from '../../features/regions/pages/BranchesPage';
import BranchDetailPage from '../../features/regions/pages/BranchDetailPage';
import InstitutionsPage from '../../features/regions/pages/InstitutionsPage';
import InstitutionDetailPage from '../../features/regions/pages/InstitutionDetailPage';
import ProfessionsPage from '../../features/professions/pages/ProfessionsPage';
import ContentListPage from '../../features/content/pages/ContentListPage';
import DocumentTemplatesPage from '../../features/documents/pages/DocumentTemplatesPage';
import MemberDocumentsPage from '../../features/documents/pages/MemberDocumentsPage';
import ReportsPage from '../../features/reports/pages/ReportsPage';
import NotificationsPage from '../../features/notifications/pages/NotificationsPage';
import MyNotificationsPage from '../../features/notifications/pages/MyNotificationsPage';
import NotificationSettingsPage from '../../features/notifications/pages/NotificationSettingsPage';
import SystemSettingsPage from '../../features/system/pages/SystemSettingsPage';
import SystemLogsPage from '../../features/system/pages/SystemLogsPage';
import TevkifatCentersPage from '../../features/accounting/pages/TevkifatCentersPage';
import TevkifatCenterDetailPage from '../../features/accounting/pages/TevkifatCenterDetailPage';
import TevkifatCenterCreatePage from '../../features/accounting/pages/TevkifatCenterCreatePage';
import TevkifatTitlesPage from '../../features/accounting/pages/TevkifatTitlesPage';
import PaymentsListPage from '../../features/payments/pages/PaymentsListPage';
import PaymentDetailPage from '../../features/payments/pages/PaymentDetailPage';
import PaymentInquiryPage from '../../features/payments/pages/PaymentInquiryPage';
import QuickPaymentEntryPage from '../../features/payments/pages/QuickPaymentEntryPage';
import RecentPaymentsPage from '../../features/payments/pages/RecentPaymentsPage';
import ProfilePage from '../../features/profile/pages/ProfilePage';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route element={<ProtectedRoute requiredPermission="MEMBER_LIST" alternativePermission="MEMBER_LIST_BY_PROVINCE" />}>
          <Route path="/members" element={<MembersListPage />} />
          <Route path="/members/status/:status" element={<MembersByStatusPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="MEMBER_UPDATE" />}>
          <Route path="/members/:id/edit" element={<MemberUpdatePage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="MEMBER_APPROVE" />}>
          <Route path="/members/applications" element={<MembersApplicationsPage />} />
          <Route path="/members/approved" element={<ApprovedMembersPage />} />
          <Route path="/members/waiting" element={<ActiveWaitingMembersPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="MEMBER_CREATE_APPLICATION" />}>
          <Route path="/members/applications/new" element={<MemberApplicationCreatePage />} />
          <Route path="/members/bulk-registration" element={<BulkMemberRegistrationPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="USER_LIST" />}>
          <Route path="/users" element={<UsersListPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="PANEL_USER_APPLICATION_LIST" />}>
          <Route path="/users/applications" element={<PanelUserApplicationsPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="ROLE_LIST" />}>
          <Route path="/roles" element={<RolesListPage />} />
          <Route path="/roles/new" element={<RoleCreateEditPage />} />
          <Route path="/roles/:id" element={<RoleDetailPage />} />
          <Route path="/roles/:id/edit" element={<RoleCreateEditPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="REGION_LIST" alternativePermission="MEMBER_LIST_BY_PROVINCE" />}>
          <Route path="/regions" element={<Navigate to="/regions/provinces" replace />} />
          <Route path="/regions/provinces" element={<RegionsPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="BRANCH_MANAGE" alternativePermission="MEMBER_LIST_BY_PROVINCE" />}>
          <Route path="/regions/branches" element={<BranchesPage />} />
          <Route path="/regions/branches/:id" element={<BranchDetailPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="INSTITUTION_LIST" />}>
          <Route path="/institutions" element={<InstitutionsPage />} />
          <Route path="/institutions/:id" element={<InstitutionDetailPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="MEMBER_CREATE_APPLICATION" alternativePermission="MEMBER_UPDATE" />}>
          <Route path="/professions" element={<ProfessionsPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="CONTENT_MANAGE" />}>
          <Route path="/content" element={<ContentListPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="DOCUMENT_TEMPLATE_MANAGE" />}>
          <Route path="/documents/templates" element={<DocumentTemplatesPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="DOCUMENT_MEMBER_HISTORY_VIEW" />}>
          <Route path="/documents/members" element={<MemberDocumentsPage />} />
          <Route path="/documents/members/:memberId" element={<MemberDocumentsPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="REPORT_GLOBAL_VIEW" alternativePermission="REPORT_REGION_VIEW" alternativePermission2="REPORT_MEMBER_STATUS_VIEW" alternativePermission3="REPORT_DUES_VIEW" />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="NOTIFY_ALL_MEMBERS" alternativePermission="NOTIFY_REGION" alternativePermission2="NOTIFY_OWN_SCOPE" />}>
          <Route path="/notifications/send" element={<NotificationsPage />} />
        </Route>

        <Route path="/notifications" element={<MyNotificationsPage />} />
        <Route path="/notifications/settings" element={<NotificationSettingsPage />} />

        <Route element={<ProtectedRoute requiredPermission="SYSTEM_SETTINGS_VIEW" />}>
          <Route path="/system/settings" element={<SystemSettingsPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="LOG_VIEW_ALL" alternativePermission="LOG_VIEW_OWN_SCOPE" />}>
          <Route path="/system/logs" element={<SystemLogsPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="ACCOUNTING_VIEW" />}>
          <Route path="/accounting/tevkifat-centers/new" element={<TevkifatCenterCreatePage />} />
          <Route path="/accounting/tevkifat-centers/:id/edit" element={<TevkifatCenterCreatePage />} />
          <Route path="/accounting/tevkifat-centers/:id" element={<TevkifatCenterDetailPage />} />
          <Route path="/accounting/tevkifat-centers" element={<TevkifatCentersPage />} />
          <Route path="/accounting/tevkifat-titles" element={<TevkifatTitlesPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="MEMBER_PAYMENT_LIST" />}>
          <Route path="/payments" element={<PaymentsListPage />} />
          <Route path="/payments/inquiry" element={<PaymentInquiryPage />} />
          <Route path="/payments/recent" element={<RecentPaymentsPage />} />
          <Route path="/payments/quick-entry" element={<QuickPaymentEntryPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredPermission="MEMBER_PAYMENT_VIEW" />}>
          <Route path="/payments/:id" element={<PaymentDetailPage />} />
        </Route>

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);

export default AppRoutes;
