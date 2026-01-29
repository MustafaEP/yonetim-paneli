// src/shared/components/layout/Sidebar.tsx
import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  useTheme,
  alpha,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import BusinessIcon from '@mui/icons-material/Business';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SendIcon from '@mui/icons-material/Send';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WorkIcon from '@mui/icons-material/Work';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HistoryIcon from '@mui/icons-material/History';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthContext';
import type { SxProps, Theme } from '@mui/material';

const drawerWidth = 260;

// Helper function: Tekrarlayan nav item stilini oluşturur
const getNavItemSx = (theme: Theme, variant: 'default' | 'success' = 'default'): SxProps<Theme> => {
  const color = variant === 'success' ? theme.palette.success : theme.palette.primary;
  
  return {
    borderRadius: 2,
    mb: 0.5,
    ...(variant === 'success' && {
      backgroundColor: alpha(color.main, 0.08),
      '& .MuiListItemIcon-root': {
        color: color.main,
      },
    }),
    '&.Mui-selected': {
      backgroundColor: alpha(color.main, 0.08),
      color: color.main,
      '&:hover': {
        backgroundColor: alpha(color.main, 0.12),
      },
      '& .MuiListItemIcon-root': {
        color: color.main,
      },
    },
    '&:hover': {
      backgroundColor: variant === 'success' 
        ? alpha(color.main, 0.12)
        : alpha(theme.palette.action.hover, 0.04),
    },
  };
};

interface SidebarProps {
  mobileOpen?: boolean;
  onDrawerToggle?: () => void;
  desktopOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onDrawerToggle, desktopOpen = true }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPermission } = useAuth();
  
  const showUsers = hasPermission('USER_LIST');
  const showPanelUserApplications = hasPermission('PANEL_USER_APPLICATION_LIST');
  const showMembers = hasPermission('MEMBER_LIST') || hasPermission('MEMBER_LIST_BY_PROVINCE');
  const showMemberApplications =
    hasPermission('MEMBER_APPROVE') ||
    hasPermission('MEMBER_REJECT') ||
    hasPermission('MEMBER_LIST') ||
    hasPermission('MEMBER_LIST_BY_PROVINCE');
  const showRegions =
    hasPermission('REGION_LIST') || hasPermission('BRANCH_MANAGE');
  const showRoles = hasPermission('ROLE_LIST');
  const showContent = hasPermission('CONTENT_MANAGE');
  const showDocuments = hasPermission('DOCUMENT_TEMPLATE_MANAGE') || hasPermission('DOCUMENT_MEMBER_HISTORY_VIEW');
  const showReports = hasPermission('REPORT_GLOBAL_VIEW') || hasPermission('REPORT_REGION_VIEW') || hasPermission('REPORT_MEMBER_STATUS_VIEW') || hasPermission('REPORT_DUES_VIEW');
  const showNotifications = hasPermission('NOTIFY_ALL_MEMBERS') || hasPermission('NOTIFY_REGION') || hasPermission('NOTIFY_OWN_SCOPE');
  const showSystemSettings = hasPermission('SYSTEM_SETTINGS_VIEW');
  const showSystemLogs = hasPermission('LOG_VIEW_ALL') || hasPermission('LOG_VIEW_OWN_SCOPE');
  const showBranches = hasPermission('BRANCH_MANAGE');
  const showAccounting = hasPermission('ACCOUNTING_VIEW');
  const showPayments = hasPermission('MEMBER_PAYMENT_LIST');
  const canAddPayment = hasPermission('MEMBER_PAYMENT_ADD');
  const showInstitutions = hasPermission('INSTITUTION_LIST');
  const showProfessions = hasPermission('MEMBER_CREATE_APPLICATION') || hasPermission('MEMBER_UPDATE');

  const isActive = (path: string) => location.pathname === path;

  const handleLinkClick = () => {
    if (isMobile && onDrawerToggle) {
      onDrawerToggle();
    }
  };

  const drawerContent = (
    <>
      {isMobile && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Menü
          </Typography>
          <IconButton onClick={onDrawerToggle} size="small">
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      )}
      
      {!isMobile && <Toolbar />}
      
      <Box sx={{ px: 2, py: isMobile ? 2 : 3 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: theme.palette.text.secondary,
            letterSpacing: '0.08em',
            px: 2,
          }}
        >
          ANA MENÜ
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        <ListItemButton
          component={Link}
          to="/"
          selected={isActive('/') || isActive('/dashboard')}
          onClick={handleLinkClick}
          sx={getNavItemSx(theme)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <GridViewIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Dashboard" 
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          />
        </ListItemButton>
      </List>

      <Divider sx={{ my: 2, mx: 2 }} />

      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: theme.palette.text.secondary,
            letterSpacing: '0.08em',
            px: 2,
          }}
        >
          KULLANICI İŞLEMLERİ
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {showUsers && (
          <>
            <ListItemButton
              component={Link}
              to="/users"
              selected={location.pathname === '/users' || (location.pathname.startsWith('/users/') && !location.pathname.startsWith('/users/applications'))}
              onClick={handleLinkClick}
              sx={getNavItemSx(theme)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SupervisorAccountIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Panel Kullanıcıları" 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
            {showPanelUserApplications && (
              <ListItemButton
                component={Link}
                to="/users/applications"
                selected={location.pathname === '/users/applications'}
                onClick={handleLinkClick}
                sx={getNavItemSx(theme)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <BadgeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Panel Kullanıcı Başvuruları" 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            )}
          </>
        )}

        {showRoles && (
          <ListItemButton
            component={Link}
            to="/roles"
            selected={location.pathname.startsWith('/roles')}
            onClick={handleLinkClick}
            sx={getNavItemSx(theme)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Roller" 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}
      </List>

      <Divider sx={{ my: 2, mx: 2 }} />

      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: theme.palette.text.secondary,
            letterSpacing: '0.08em',
            px: 2,
          }}
        >
          ÜYELER
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {showMembers && (
          <>
            {showMemberApplications && (
              <>
                <ListItemButton
                  component={Link}
                  to="/members/applications"
                  selected={location.pathname.startsWith('/members/applications') && !location.pathname.startsWith('/members/waiting')}
                  onClick={handleLinkClick}
                  sx={getNavItemSx(theme)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Üye Başvuruları" 
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
                <ListItemButton
                  component={Link}
                  to="/members/waiting"
                  selected={location.pathname === '/members/waiting'}
                  onClick={handleLinkClick}
                  sx={getNavItemSx(theme)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <BadgeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Üyeler" 
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
              </>
            )}
            <ListItemButton
              component={Link}
              to="/members"
              selected={
                location.pathname === '/members' ||
                (location.pathname.startsWith('/members/') &&
                 !location.pathname.startsWith('/members/applications') &&
                 !location.pathname.startsWith('/members/waiting') &&
                 !location.pathname.startsWith('/members/status') &&
                 /^\/members\/[^/]+$/.test(location.pathname))
              }
              onClick={handleLinkClick}
              sx={getNavItemSx(theme)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <GroupsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Tüm Üyeler" 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </>
        )}
      </List>

      <Divider sx={{ my: 2, mx: 2 }} />

      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: theme.palette.text.secondary,
            letterSpacing: '0.08em',
            px: 2,
          }}
        >
          LOKASYON
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {showRegions && (
          <>
            <ListItemButton
              component={Link}
              to="/regions/provinces"
              selected={location.pathname.startsWith('/regions/provinces')}
              onClick={handleLinkClick}
              sx={getNavItemSx(theme)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LocationCityIcon />
              </ListItemIcon>
              <ListItemText 
                primary="İller & İlçeler" 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
            
            {showBranches && (
              <ListItemButton
                component={Link}
                to="/regions/branches"
                selected={location.pathname.startsWith('/regions/branches')}
                onClick={handleLinkClick}
                sx={getNavItemSx(theme)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Şubeler" 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            )}

            {showInstitutions && (
              <ListItemButton
                component={Link}
                to="/institutions"
                selected={location.pathname.startsWith('/institutions')}
                onClick={handleLinkClick}
                sx={getNavItemSx(theme)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Kurumlar" 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            )}

            {showAccounting && (
              <ListItemButton
                component={Link}
                to="/accounting/tevkifat-centers"
                selected={location.pathname.startsWith('/accounting/tevkifat-centers')}
                onClick={handleLinkClick}
                sx={getNavItemSx(theme)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AccountBalanceIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Tevkifat Merkezleri" 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            )}
          </>
        )}
      </List>

      <Divider sx={{ my: 2, mx: 2 }} />

      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: theme.palette.text.secondary,
            letterSpacing: '0.08em',
            px: 2,
          }}
        >
          İÇERİK & DOKÜMAN
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {showContent && (
          <ListItemButton
            component={Link}
            to="/content"
            selected={location.pathname.startsWith('/content')}
            onClick={handleLinkClick}
            sx={getNavItemSx(theme)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ArticleIcon />
            </ListItemIcon>
            <ListItemText 
              primary="İçerik Yönetimi" 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}

        {showDocuments && (
          <>
            <ListItemButton
              component={Link}
              to="/documents/templates"
              selected={location.pathname.startsWith('/documents/templates')}
              onClick={handleLinkClick}
              sx={getNavItemSx(theme)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Doküman Şablonları" 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
            {hasPermission('DOCUMENT_MEMBER_HISTORY_VIEW') && (
              <ListItemButton
                component={Link}
                to="/documents/members"
                selected={location.pathname.startsWith('/documents/members')}
                onClick={handleLinkClick}
                sx={getNavItemSx(theme)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Üye Doküman Geçmişi" 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            )}
          </>
        )}
      </List>

      <Divider sx={{ my: 2, mx: 2 }} />

      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: theme.palette.text.secondary,
            letterSpacing: '0.08em',
            px: 2,
          }}
        >
          RAPORLAR & BİLDİRİMLER
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {showPayments && (
          <>
            <ListItemButton
              component={Link}
              to="/payments"
              selected={location.pathname === '/payments' || (location.pathname.startsWith('/payments/') && !location.pathname.startsWith('/payments/inquiry') && !location.pathname.startsWith('/payments/quick-entry') && !/^\/payments\/[^/]+$/.test(location.pathname))}
              onClick={handleLinkClick}
              sx={getNavItemSx(theme)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ReceiptLongIcon />
              </ListItemIcon>
              <ListItemText
                primary="Ödeme Sorgulama"
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/payments/inquiry"
              selected={location.pathname === '/payments/inquiry'}
              onClick={handleLinkClick}
              sx={getNavItemSx(theme)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ManageSearchIcon />
              </ListItemIcon>
              <ListItemText
                primary="Özel Ödeme Sorgulama"
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/payments/recent"
              selected={location.pathname === '/payments/recent'}
              onClick={handleLinkClick}
              sx={getNavItemSx(theme)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <HistoryIcon />
              </ListItemIcon>
              <ListItemText
                primary="Son Ödemeler"
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
            {canAddPayment && (
              <ListItemButton
                component={Link}
                to="/payments/quick-entry"
                selected={location.pathname === '/payments/quick-entry'}
                onClick={handleLinkClick}
                sx={getNavItemSx(theme)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CreditCardIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Hızlı Ödeme Girişi"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            )}
          </>
        )}

        {showReports && (
          <ListItemButton
            component={Link}
            to="/reports"
            selected={location.pathname.startsWith('/reports')}
            onClick={handleLinkClick}
            sx={getNavItemSx(theme)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText
              primary="Raporlar"
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}

        {/* Bildirimler - Herkes erişebilir (kendi bildirimlerini görüntülemek için) */}
        <ListItemButton
          component={Link}
          to="/notifications"
          selected={location.pathname.startsWith('/notifications') && !location.pathname.startsWith('/notifications/send')}
          onClick={handleLinkClick}
          sx={getNavItemSx(theme)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <NotificationsActiveIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Bildirimlerim" 
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          />
        </ListItemButton>

        {/* Bildirim Gönder - Yetki gerektirir */}
        {showNotifications && (
          <ListItemButton
            component={Link}
            to="/notifications/send"
            selected={location.pathname === '/notifications/send'}
            onClick={handleLinkClick}
            sx={getNavItemSx(theme)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SendIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Bildirim Gönder" 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}
      </List>

      <Divider sx={{ my: 2, mx: 2 }} />

      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: theme.palette.text.secondary,
            letterSpacing: '0.08em',
            px: 2,
          }}
        >
          SİSTEM
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {showSystemSettings && (
          <ListItemButton
            component={Link}
            to="/system/settings"
            selected={location.pathname.startsWith('/system/settings')}
            onClick={handleLinkClick}
            sx={getNavItemSx(theme)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Sistem Ayarları" 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}

        {showSystemLogs && (
          <ListItemButton
            component={Link}
            to="/system/logs"
            selected={location.pathname.startsWith('/system/logs')}
            onClick={handleLinkClick}
            sx={getNavItemSx(theme)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ListAltIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Sistem Logları" 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}
      </List>

      <Divider sx={{ my: 2, mx: 2 }} />

      <List sx={{ px: 1, pb: 2 }}>
        <ListItemButton
          component={Link}
          to="/members/applications/new"
          selected={location.pathname === '/members/applications/new'}
          onClick={handleLinkClick}
          sx={getNavItemSx(theme, 'success')}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <PersonAddIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Yeni Üye Başvurusu" 
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: theme.palette.success.main,
            }}
          />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backgroundColor: '#ffffff',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop Drawer */
        <Drawer
          variant="persistent"
          open={desktopOpen}
          sx={{
            display: { xs: 'none', md: 'block' },
            width: desktopOpen ? drawerWidth : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backgroundColor: '#ffffff',
              boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
              transition: theme.transitions.create(['transform', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
export { drawerWidth };