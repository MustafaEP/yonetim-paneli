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
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import SummarizeIcon from '@mui/icons-material/Summarize';
import MapIcon from '@mui/icons-material/Map';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
  const location = useLocation();
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
  const showRegions =
    hasPermission('REGION_LIST') || hasPermission('BRANCH_MANAGE');

  const isActive = (path: string) => location.pathname === path;
  const isRegionsActive = location.pathname.startsWith('/regions');
  const [regionsOpen, setRegionsOpen] = useState(isRegionsActive);

  const handleRegionsClick = () => {
    setRegionsOpen(!regionsOpen);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Divider />
      <List>
        <ListItemButton
          component={Link}
          to="/"
          selected={isActive('/') || isActive('/dashboard')}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {showMembers && (
          <ListItemButton
            component={Link}
            to="/members"
            selected={
              location.pathname.startsWith('/members') &&
              !location.pathname.startsWith('/members/applications')
            }
          >
            <ListItemIcon>
              <GroupIcon />
            </ListItemIcon>
            <ListItemText primary="Üyeler" />
          </ListItemButton>
        )}
        {showMemberApplications && (
          <ListItemButton
            component={Link}
            to="/members/applications"
            selected={location.pathname.startsWith('/members/applications')}
          >
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Üye Başvuruları" />
          </ListItemButton>
        )}
        {showUsers && (
          <ListItemButton
            component={Link}
            to="/users"
            selected={location.pathname.startsWith('/users')}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Kullanıcılar" />
          </ListItemButton>
        )}


        {showDuesPlans && (
          <ListItemButton
            component={Link}
            to="/dues/plans"
            selected={location.pathname.startsWith('/dues/plans')}
          >
            <ListItemIcon>
              <PaymentIcon />
            </ListItemIcon>
            <ListItemText primary="Aidat Planları" />
          </ListItemButton>
        )}

        {showDuesDebts && (
          <ListItemButton
            component={Link}
            to="/dues/debts"
            selected={location.pathname.startsWith('/dues/debts')}
          >
            <ListItemIcon>
              <SummarizeIcon />
            </ListItemIcon>
            <ListItemText primary="Borçlu Üyeler" />
          </ListItemButton>
        )}

        {showRegions && (
          <>
            <ListItemButton
              onClick={handleRegionsClick}
              selected={isRegionsActive}
            >
              <ListItemIcon>
                <MapIcon />
              </ListItemIcon>
              <ListItemText primary="Bölgeler" />
              {regionsOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={regionsOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  component={Link}
                  to="/regions/provinces"
                  selected={location.pathname.startsWith('/regions/provinces')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <LocationCityIcon />
                  </ListItemIcon>
                  <ListItemText primary="İller" />
                </ListItemButton>
                <ListItemButton
                  component={Link}
                  to="/regions/districts"
                  selected={location.pathname.startsWith('/regions/districts')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <LocationCityIcon />
                  </ListItemIcon>
                  <ListItemText primary="İlçeler" />
                </ListItemButton>
                <ListItemButton
                  component={Link}
                  to="/regions/workplaces"
                  selected={location.pathname.startsWith('/regions/workplaces')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText primary="İş Yeri" />
                </ListItemButton>
                <ListItemButton
                  component={Link}
                  to="/regions/dealers"
                  selected={location.pathname.startsWith('/regions/dealers')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <StoreIcon />
                  </ListItemIcon>
                  <ListItemText primary="Bayiler" />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}

        <ListItemButton
          component={Link}
          to="/members/applications/new"
          selected={location.pathname === '/members/applications/new'}
        >
          <ListItemIcon>
            <PersonAddIcon />
          </ListItemIcon>
          <ListItemText primary="Yeni Üye Başvurusu" />
        </ListItemButton>

      </List>
    </Drawer>
  );
};

export default Sidebar;
export { drawerWidth };
