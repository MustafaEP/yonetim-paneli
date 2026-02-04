// src/pages/system/SystemLogsPage.tsx
import React from 'react';
import { Box, Typography, useTheme, alpha, Paper } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ConstructionIcon from '@mui/icons-material/Construction';

import { useAuth } from '../../../app/providers/AuthContext';
import PageHeader from '../../../shared/components/layout/PageHeader';
import PageLayout from '../../../shared/components/layout/PageLayout';

const SystemLogsPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();

  const canViewAll = hasPermission('LOG_VIEW_ALL');
  const canViewOwn = hasPermission('LOG_VIEW_OWN_SCOPE');
  const canView = canViewAll || canViewOwn;

  if (!canView) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Bu sayfaya erişim yetkiniz bulunmamaktadır.</Typography>
      </Box>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        icon={<ListAltIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
        title="Sistem Logları"
        description="Sistem işlem kayıtlarını görüntüleyin ve takip edin"
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
            Sistem logları bu bölümde yakında kullanıma sunulacaktır.
          </Typography>
        </Box>
      </Paper>
    </PageLayout>
  );
};

export default SystemLogsPage;

