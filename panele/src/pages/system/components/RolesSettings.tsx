// src/pages/system/components/RolesSettings.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const RolesSettings: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Rol & Yetki Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          İzin sistemi ve rol yönetimi ayarları
        </Typography>
      </Box>

      <Alert severity="info" icon={<AdminPanelSettingsIcon />}>
        Rol ve yetki ayarları sayfası geliştirilmektedir. Şu anda roller sayfasından rol yönetimi yapabilirsiniz.
      </Alert>
    </Box>
  );
};

export default RolesSettings;

