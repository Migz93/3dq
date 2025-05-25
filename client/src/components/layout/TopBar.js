import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box
} from '@mui/material';

function TopBar() {
  const location = useLocation();
  
  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Quotes';
      case '/filaments':
        return 'Filament Management';
      case '/printers':
        return 'Printer Management';
      case '/hardware':
        return 'Hardware Management';
      case '/settings':
        return 'Settings';
      case '/quote/new':
        return 'New Quote';
      case '/quote/quick':
        return 'Quick Quote';
      default:
        if (location.pathname.startsWith('/quote/')) {
          return 'View Quote';
        }
        return '3DQ';
    }
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        backgroundColor: 'background.paper',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div">
            {getPageTitle()}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
