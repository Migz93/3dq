import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DynamicLogo from '../logo/DynamicLogo';
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

  useTheme,
  useMediaQuery
} from '@mui/material';

import {
  Description as DescriptionIcon,
  Palette as PaletteIcon,
  Print as PrintIcon,
  Hardware as HardwareIcon,
  Settings as SettingsIcon,
  FlashOn as FlashOnIcon,
  Home as HomeIcon
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
      text: 'Home',
      icon: <HomeIcon />,
      path: '/'
    },
    {
      text: 'Quick Cost',
      icon: <FlashOnIcon />,
      path: '/quick-cost'
    },
    {
      text: 'Quotes',
      icon: <DescriptionIcon />,
      path: '/quotes'
    },
    {
      text: 'Filaments',
      icon: <PaletteIcon />,
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
      variant={isSmallScreen ? "temporary" : "persistent"}
      open={open}
      onClose={toggleSidebar}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider'
        },
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DynamicLogo height="40px" />
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
                  backgroundColor: 'rgba(229, 57, 53, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(229, 57, 53, 0.3)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? settings.accent_color || '#E53935' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        </List>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
