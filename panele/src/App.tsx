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
import MemberApplicationCreatePage from './pages/members/MemberApplicationCreatePage';
import RegionsProvincesPage from './pages/regions/RegionsProvincesPage';
import RegionsDistrictsPage from './pages/regions/RegionsDistrictsPage';
import RegionsWorkplacesPage from './pages/regions/RegionsWorkplacesPage';
import RegionsDealersPage from './pages/regions/RegionsDealersPage';
import ProfilePage from './pages/profile/ProfilePage';

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
        {/* Üye Başvurusu Oluşturma: MEMBER_CREATE_APPLICATION */}
        <Route element={<ProtectedRoute requiredPermission="MEMBER_CREATE_APPLICATION" />}>
          <Route
            path="/members/applications/new"
            element={<MemberApplicationCreatePage />}
          />
        </Route>

        {/* İller: REGION_LIST izni (veya BRANCH_MANAGE zaten Admin için açık) */}
        <Route
          element={<ProtectedRoute requiredPermission="REGION_LIST" />}
        >
          <Route path="/regions/provinces" element={<RegionsProvincesPage />} />
        </Route>
        
        {/* Bölge Yönetimi: REGION_LIST ile görüntüleme, BRANCH_MANAGE ile CRUD */}
        <Route element={<ProtectedRoute requiredPermission="REGION_LIST" />}>
          <Route path="/regions/provinces" element={<RegionsProvincesPage />} />
          <Route path="/regions/districts" element={<RegionsDistrictsPage />} />
        </Route>

        {/* İşyeri: WORKPLACE_LIST görmek için, WORKPLACE_MANAGE CRUD için */}
        <Route element={<ProtectedRoute requiredPermission="WORKPLACE_LIST" />}>
          <Route path="/regions/workplaces" element={<RegionsWorkplacesPage />} />
        </Route>

        {/* Bayi: DEALER_LIST görmek için */}
        <Route element={<ProtectedRoute requiredPermission="DEALER_LIST" />}>
          <Route path="/regions/dealers" element={<RegionsDealersPage />} />
        </Route>

        {/* Profil: PROFILE_VIEW */}{/* Profil sayfası – sadece login olanlar */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        
        <Route path="/forbidden" element={<div>Erişim yetkiniz yok.</div>} />
      </Route>
    </Routes>
  );
};

export default App;
