// src/pages/system/components/IntegrationSettings.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';

const IntegrationSettings: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Entegrasyon Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          E-posta, SMS, API entegrasyon ayarları
        </Typography>
      </Box>

      <Alert severity="info" icon={<IntegrationInstructionsIcon />}>
        Entegrasyon ayarları sayfası geliştirilmektedir.
      </Alert>
    </Box>
  );
};

export default IntegrationSettings;

