import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import { useConfig } from "../context/ConfigContext";
import GroupsIcon from "@mui/icons-material/Groups";

const drawerWidth = 240;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const isAdmin = user?.role === "ADMIN";

  const { config } = useConfig();

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2, mt: 8}}>
        {user && (
          <Typography variant="body2" color="text.secondary">
            {user.name} ({user.role})
          </Typography>
        )}
      </Box>
      <Divider />

      <List>
        <ListItemButton
          selected={location.pathname === "/products"}
          onClick={() => navigate("/products")}
        >
          <ListItemIcon>
            <Inventory2Icon />
          </ListItemIcon>
          <ListItemText primary="Ürünler" />
        </ListItemButton>

        {isAdmin && (
          <ListItemButton
            selected={location.pathname === "/users"}
            onClick={() => navigate("/users")}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Kullanıcılar" />
          </ListItemButton>
        )}

        {isAdmin && (
          <ListItemButton
            selected={location.pathname === "/members"}
            onClick={() => navigate("/members")}
          >
            <ListItemIcon>
              <GroupsIcon />
            </ListItemIcon>
            <ListItemText primary="Üyeler" />
          </ListItemButton>
        )}


        {isAdmin && (
          <ListItemButton
            selected={location.pathname === "/activity"}
            onClick={() => navigate("/activity")}
          >
            <ListItemIcon>
              <ListAltIcon />
            </ListItemIcon>
            <ListItemText primary="Aktivite Geçmişi" />
          </ListItemButton>
        )}

        {/* Profil tüm kullanıcılar için */}
        <ListItemButton
          selected={location.pathname === "/profile"}
          onClick={() => navigate("/profile")}
        >
          <ListItemIcon>
            <AccountCircleIcon />
          </ListItemIcon>
          <ListItemText primary="Profilim" />
        </ListItemButton>

        {isAdmin && (
          <ListItemButton
            selected={location.pathname === "/settings"}
            onClick={() => navigate("/settings")}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Sistem Ayarları" />
          </ListItemButton>
        )}

      </List>


      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 2 }}>
        <ListItemButton onClick={logout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Çıkış Yap" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Üst AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }} // mobilde görünsün
          >
            <MenuIcon />
          </IconButton>
          <DashboardIcon sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap component="div">
            {config.appName !== undefined ? config.appName : "Yönetim Paneli"}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sol Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobil drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* İçerik Alanı */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8, // AppBar yüksekliği kadar boşluk
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
