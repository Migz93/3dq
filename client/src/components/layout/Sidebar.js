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
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Print as PrintIcon,
  Hardware as HardwareIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import SettingsContext from '../../context/SettingsContext';

// Sidebar width
const drawerWidth = 240;

function Sidebar() {
  const location = useLocation();
  const { settings } = useContext(SettingsContext);
  
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
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e1e1e',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)'
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: settings.accent_color || '#3498db' }}>
          3DQ
        </Typography>
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
