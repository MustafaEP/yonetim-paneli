// src/pages/system/components/OrganizationSettings.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

const OrganizationSettings: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Şube & Organizasyon Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Organizasyon yapısı ayarları
        </Typography>
      </Box>

      <Alert severity="info" icon={<BusinessIcon />}>
        Şube ve organizasyon ayarları sayfası geliştirilmektedir. Şu anda bölgeler sayfasından şube yönetimi yapabilirsiniz.
      </Alert>
    </Box>
  );
};

export default OrganizationSettings;

