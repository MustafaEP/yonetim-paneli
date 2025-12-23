// src/pages/system/components/AuditSettings.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

const AuditSettings: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Loglama & Denetim Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Audit log ve izleme ayarları
        </Typography>
      </Box>

      <Alert severity="info" icon={<HistoryIcon />}>
        Loglama ve denetim ayarları sayfası geliştirilmektedir. Şu anda sistem logları sayfasından logları görüntüleyebilirsiniz.
      </Alert>
    </Box>
  );
};

export default AuditSettings;

