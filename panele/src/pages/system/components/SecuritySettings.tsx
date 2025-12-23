// src/pages/system/components/SecuritySettings.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

const SecuritySettings: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Güvenlik Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Şifre politikası ve oturum ayarları
        </Typography>
      </Box>

      <Alert severity="info" icon={<SecurityIcon />}>
        Güvenlik ayarları sayfası geliştirilmektedir.
      </Alert>
    </Box>
  );
};

export default SecuritySettings;

