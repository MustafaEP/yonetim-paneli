// src/pages/system/components/MaintenanceSettings.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

const MaintenanceSettings: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Bakım & Geliştirici Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sistem bakım ve izleme ayarları
        </Typography>
      </Box>

      <Alert severity="info" icon={<AssessmentIcon />}>
        Bakım ve geliştirici ayarları sayfası geliştirilmektedir.
      </Alert>
    </Box>
  );
};

export default MaintenanceSettings;

