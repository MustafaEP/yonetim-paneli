// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import MembersListPage from './pages/members/MembersListPage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import DuesPlansPage from './pages/dues/DuesPlansPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DuesDebtsPage from './pages/dues/DuesDebtsPage';
import RegionsPage from './pages/regions/RegionsPage';
import UsersListPage from './pages/users/UsersListPage';
import UserDetailPage from './pages/users/UserDetailPage';
import MembersApplicationsPage from './pages/members/MembersApplicationsPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<MainLayout />}>
        {/* Dashboard: sadece login yetiyor */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Üyeler: MEMBER_LIST */}
        <Route element={<ProtectedRoute requiredPermission="MEMBER_LIST" />}>
          <Route path="/members" element={<MembersListPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
        </Route>

        {/* Users: USER_LIST */}
        <Route element={<ProtectedRoute requiredPermission="USER_LIST" />}>
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
        </Route>

        {/* Aidat planları: DUES_PLAN_MANAGE */}
        <Route element={<ProtectedRoute requiredPermission="DUES_PLAN_MANAGE" />}>
          <Route path="/dues/plans" element={<DuesPlansPage />} />
        </Route>

        {/* Borçlu üyeler: DUES_DEBT_LIST_VIEW */}
        <Route
          element={<ProtectedRoute requiredPermission="DUES_DEBT_LIST_VIEW" />}
        >
          <Route path="/dues/debts" element={<DuesDebtsPage />} />
        </Route>
        {/* Regions: REGION_LIST izni (veya BRANCH_MANAGE zaten Admin için açık) */}
        <Route
          element={<ProtectedRoute requiredPermission="REGION_LIST" />}
        >
          <Route path="/regions" element={<RegionsPage />} />
        </Route>

        {/* Üye Başvuruları: MEMBER_APPROVE */}
        <Route element={<ProtectedRoute requiredPermission="MEMBER_APPROVE" />}>
          <Route path="/members/applications" element={<MembersApplicationsPage />} />
        </Route>

        <Route path="/forbidden" element={<div>Erişim yetkiniz yok.</div>} />
      </Route>
    </Routes>
  );
};

export default App;
