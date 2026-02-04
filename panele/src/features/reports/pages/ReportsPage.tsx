import React from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ConstructionIcon from '@mui/icons-material/Construction';

import PageHeader from '../../../shared/components/layout/PageHeader';
import PageLayout from '../../../shared/components/layout/PageLayout';

const ReportsPage: React.FC = () => {
  const theme = useTheme();

  return (
    <PageLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <PageHeader
          icon={<AssessmentIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
          title="Raporlar"
          description="Raporlama ve analiz"
          color={theme.palette.primary.main}
          darkColor={theme.palette.primary.dark}
          lightColor={theme.palette.primary.light}
        />

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
              py: 6,
              px: 3,
            }}
          >
            <ConstructionIcon
              sx={{
                fontSize: 64,
                color: alpha(theme.palette.primary.main, 0.6),
                mb: 2,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                textAlign: 'center',
                mb: 1,
              }}
            >
              Yakında eklenecek
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                textAlign: 'center',
                maxWidth: 400,
              }}
            >
              Raporlama özellikleri bu bölümde yakında kullanıma sunulacaktır.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </PageLayout>
  );
};

export default ReportsPage;
