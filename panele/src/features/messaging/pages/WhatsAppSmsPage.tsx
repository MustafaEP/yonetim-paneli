import React from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  alpha,
  Grid,
  Chip,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import ConstructionIcon from '@mui/icons-material/Construction';
import GroupsIcon from '@mui/icons-material/Groups';
import CampaignIcon from '@mui/icons-material/Campaign';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import HistoryIcon from '@mui/icons-material/History';

import PageHeader from '../../../shared/components/layout/PageHeader';
import PageLayout from '../../../shared/components/layout/PageLayout';

interface PlannedFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const PlannedFeatureCard: React.FC<PlannedFeatureCardProps> = ({ icon, title, description, color }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.06)}`,
        backgroundColor: '#ffffff',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(color, 0.1),
            color,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip
            label="Yakında"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 600,
              backgroundColor: alpha('#ff9800', 0.1),
              color: '#ff9800',
              mt: 0.25,
            }}
          />
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
        {description}
      </Typography>
    </Paper>
  );
};

const WhatsAppSmsPage: React.FC = () => {
  const theme = useTheme();

  const plannedFeatures = [
    {
      icon: <WhatsAppIcon />,
      title: 'WhatsApp Mesajları',
      description: 'Üyelere tek tek veya toplu WhatsApp mesajı gönderimi. Şablon tabanlı mesajlaşma desteği.',
      color: '#25D366',
    },
    {
      icon: <SmsIcon />,
      title: 'SMS Gönderimi',
      description: 'Toplu ve bireysel SMS gönderimi. Üye gruplarına, illere veya şubelere göre hedefleme.',
      color: '#2196f3',
    },
    {
      icon: <CampaignIcon />,
      title: 'Toplu Mesaj Kampanyaları',
      description: 'Belirli üye gruplarına, il/ilçe bazlı veya durum bazlı toplu mesaj kampanyaları oluşturma.',
      color: '#9c27b0',
    },
    {
      icon: <ScheduleSendIcon />,
      title: 'Zamanlı Gönderim',
      description: 'Mesajları ileri bir tarih ve saatte otomatik gönderilmek üzere zamanlama.',
      color: '#ff9800',
    },
    {
      icon: <GroupsIcon />,
      title: 'Üye Segmentasyonu',
      description: 'Üyeleri il, ilçe, şube, durum veya meslek gibi kriterlere göre gruplandırarak hedefli mesaj gönderimi.',
      color: '#00bcd4',
    },
    {
      icon: <HistoryIcon />,
      title: 'Gönderim Geçmişi',
      description: 'Gönderilen tüm mesajların detaylı geçmişi, iletim durumları ve istatistikleri.',
      color: '#607d8b',
    },
  ];

  return (
    <PageLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <PageHeader
          icon={<WhatsAppIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
          title="WhatsApp & SMS Sistemi"
          description="Üyelere WhatsApp ve SMS ile mesaj gönderimi"
          color="#25D366"
          darkColor="#128C7E"
          lightColor={alpha('#25D366', 0.06)}
        />

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha('#ff9800', 0.3)}`,
            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.06)}`,
            backgroundColor: alpha('#ff9800', 0.03),
            overflow: 'hidden',
            p: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha('#ff9800', 0.12),
                flexShrink: 0,
              }}
            >
              <ConstructionIcon sx={{ fontSize: 28, color: '#ff9800' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Bu modül geliştirme aşamasındadır
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                WhatsApp ve SMS mesajlaşma sistemi yakında kullanıma sunulacaktır.
                Aşağıda planlanan özellikler yer almaktadır.
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
          Planlanan Özellikler
        </Typography>

        <Grid container spacing={2}>
          {plannedFeatures.map((feature, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
              <PlannedFeatureCard {...feature} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default WhatsAppSmsPage;
