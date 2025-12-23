// src/pages/system/components/DuesSettings.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const DuesSettings: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Aidat & Finans Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aidat planları ve ödeme ayarları
        </Typography>
      </Box>

      <Alert severity="info" icon={<AccountBalanceIcon />}>
        Aidat ve finans ayarları sayfası geliştirilmektedir.
      </Alert>
    </Box>
  );
};

export default DuesSettings;

