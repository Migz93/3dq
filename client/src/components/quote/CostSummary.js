import React, { useContext, useEffect } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  Divider,
  Box
} from '@mui/material';
import SettingsContext from '../../context/SettingsContext';

function CostSummary({ 
  quoteFilaments,
  quoteHardware,
  printSetup,
  labour,
  markup,
  setMarkup,
  totalCost,
  setTotalCost,
  currencySymbol
}) {
  const { settings } = useContext(SettingsContext);
  
  // Initialize markup from settings
  useEffect(() => {
    if (settings.default_markup_percent && markup === 0) {
      setMarkup(parseFloat(settings.default_markup_percent));
    }
  }, [settings.default_markup_percent]);

  // Calculate totals
  const filamentTotal = quoteFilaments.reduce((sum, f) => sum + f.total_cost, 0);
  const hardwareTotal = quoteHardware.reduce((sum, h) => sum + h.total_cost, 0);
  const powerCost = printSetup.power_cost || 0;
  const depreciationCost = printSetup.depreciation_cost || 0;
  const labourCost = labour.total_cost || 0;
  
  const subtotal = filamentTotal + hardwareTotal + powerCost + depreciationCost + labourCost;
  const markupAmount = subtotal * (markup / 100);
  const calculatedTotal = subtotal + markupAmount;

  // Update total cost when any component changes
  useEffect(() => {
    setTotalCost(calculatedTotal);
  }, [calculatedTotal]);

  // Handle markup change
  const handleMarkupChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setMarkup(value);
  };

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>
        Cost Summary
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1" gutterBottom>
            Filament Cost: {currencySymbol}{filamentTotal.toFixed(2)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Hardware Cost: {currencySymbol}{hardwareTotal.toFixed(2)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Power Cost: {currencySymbol}{powerCost.toFixed(2)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Depreciation: {currencySymbol}{depreciationCost.toFixed(2)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Labour Cost: {currencySymbol}{labourCost.toFixed(2)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1" gutterBottom>
            Subtotal: {currencySymbol}{subtotal.toFixed(2)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Markup:
            </Typography>
            <TextField
              type="number"
              value={markup}
              onChange={handleMarkupChange}
              size="small"
              sx={{ width: 100 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { min: 0 }
              }}
            />
          </Box>
          <Typography variant="body1" gutterBottom>
            Markup Amount: {currencySymbol}{markupAmount.toFixed(2)}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Total: {currencySymbol}{totalCost.toFixed(2)}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default CostSummary;
