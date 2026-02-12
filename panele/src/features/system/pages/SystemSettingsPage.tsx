// src/features/system/pages/SystemSettingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Alert,
  useTheme,
  alpha,
  Paper,
  CircularProgress,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import { useAuth } from '../../../app/providers/AuthContext';
import { useSystemSettings } from '../../../app/providers/SystemSettingsContext';
import PageHeader from '../../../shared/components/layout/PageHeader';
import PageLayout from '../../../shared/components/layout/PageLayout';
import { useToast } from '../../../shared/hooks/useToast';
import { getApiErrorMessage } from '../../../shared/utils/errorUtils';

import { getSystemSettings, updateSystemSetting } from '../services/systemApi';
import type { SystemSetting } from '../services/systemApi';
import SettingsSidebar, { type SettingsCategory } from '../components/SettingsSidebar';
import GeneralSettings from '../components/GeneralSettings';
import MembershipSettings from '../components/MembershipSettings';
import ComingSoonPlaceholder from '../components/ComingSoonPlaceholder';

const SystemSettingsPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const { refreshSettings } = useSystemSettings();
  const toast = useToast();

  const canView = hasPermission('SYSTEM_SETTINGS_VIEW');
  const canManage = hasPermission('SYSTEM_SETTINGS_MANAGE');

  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>('GENERAL');
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemSettings();
      setSettings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Sistem ayarları yüklenirken bir hata oluştu.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) {
      loadSettings();
    }
  }, [canView, loadSettings]);

  const handleUpdate = useCallback(
    async (key: string, value: string) => {
      if (!canManage) return;
      try {
        await updateSystemSetting(key, { value });
        toast.success('Ayar başarıyla güncellendi');
        await refreshSettings();
        const updated = await getSystemSettings();
        setSettings(Array.isArray(updated) ? updated : []);
      } catch (e) {
        const message = getApiErrorMessage(e, 'Ayar güncellenirken bir hata oluştu.');
        toast.showError(message);
        throw e;
      }
    },
    [canManage, toast, refreshSettings],
  );

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
    <PageLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <PageHeader
          icon={<SettingsIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
          title="Sistem Ayarları"
          description="Sistem genel ayarlarını yönetin ve yapılandırın"
          color={theme.palette.primary.main}
          darkColor={theme.palette.primary.dark}
          lightColor={theme.palette.primary.light}
        />

        <SettingsSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden',
            backgroundColor: theme.palette.background.paper,
            minHeight: 400,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 400,
                py: 6,
              }}
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Box>
          ) : (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {selectedCategory === 'GENERAL' && (
                <GeneralSettings
                  settings={settings}
                  onUpdate={handleUpdate}
                  loading={false}
                />
              )}
              {selectedCategory === 'MEMBERSHIP' && (
                <MembershipSettings
                  settings={settings}
                  onUpdate={canManage ? handleUpdate : undefined}
                  loading={false}
                  canManage={canManage}
                />
              )}
              {selectedCategory === 'DUES' && (
                <ComingSoonPlaceholder title="Aidat" />
              )}
              {selectedCategory === 'SECURITY' && (
                <ComingSoonPlaceholder title="Güvenlik" />
              )}
              {selectedCategory === 'AUDIT' && (
                <ComingSoonPlaceholder title="Loglama" />
              )}
              {selectedCategory === 'INTEGRATION' && (
                <ComingSoonPlaceholder title="Entegrasyon" />
              )}
              {selectedCategory === 'MAINTENANCE' && (
                <ComingSoonPlaceholder title="Bakım" />
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </PageLayout>
  );
};

export default SystemSettingsPage;
