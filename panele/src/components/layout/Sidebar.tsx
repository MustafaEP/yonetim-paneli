// src/components/layout/Sidebar.tsx
import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import SummarizeIcon from '@mui/icons-material/Summarize';
import MapIcon from '@mui/icons-material/Map';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const showUsers = hasPermission('USER_LIST');

  const showMembers = hasPermission('MEMBER_LIST');
  const showDuesPlans =
    hasPermission('DUES_PLAN_MANAGE') || hasPermission('DUES_REPORT_VIEW');
  const showDuesDebts = hasPermission('DUES_DEBT_LIST_VIEW');
  const showRegions =
    hasPermission('REGION_LIST') || hasPermission('BRANCH_MANAGE');

  const isActive = (path: string) => location.pathname === path;

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
            selected={location.pathname.startsWith('/members')}
          >
            <ListItemIcon>
              <GroupIcon />
            </ListItemIcon>
            <ListItemText primary="Üyeler" />
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
          <ListItemButton
            component={Link}
            to="/regions"
            selected={location.pathname.startsWith('/regions')}
          >
            <ListItemIcon>
              <MapIcon />
            </ListItemIcon>
            <ListItemText primary="Bölgeler" />
          </ListItemButton>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
export { drawerWidth };
