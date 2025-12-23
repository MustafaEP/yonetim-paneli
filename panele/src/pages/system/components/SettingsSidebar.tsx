// src/pages/system/components/SettingsSidebar.tsx
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BusinessIcon from '@mui/icons-material/Business';
import HistoryIcon from '@mui/icons-material/History';

export type SettingsCategory =
  | 'GENERAL'
  | 'ROLES'
  | 'MEMBERSHIP'
  | 'NOTIFICATIONS'
  | 'DUES'
  | 'ORGANIZATION'
  | 'SECURITY'
  | 'AUDIT'
  | 'INTEGRATION'
  | 'MAINTENANCE';

interface SettingsSidebarProps {
  selectedCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
}

interface CategoryItem {
  id: SettingsCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const categories: CategoryItem[] = [
  {
    id: 'GENERAL',
    label: 'Genel Sistem Ayarları',
    icon: <SettingsIcon />,
    description: 'Sistem kimliği ve temel davranış',
  },
  {
    id: 'ROLES',
    label: 'Rol & Yetki Ayarları',
    icon: <AdminPanelSettingsIcon />,
    description: 'İzin sistemi ve rol yönetimi',
  },
  {
    id: 'MEMBERSHIP',
    label: 'Üyelik & Başvuru',
    icon: <PeopleIcon />,
    description: 'Üye lifecycle kontrolü',
  },
  {
    id: 'NOTIFICATIONS',
    label: 'Bildirim Ayarları',
    icon: <NotificationsIcon />,
    description: 'Kanal ve bildirim yönetimi',
  },
  {
    id: 'DUES',
    label: 'Aidat & Finans',
    icon: <AccountBalanceIcon />,
    description: 'Aidat planları ve ödeme',
  },
  {
    id: 'ORGANIZATION',
    label: 'Şube & Organizasyon',
    icon: <BusinessIcon />,
    description: 'Organizasyon yapısı',
  },
  {
    id: 'SECURITY',
    label: 'Güvenlik Ayarları',
    icon: <SecurityIcon />,
    description: 'Şifre politikası ve oturum',
  },
  {
    id: 'AUDIT',
    label: 'Loglama & Denetim',
    icon: <HistoryIcon />,
    description: 'Audit log ve izleme',
  },
  {
    id: 'INTEGRATION',
    label: 'Entegrasyon Ayarları',
    icon: <IntegrationInstructionsIcon />,
    description: 'E-posta, SMS, API',
  },
  {
    id: 'MAINTENANCE',
    label: 'Bakım & Geliştirici',
    icon: <AssessmentIcon />,
    description: 'Sistem bakım ve izleme',
  },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 280,
        height: '100%',
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          Sistem Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Kategori seçin
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category.id;
          return (
            <React.Fragment key={category.id}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onCategoryChange(category.id)}
                  sx={{
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.05),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected ? theme.palette.primary.main : 'text.secondary',
                    }}
                  >
                    {category.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={category.label}
                    secondary={category.description}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.7rem',
                      sx: { mt: 0.25 },
                    }}
                  />
                </ListItemButton>
              </ListItem>
              {index < categories.length - 1 && <Divider sx={{ mx: 2 }} />}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

export default SettingsSidebar;

