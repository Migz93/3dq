import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import SettingsContext from '../context/SettingsContext';

function SettingsPage() {
  const { settings, setSettings } = useContext(SettingsContext);
  const [formData, setFormData] = useState({
    electricity_cost_per_kwh: '',
    labour_rate_per_hour: '',
    default_markup_percent: '',
    currency_symbol: '',
    quote_prefix: '',
    accent_color: '',
    company_name: '',
    spoolman_sync_enabled: 'false',
    spoolman_url: 'http://localhost:7912',
    tax_rate: '0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load settings from context
  useEffect(() => {
    if (settings) {
      setFormData({
        electricity_cost_per_kwh: settings.electricity_cost_per_kwh || '',
        labour_rate_per_hour: settings.labour_rate_per_hour || '',
        default_markup_percent: settings.default_markup_percent || '',
        currency_symbol: settings.currency_symbol || '',
        quote_prefix: settings.quote_prefix || '',
        accent_color: settings.accent_color || '#E53935',
        company_name: settings.company_name || 'Prints Inc',
        spoolman_sync_enabled: settings.spoolman_sync_enabled || 'false',
        spoolman_url: settings.spoolman_url || 'http://localhost:7912',
        tax_rate: settings.tax_rate || '0'
      });
      setLoading(false);
    }
  }, [settings]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle switch change
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked.toString() });
  };
  
  // Test Spoolman connection
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  const testSpoolmanConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const response = await fetch('/api/spoolman/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.spoolman_url }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setConnectionStatus({ success: true, message: data.message });
      } else {
        setConnectionStatus({ success: false, message: data.error || 'Failed to connect to Spoolman' });
      }
    } catch (error) {
      console.error('Error testing Spoolman connection:', error);
      setConnectionStatus({ success: false, message: error.message });
    } finally {
      setTestingConnection(false);
    }
  };
  
  // Sync spools from Spoolman
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  
  const syncSpoolmanSpools = async () => {
    setSyncing(true);
    setSyncStatus(null);
    
    try {
      const response = await fetch('/api/spoolman/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSyncStatus({ 
          success: true, 
          message: `${data.message}. Added: ${data.added}, Updated: ${data.updated}` 
        });
      } else {
        setSyncStatus({ success: false, message: data.error || 'Failed to sync spools from Spoolman' });
      }
    } catch (error) {
      console.error('Error syncing spools from Spoolman:', error);
      setSyncStatus({ success: false, message: error.message });
    } finally {
      setSyncing(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      const data = await response.json();
      
      // Update settings in context
      setSettings(data);
      setSuccess(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Close success alert
  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Box>

      <Card sx={{ mb: 4, backgroundColor: 'background.paper' }}>
        <CardHeader title="General Settings" />
        <CardContent>
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="electricity_cost_per_kwh"
                  label="Electricity Cost per kWh"
                  type="number"
                  value={formData.electricity_cost_per_kwh}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: formData.currency_symbol ? (
                      <InputAdornment position="start">{formData.currency_symbol}</InputAdornment>
                    ) : null,
                  }}
                  helperText="Cost per kilowatt-hour of electricity"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="labour_rate_per_hour"
                  label="Labour Rate per Hour"
                  type="number"
                  value={formData.labour_rate_per_hour}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: formData.currency_symbol ? (
                      <InputAdornment position="start">{formData.currency_symbol}</InputAdornment>
                    ) : null
                  }}
                  helperText="Hourly rate used to calculate labour costs"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="default_markup_percent"
                  label="Default Markup Percentage"
                  type="number"
                  value={formData.default_markup_percent}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  helperText="Default markup percentage applied to quotes"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="tax_rate"
                  label="Tax Rate"
                  type="number"
                  value={formData.tax_rate}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  helperText="Tax rate applied to quotes and invoices (0 = no tax)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="currency_symbol"
                  label="Currency Symbol"
                  value={formData.currency_symbol}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  helperText="Symbol used for all monetary values (e.g., £, $, €)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="company_name"
                  label="Company Name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  helperText="Your company name (appears on invoices)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="quote_prefix"
                  label="Quote Prefix"
                  value={formData.quote_prefix}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  helperText="Prefix used for quote numbers (e.g., 3DQ0001)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <TextField
                      name="accent_color"
                      label="Accent Color"
                      type="color"
                      value={formData.accent_color}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      sx={{
                        '& input': {
                          height: 40,
                          cursor: 'pointer'
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          accent_color: '#E53935'
                        });
                      }}
                      sx={{ mt: 1 }}
                    >
                      Reset
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    App accent color (requires page refresh to fully apply)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4, backgroundColor: 'background.paper' }}>
        <CardHeader title="Spoolman Integration" />
        <CardContent>
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="spoolman_sync_enabled"
                      checked={formData.spoolman_sync_enabled === 'true'}
                      onChange={handleSwitchChange}
                      color="primary"
                    />
                  }
                  label="Sync Filament With Spoolman Spools"
                />
              </Grid>
              
              <Grid item xs={12} container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <TextField
                    name="spoolman_url"
                    label="Spoolman URL"
                    value={formData.spoolman_url}
                    onChange={handleInputChange}
                    fullWidth
                    required={formData.spoolman_sync_enabled === 'true'}
                    helperText="URL to your Spoolman instance (e.g., http://localhost:7912)"
                    disabled={formData.spoolman_sync_enabled !== 'true'}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  {/* Save button moved to the top of the page */}
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={testSpoolmanConnection}
                  disabled={testingConnection || !formData.spoolman_url || formData.spoolman_sync_enabled !== 'true'}
                  sx={{ mt: 1 }}
                >
                  {testingConnection ? <CircularProgress size={24} /> : 'Test Connection'}
                </Button>
                
                {connectionStatus && (
                  <Alert 
                    severity={connectionStatus.success ? "success" : "error"}
                    sx={{ mt: 1 }}
                  >
                    {connectionStatus.message}
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error: {error}
        </Alert>
      )}
    </Box>
  );
}

export default SettingsPage;
