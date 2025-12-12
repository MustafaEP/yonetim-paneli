// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Collapse,
  Box,
  Typography,
  useTheme,
  alpha,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MapIcon from '@mui/icons-material/Map';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 260;

interface SidebarProps {
  mobileOpen?: boolean;
  onDrawerToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onDrawerToggle }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPermission } = useAuth();
  
  const showUsers = hasPermission('USER_LIST');
  const showMembers = hasPermission('MEMBER_LIST');
  const showMemberApplications =
    hasPermission('MEMBER_APPROVE') ||
    hasPermission('MEMBER_REJECT') ||
    hasPermission('MEMBER_LIST');
  const showDuesPlans =
    hasPermission('DUES_PLAN_MANAGE') || hasPermission('DUES_REPORT_VIEW');
  const showDuesDebts = hasPermission('DUES_DEBT_LIST_VIEW');
  const showDuesMonthlyReport = hasPermission('DUES_REPORT_VIEW');
  const showRegions =
    hasPermission('REGION_LIST') || hasPermission('BRANCH_MANAGE');
  const showRoles = hasPermission('ROLE_LIST');

  const isActive = (path: string) => location.pathname === path;
  const isRegionsActive = location.pathname.startsWith('/regions');
  const [regionsOpen, setRegionsOpen] = useState(isRegionsActive);

  const handleRegionsClick = () => {
    setRegionsOpen(!regionsOpen);
  };

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
          sx={{
            borderRadius: 2,
            mb: 0.5,
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
              },
              '& .MuiListItemIcon-root': {
                color: theme.palette.primary.main,
              },
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.04),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Dashboard" 
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          />
        </ListItemButton>

        {showMembers && (
          <ListItemButton
            component={Link}
            to="/members"
            selected={
              location.pathname.startsWith('/members') &&
              !location.pathname.startsWith('/members/applications')
            }
            onClick={handleLinkClick}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.04),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <GroupIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Üyeler" 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}

        {showMemberApplications && (
          <ListItemButton
            component={Link}
            to="/members/applications"
            selected={location.pathname.startsWith('/members/applications')}
            onClick={handleLinkClick}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.04),
              },
            }}
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
        )}

        {showMembers && (
          <>
            <ListItemButton
              component={Link}
              to="/members/rejected"
              selected={location.pathname === '/members/rejected'}
              onClick={handleLinkClick}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.12),
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.error.main,
                  },
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.04),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <CancelIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Reddedilen Üyeler" 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/members/cancelled"
              selected={location.pathname === '/members/cancelled'}
              onClick={handleLinkClick}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.warning.main, 0.08),
                  color: theme.palette.warning.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.warning.main, 0.12),
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.warning.main,
                  },
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.04),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BlockIcon />
              </ListItemIcon>
              <ListItemText 
                primary="İptal Edilen Üyeler" 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </>
        )}

        {showUsers && (
          <ListItemButton
            component={Link}
            to="/users"
            selected={location.pathname.startsWith('/users')}
            onClick={handleLinkClick}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.04),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Kullanıcılar" 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}

        {showRoles && (
          <ListItemButton
            component={Link}
            to="/roles"
            selected={location.pathname.startsWith('/roles')}
            onClick={handleLinkClick}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.04),
              },
            }}
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
          FİNANSAL
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {showDuesPlans && (
          <ListItemButton
            component={Link}
            to="/dues/plans"
            selected={location.pathname.startsWith('/dues/plans')}
            onClick={handleLinkClick}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.04),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PaymentIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Aidat Planları" 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}

        {showDuesDebts && (
          <ListItemButton
            component={Link}
            to="/dues/debts"
            selected={location.pathname.startsWith('/dues/debts')}
            onClick={handleLinkClick}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.04),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SummarizeIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Borçlu Üyeler" 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        )}

        {showDuesMonthlyReport && (
          <ListItemButton
            component={Link}
            to="/dues/monthly-report"
            selected={location.pathname.startsWith('/dues/monthly-report')}
            onClick={handleLinkClick}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.04),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <TrendingUpIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Aylık Tahsilat Raporu" 
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
          LOKASYON
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {showRegions && (
          <>
            <ListItemButton
              onClick={handleRegionsClick}
              selected={isRegionsActive}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.04),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <MapIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Bölgeler" 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              />
              {regionsOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            
            <Collapse in={regionsOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  component={Link}
                  to="/regions/provinces"
                  selected={location.pathname.startsWith('/regions/provinces')}
                  onClick={handleLinkClick}
                  sx={{
                    pl: 4,
                    borderRadius: 2,
                    mb: 0.5,
                    ml: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LocationCityIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="İller" 
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
                
                <ListItemButton
                  component={Link}
                  to="/regions/districts"
                  selected={location.pathname.startsWith('/regions/districts')}
                  onClick={handleLinkClick}
                  sx={{
                    pl: 4,
                    borderRadius: 2,
                    mb: 0.5,
                    ml: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LocationCityIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="İlçeler" 
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
                
                <ListItemButton
                  component={Link}
                  to="/regions/workplaces"
                  selected={location.pathname.startsWith('/regions/workplaces')}
                  onClick={handleLinkClick}
                  sx={{
                    pl: 4,
                    borderRadius: 2,
                    mb: 0.5,
                    ml: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <BusinessIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="İş Yeri" 
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
                
                <ListItemButton
                  component={Link}
                  to="/regions/dealers"
                  selected={location.pathname.startsWith('/regions/dealers')}
                  onClick={handleLinkClick}
                  sx={{
                    pl: 4,
                    borderRadius: 2,
                    mb: 0.5,
                    ml: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.04),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <StoreIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Bayiler" 
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}
      </List>

      <Divider sx={{ my: 2, mx: 2 }} />

      <List sx={{ px: 1, pb: 2 }}>
        <ListItemButton
          component={Link}
          to="/members/applications/new"
          selected={location.pathname === '/members/applications/new'}
          onClick={handleLinkClick}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            backgroundColor: alpha(theme.palette.success.main, 0.08),
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.success.main, 0.12),
              color: theme.palette.success.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.success.main, 0.16),
              },
              '& .MuiListItemIcon-root': {
                color: theme.palette.success.main,
              },
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.success.main, 0.12),
            },
            '& .MuiListItemIcon-root': {
              color: theme.palette.success.main,
            },
          }}
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
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backgroundColor: '#ffffff',
              boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
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