// src/pages/system/SystemSettingsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Paper,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SettingsIcon from '@mui/icons-material/Settings';

import type { SystemSetting } from '../services/systemApi';
import { getSystemSettings, updateSystemSetting } from '../services/systemApi';
import { useAuth } from '../../../app/providers/AuthContext';
import { useSystemSettings } from '../../../app/providers/SystemSettingsContext';
import { useToast } from '../../../shared/hooks/useToast';
import { getApiErrorMessage } from '../../../shared/utils/errorUtils';
import SettingsSidebar, { type SettingsCategory } from '../components/SettingsSidebar';
import GeneralSettings from '../components/GeneralSettings';
import MembershipSettings from '../components/MembershipSettings';
import DuesSettings from '../components/DuesSettings';
import SecuritySettings from '../components/SecuritySettings';
import AuditSettings from '../components/AuditSettings';
import IntegrationSettings from '../components/IntegrationSettings';
import MaintenanceSettings from '../components/MaintenanceSettings';
import PageHeader from '../../../shared/components/layout/PageHeader';

const categoryLabels: Record<SettingsCategory, string> = {
  GENERAL: 'Genel Ayarlar',
  MEMBERSHIP: 'Üyelik Ayarları',
  DUES: 'Aidat Ayarları',
  SECURITY: 'Güvenlik',
  AUDIT: 'Loglama',
  INTEGRATION: 'Entegrasyonlar',
  MAINTENANCE: 'Bakım',
};

const SystemSettingsPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const { refreshSettings } = useSystemSettings();

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
    } catch (e: unknown) {
      console.error('Ayarlar yüklenirken hata:', e);
      toast.error(getApiErrorMessage(e, 'Ayarlar yüklenirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    try {
      await updateSystemSetting(key, { value });
      toast.success('Ayar başarıyla güncellendi');
      await loadSettings();
      await refreshSettings();
    } catch (e: unknown) {
      console.error('Ayar güncellenirken hata:', e);
      toast.error(getApiErrorMessage(e, 'Ayar güncellenirken bir hata oluştu'));
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
      case 'MEMBERSHIP':
        return (
          <MembershipSettings
            settings={settings}
            onUpdate={canManage ? handleUpdate : undefined}
            loading={loading}
            canManage={canManage}
          />
        );
      case 'DUES':
        return (
          <DuesSettings
            settings={settings}
            onUpdate={handleUpdate}
            loading={loading}
          />
        );
      case 'SECURITY':
        return (
          <SecuritySettings
            settings={settings.filter((s) => s.category === 'SECURITY')}
            onUpdate={canManage ? handleUpdate : undefined}
            loading={loading}
          />
        );
      case 'AUDIT':
        return (
          <AuditSettings
            settings={settings.filter((s) => s.category === 'AUDIT')}
            onUpdate={canManage ? handleUpdate : undefined}
            loading={loading}
          />
        );
      case 'INTEGRATION':
        return (
          <IntegrationSettings
            settings={settings.filter((s) => s.category === 'INTEGRATION' || s.category === 'NOTIFICATION')}
            onUpdate={canManage ? handleUpdate : undefined}
            loading={loading}
          />
        );
      case 'MAINTENANCE':
        return <MaintenanceSettings />;
      default:
        return null;
    }
  };

  if (!canView) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          px: 3,
        }}
      >
        <Alert 
          severity="error"
          sx={{
            borderRadius: 2,
            maxWidth: 500,
          }}
        >
          Bu sayfaya erişim yetkiniz bulunmamaktadır.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Başlık ve Breadcrumb */}
      <PageHeader
        icon={<SettingsIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
        title="Sistem Ayarları"
        description="Sistem genel ayarlarını yönetin ve yapılandırın"
        color={theme.palette.primary.main}
        darkColor={theme.palette.primary.dark}
        lightColor={theme.palette.primary.light}
      />
      <Box>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: alpha(theme.palette.text.secondary, 0.4) }} />}
          sx={{ mb: 2 }}
        >
          <MuiLink
            href="/"
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                color: theme.palette.primary.main,
              },
            }}
          >
            Ana Sayfa
          </MuiLink>
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.primary.main,
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Sistem Ayarları
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Sidebar (Tab Navigation) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <SettingsSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </Paper>

      {/* İçerik */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              color: theme.palette.text.primary,
            }}
          >
            {categoryLabels[selectedCategory]}
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px',
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            renderCategoryContent()
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SystemSettingsPage;