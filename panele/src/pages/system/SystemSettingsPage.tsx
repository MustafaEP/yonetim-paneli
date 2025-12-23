// src/pages/system/SystemSettingsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import type { SystemSetting } from '../../api/systemApi';
import { getSystemSettings, updateSystemSetting } from '../../api/systemApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import SettingsSidebar, { type SettingsCategory } from './components/SettingsSidebar';
import GeneralSettings from './components/GeneralSettings';
import RolesSettings from './components/RolesSettings';
import MembershipSettings from './components/MembershipSettings';
import NotificationsSettings from './components/NotificationsSettings';
import DuesSettings from './components/DuesSettings';
import OrganizationSettings from './components/OrganizationSettings';
import SecuritySettings from './components/SecuritySettings';
import AuditSettings from './components/AuditSettings';
import IntegrationSettings from './components/IntegrationSettings';
import MaintenanceSettings from './components/MaintenanceSettings';

const SystemSettingsPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>('GENERAL');

  const canView = hasPermission('SYSTEM_SETTINGS_VIEW');
  const canManage = hasPermission('SYSTEM_SETTINGS_MANAGE');

  useEffect(() => {
    if (canView) {
      loadSettings();
    }
  }, [canView]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch (e: any) {
      console.error('Ayarlar yüklenirken hata:', e);
      toast.error('Ayarlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    try {
      await updateSystemSetting(key, { value });
      toast.success('Ayar başarıyla güncellendi');
      await loadSettings();
    } catch (e: any) {
      console.error('Ayar güncellenirken hata:', e);
      toast.error(e.response?.data?.message || 'Ayar güncellenirken bir hata oluştu');
      throw e;
    }
  };

  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case 'GENERAL':
        return (
          <GeneralSettings
            settings={settings}
            onUpdate={handleUpdate}
            loading={loading}
          />
        );
      case 'ROLES':
        return <RolesSettings />;
      case 'MEMBERSHIP':
        return <MembershipSettings />;
      case 'NOTIFICATIONS':
        return <NotificationsSettings />;
      case 'DUES':
        return <DuesSettings />;
      case 'ORGANIZATION':
        return <OrganizationSettings />;
      case 'SECURITY':
        return <SecuritySettings />;
      case 'AUDIT':
        return <AuditSettings />;
      case 'INTEGRATION':
        return <IntegrationSettings />;
      case 'MAINTENANCE':
        return <MaintenanceSettings />;
      default:
        return null;
    }
  };

  if (!canView) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Sol Menü */}
      <SettingsSidebar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Sağ Panel - İçerik */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            minHeight: '100%',
            borderRadius: 0,
            p: 3,
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress />
            </Box>
          ) : (
            renderCategoryContent()
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default SystemSettingsPage;
