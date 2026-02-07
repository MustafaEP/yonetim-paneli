// src/features/members/pages/BulkMemberRegistrationPage.tsx
import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PageHeader from '../../../shared/components/layout/PageHeader';
import PageLayout from '../../../shared/components/layout/PageLayout';

const BulkMemberRegistrationPage: React.FC = () => {
  const theme = useTheme();

  return (
    <PageLayout>
      <PageHeader
        icon={<GroupAddIcon />}
        title="Toplu Üye Kayıt"
        description="Birden fazla üyeyi Excel veya benzeri dosya üzerinden toplu olarak sisteme kaydedin"
      />
      <Box
        sx={{
          p: 4,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Toplu üye kayıt sayfasına hoş geldiniz. Bu sayfa üzerinden Excel veya CSV dosyası yükleyerek birden fazla üyeyi tek seferde sisteme ekleyebilirsiniz.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bu özellik yakında aktif olacaktır. Şimdilik tek tek üye başvurusu oluşturma sayfasını kullanabilirsiniz.
        </Typography>
      </Box>
    </PageLayout>
  );
};

export default BulkMemberRegistrationPage;
