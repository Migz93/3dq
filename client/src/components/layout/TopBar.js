import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import SidebarContext from '../../context/SidebarContext';

function TopBar() {
  const location = useLocation();
  const { toggleSidebar, isMobile } = useContext(SidebarContext);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
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
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        zIndex: theme.zIndex.drawer + 1 // Ensure AppBar is above drawer
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div" noWrap>
            {getPageTitle()}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
