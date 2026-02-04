// src/pages/system/SystemSettingsPage.tsx
import React from 'react';
import {
  Box,
  Alert,
  useTheme,
  alpha,
  Paper,
  Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ConstructionIcon from '@mui/icons-material/Construction';

import { useAuth } from '../../../app/providers/AuthContext';
import PageHeader from '../../../shared/components/layout/PageHeader';
import PageLayout from '../../../shared/components/layout/PageLayout';

const SystemSettingsPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();

  const canView = hasPermission('SYSTEM_SETTINGS_VIEW');

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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            py: 6,
            px: 3,
          }}
        >
          <ConstructionIcon
            sx={{
              fontSize: 64,
              color: alpha(theme.palette.primary.main, 0.6),
              mb: 2,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              textAlign: 'center',
              mb: 1,
            }}
          >
            Yakında eklenecek
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            Sistem ayarları bu bölümde yakında kullanıma sunulacaktır.
          </Typography>
        </Box>
      </Paper>
      </Box>
    </PageLayout>
  );
};

export default SystemSettingsPage;