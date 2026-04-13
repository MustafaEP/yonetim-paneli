import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  alpha,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ChatIcon from '@mui/icons-material/Chat';
import CampaignIcon from '@mui/icons-material/Campaign';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';

import PageHeader from '../../../shared/components/layout/PageHeader';
import PageLayout from '../../../shared/components/layout/PageLayout';
import ConnectionStatusBadge from '../components/ConnectionStatusBadge';

const TABS = [
  { label: 'Sohbetler', icon: <ChatIcon />, path: '/messaging/chat' },
  { label: 'Toplu Mesaj', icon: <CampaignIcon />, path: '/messaging/bulk' },
  { label: 'Şablonlar', icon: <DescriptionIcon />, path: '/messaging/templates' },
  { label: 'Ayarlar', icon: <SettingsIcon />, path: '/messaging/settings' },
];

const WhatsAppSmsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = TABS.findIndex((tab) =>
    location.pathname.startsWith(tab.path),
  );
  const activeTab = currentTab >= 0 ? currentTab : 0;

  // Eger sadece /messaging'deyse chat'e yonlendir
  React.useEffect(() => {
    if (location.pathname === '/messaging') {
      navigate('/messaging/chat', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <PageLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <PageHeader
          icon={
            <WhatsAppIcon
              sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }}
            />
          }
          title="WhatsApp Mesajlaşma"
          description="Üyelerle WhatsApp üzerinden iletişim"
          color="#25D366"
          darkColor="#128C7E"
          lightColor={alpha('#25D366', 0.06)}
          sx={{ mb: 0 }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => navigate(TABS[newValue].path)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48,
              },
              '& .Mui-selected': {
                color: '#25D366 !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#25D366',
              },
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.path}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
              />
            ))}
          </Tabs>
          <ConnectionStatusBadge />
        </Box>

        <Box>
          <Outlet />
        </Box>
      </Box>
    </PageLayout>
  );
};

export default WhatsAppSmsPage;
