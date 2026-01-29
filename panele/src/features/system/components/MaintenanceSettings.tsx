// src/pages/system/components/MaintenanceSettings.tsx
import React from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  Card,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

const MaintenanceSettings: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.light, 0.02)} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AssessmentIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Bakım & Geliştirici Ayarları
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sistem bakım ve izleme ayarları
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Alert severity="info" icon={<AssessmentIcon />}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              Bakım Ayarları
            </Typography>
            <Typography variant="body2">
              Bakım ve geliştirici ayarları sayfası geliştirilmektedir.
            </Typography>
          </Alert>
        </Box>
      </Card>
    </Stack>
  );
};

export default MaintenanceSettings;
