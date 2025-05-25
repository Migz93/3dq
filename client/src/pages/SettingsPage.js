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
  CircularProgress
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
    accent_color: ''
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
        accent_color: settings.accent_color || '#3498db'
      });
      setLoading(false);
    }
  }, [settings]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Settings
      </Typography>

      <Card sx={{ mb: 4, backgroundColor: 'background.paper' }}>
        <CardHeader title="General Settings" />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
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
                    ) : null,
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
                  helperText="App accent color (requires page refresh to fully apply)"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    sx={{ minWidth: 120 }}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Success message */}
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error: {error}
        </Alert>
      )}
    </Box>
  );
}

export default SettingsPage;
