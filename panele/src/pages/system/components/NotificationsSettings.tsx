// src/pages/system/components/NotificationsSettings.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const NotificationsSettings: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Bildirim Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Kanal ve bildirim yönetimi ayarları
        </Typography>
      </Box>

      <Alert severity="info" icon={<NotificationsIcon />}>
        Bildirim ayarları sayfası geliştirilmektedir. Şu anda bildirimler sayfasından bildirim gönderebilirsiniz.
      </Alert>
    </Box>
  );
};

export default NotificationsSettings;

