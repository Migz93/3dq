import React, { useState, useEffect, useContext } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import SettingsContext from '../../context/SettingsContext';

function JobInfo({ formData, handleInputChange, isEditMode }) {
  const { settings } = useContext(SettingsContext);
  const [nextQuoteNumber, setNextQuoteNumber] = useState('');
  const [loading, setLoading] = useState(!isEditMode);

  // Fetch next quote number when component mounts (only for new quotes)
  useEffect(() => {
    if (!isEditMode) {
      const fetchNextQuoteNumber = async () => {
        try {
          const response = await fetch('/api/settings/quote/next-number');
          if (!response.ok) {
            throw new Error('Failed to fetch next quote number');
          }
          const data = await response.json();
          setNextQuoteNumber(data.quote_number);
          // Initialize the quote_number field in formData if it's not already set
          if (!formData.quote_number) {
            handleInputChange({
              target: {
                name: 'quote_number',
                value: data.quote_number
              }
            });
          }
          setLoading(false);
        } catch (error) {
          console.error('Error fetching next quote number:', error);
          setLoading(false);
        }
      };

      fetchNextQuoteNumber();
    }
  }, [isEditMode, handleInputChange, formData.quote_number]);
  
  // Initialize markup from settings if not set
  useEffect(() => {
    if (settings?.default_markup_percent && !formData.markup) {
      handleInputChange({
        target: {
          name: 'markup',
          value: parseFloat(settings.default_markup_percent)
        }
      });
    }
    
    // Initialize quantity to 1 if not set
    if (!formData.quantity) {
      handleInputChange({
        target: {
          name: 'quantity',
          value: 1
        }
      });
    }
  }, [settings, formData.markup, formData.quantity, handleInputChange]);
  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>
        Job Information
      </Typography>
      {loading ? (
        <CircularProgress sx={{ my: 4, mx: 'auto', display: 'block' }} />
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="quote_number"
              label="Quote Number"
              value={formData.quote_number || nextQuoteNumber}
              onChange={handleInputChange}
              fullWidth
              required
              disabled={isEditMode} // Can't change quote number in edit mode
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="customer_name"
              label="Customer Name"
              value={formData.customer_name}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="title"
              label="Model Name"
              value={formData.title}
              onChange={handleInputChange}
              fullWidth
              required
              placeholder="Name of the 3D model"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="date"
              label="Date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="notes"
              label="Notes (optional)"
              value={formData.notes}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          
          {/* Pricing Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'medium' }}>
              Pricing Options
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="markup"
              label="Markup Percentage"
              type="number"
              value={formData.markup || ''}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { min: 0 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="discount"
              label="Discount Percentage"
              type="number"
              value={formData.discount || 0}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { min: 0, max: 100 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="quantity"
              label="Quantity"
              type="number"
              value={formData.quantity || 1}
              onChange={handleInputChange}
              fullWidth
              required
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}

export default JobInfo;
