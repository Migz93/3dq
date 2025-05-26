import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Print as PrintIcon,
  Hardware as HardwareIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import SettingsContext from '../../context/SettingsContext';
import SidebarContext from '../../context/SidebarContext';

// Sidebar width
const drawerWidth = 240;
const closedDrawerWidth = 0;

function Sidebar() {
  const location = useLocation();
  const { settings } = useContext(SettingsContext);
  const { open, toggleSidebar, isMobile } = useContext(SidebarContext);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Define sidebar menu items
  const menuItems = [
    {
      text: 'Quotes',
      icon: <DashboardIcon />,
      path: '/'
    },
    {
      text: 'Filament',
      icon: <InventoryIcon />,
      path: '/filaments'
    },
    {
      text: 'Printers',
      icon: <PrintIcon />,
      path: '/printers'
    },
    {
      text: 'Hardware',
      icon: <HardwareIcon />,
      path: '/hardware'
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings'
    }
  ];

  return (
    <Drawer
      variant={isSmallScreen ? "temporary" : "permanent"}
      open={open}
      onClose={toggleSidebar}
      sx={{
        width: open ? drawerWidth : closedDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e1e1e',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: settings.accent_color || '#3498db' }}>
          3DQ
        </Typography>
        {isSmallScreen && (
          <IconButton onClick={toggleSidebar} sx={{ color: 'white' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(52, 152, 219, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(52, 152, 219, 0.3)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? settings.accent_color || '#3498db' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;
