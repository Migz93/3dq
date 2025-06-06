import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';


// Layout components
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';

// Page components
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import FilamentPage from './pages/FilamentPage';
import PrinterPage from './pages/PrinterPage';
import HardwarePage from './pages/HardwarePage';
import SettingsPage from './pages/SettingsPage';
import QuoteBuilder from './pages/QuoteBuilder';
import QuickCost from './pages/QuickCost';
import ViewQuote from './pages/ViewQuote';

// Context
import { SettingsProvider } from './context/SettingsContext';
import { SidebarProvider } from './context/SidebarContext';

function App() {
  const [settings, setSettings] = useState({
    electricity_cost_per_kwh: 0.2166,
    labour_rate_per_hour: 13.00,
    default_markup_percent: 50,
    currency_symbol: '£',
    quote_prefix: '3DQ',
    accent_color: '#E53935'
  });

  // Create theme with dark mode and accent color from settings
  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: settings.accent_color || '#E53935',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
          },
        },
      },
    },
  });

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <SettingsProvider value={{ settings, setSettings }}>
        <SidebarProvider>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', height: '100vh' }}>
            <Sidebar />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                transition: theme.transitions.create('margin', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
              }}
            >
              <TopBar />
              <Box sx={{ p: 3, flexGrow: 1 }}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/quotes" element={<Dashboard />} />
                  <Route path="/filaments" element={<FilamentPage />} />
                  <Route path="/printers" element={<PrinterPage />} />
                  <Route path="/hardware" element={<HardwarePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/quote/new" element={<QuoteBuilder />} />
                  <Route path="/quote/edit/:id" element={<QuoteBuilder />} />
                  <Route path="/quick-cost" element={<QuickCost />} />
                  <Route path="/quote/:id" element={<ViewQuote />} />
                </Routes>
              </Box>
            </Box>
          </Box>
        </Router>
        </SidebarProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
