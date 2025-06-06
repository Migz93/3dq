import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  Divider
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Palette as PaletteIcon,
  Print as PrintIcon,
  Hardware as HardwareIcon,
  Settings as SettingsIcon,
  FlashOn as FlashOnIcon
} from '@mui/icons-material';
import SettingsContext from '../context/SettingsContext';

function HomePage() {
  const [counts, setCounts] = useState({
    quotes: 0,
    filaments: 0,
    printers: 0,
    hardware: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);

  // Fetch counts from API
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch quotes count
        const quotesResponse = await fetch('/api/counts/quotes');
        const quotesData = await quotesResponse.json();
        
        // Fetch filaments count
        const filamentsResponse = await fetch('/api/counts/filaments');
        const filamentsData = await filamentsResponse.json();
        
        // Fetch printers count
        const printersResponse = await fetch('/api/counts/printers');
        const printersData = await printersResponse.json();
        
        // Fetch hardware count
        const hardwareResponse = await fetch('/api/counts/hardware');
        const hardwareData = await hardwareResponse.json();
        
        // Log the count values for debugging
        console.log('Count values:', { 
          quotes: quotesData.count, 
          filaments: filamentsData.count, 
          printers: printersData.count, 
          hardware: hardwareData.count 
        });
        
        setCounts({
          quotes: quotesData.count || 0,
          filaments: filamentsData.count || 0,
          printers: printersData.count || 0,
          hardware: hardwareData.count || 0
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching counts:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  // Navigation handlers
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Main card data
  const mainCards = [
    {
      title: 'Quotes',
      icon: <DescriptionIcon sx={{ fontSize: 60, color: settings.accent_color || '#E53935' }} />,
      count: counts.quotes,
      path: '/quotes',
      description: 'Manage your quotes and create new ones'
    },
    {
      title: 'Filaments',
      icon: <PaletteIcon sx={{ fontSize: 60, color: settings.accent_color || '#E53935' }} />,
      count: counts.filaments,
      path: '/filaments',
      description: 'View and manage your filament inventory'
    },
    {
      title: 'Printers',
      icon: <PrintIcon sx={{ fontSize: 60, color: settings.accent_color || '#E53935' }} />,
      count: counts.printers,
      path: '/printers',
      description: 'Configure your 3D printers'
    },
    {
      title: 'Hardware',
      icon: <HardwareIcon sx={{ fontSize: 60, color: settings.accent_color || '#E53935' }} />,
      count: counts.hardware,
      path: '/hardware',
      description: 'Manage additional hardware components'
    }
  ];
  
  // Secondary card data
  const secondaryCards = [
    {
      title: 'Quick Cost',
      icon: <FlashOnIcon sx={{ fontSize: 40, color: settings.accent_color || '#E53935' }} />,
      path: '/quick-cost',
      description: 'Generate quick cost estimates'
    },
    {
      title: 'Settings',
      icon: <SettingsIcon sx={{ fontSize: 40, color: settings.accent_color || '#E53935' }} />,
      path: '/settings',
      description: 'Configure application settings'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Welcome to 3DQ - Your 3D Print Quoting Tool
        </Typography>
      </Box>

      {/* Main navigation cards */}
      <Grid container spacing={4} sx={{ mb: 3 }}>
        {mainCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleNavigate(card.path)}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}
              >
                <Box sx={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  {card.icon}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: -5, 
                      right: 5, 
                      backgroundColor: settings.accent_color || '#E53935',
                      color: 'white',
                      borderRadius: '50%',
                      width: 30,
                      height: 30,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      zIndex: 1,
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {card.count !== undefined ? card.count : '?'}
                  </Box>
                </Box>
                <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {card.description}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Secondary navigation cards */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {secondaryCards.map((card) => (
          <Grid item xs={12} sm={6} key={card.title}>
            <Card 
              sx={{ 
                height: '120px', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleNavigate(card.path)}
                sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'flex-start',
                  p: 2 
                }}
              >
                <Box sx={{ mr: 3 }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h6" component="div">
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default HomePage;
