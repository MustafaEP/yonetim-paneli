// src/pages/system/components/MembershipSettings.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';

const MembershipSettings: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Üyelik & Başvuru Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Üye lifecycle kontrolü ve başvuru süreçleri
        </Typography>
      </Box>

      <Alert severity="info" icon={<PeopleIcon />}>
        Üyelik ve başvuru ayarları sayfası geliştirilmektedir.
      </Alert>
    </Box>
  );
};

export default MembershipSettings;

