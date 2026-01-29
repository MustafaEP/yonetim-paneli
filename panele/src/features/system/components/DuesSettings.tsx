// src/pages/system/components/DuesSettings.tsx
import React from 'react';
import {
  Box,
  Card,
  Typography,
  useTheme,
  alpha,
  CircularProgress,
  Stack,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import type { SystemSetting } from '../services/systemApi';

interface DuesSettingsProps {
  settings: SystemSetting[];
  onUpdate: (key: string, value: string) => Promise<void>;
  loading?: boolean;
}

const DuesSettings: React.FC<DuesSettingsProps> = ({
  settings: _settings,
  onUpdate: _onUpdate,
  loading = false,
}) => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : (
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
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AccountBalanceIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  Aidat & Finans Ayarları
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Aidat planları, ödeme periyotları ve finansal ayarlar
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              Yakında eklenecek
            </Typography>
          </Box>
        </Card>
      )}
    </Stack>
  );
};

export default DuesSettings;
