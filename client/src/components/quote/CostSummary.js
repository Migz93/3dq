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
  totalCost,
  setTotalCost,
  currencySymbol,
  discount = 0
}) {
  const { settings } = useContext(SettingsContext);
  const tax_rate = parseFloat(settings.tax_rate) || 0;
  
  // We no longer need to initialize markup here as it's handled in JobInfo component

  // Calculate totals
  const filamentTotal = quoteFilaments.reduce((sum, f) => sum + f.total_cost, 0);
  const hardwareTotal = quoteHardware.reduce((sum, h) => sum + h.total_cost, 0);
  const powerCost = printSetup.power_cost || 0;
  const depreciationCost = printSetup.depreciation_cost || 0;
  const labourCost = labour.total_cost || 0;
  
  const materialCostsTotal = filamentTotal + hardwareTotal + powerCost + depreciationCost;
  const serviceCostsTotal = labourCost;
  
  const subtotal = materialCostsTotal + serviceCostsTotal;
  const markupAmount = subtotal * (markup / 100);
  const afterMarkup = subtotal + markupAmount;
  const discountAmount = afterMarkup * (discount / 100);
  const afterDiscount = afterMarkup - discountAmount;
  const taxAmount = tax_rate > 0 ? afterDiscount * (tax_rate / 100) : 0;
  const calculatedTotal = afterDiscount + taxAmount;

  // Update total cost when any component changes
  useEffect(() => {
    setTotalCost(calculatedTotal);
  }, [calculatedTotal]);
  


  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Cost Summary
      </Typography>
      
      {/* Main Content - Side by Side Layout */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left Side - Material Costs */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
            Material Costs
          </Typography>
          
          <Grid container spacing={2}>
            {/* Filament */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Filament:</Typography>
                <Typography variant="body2">{currencySymbol}{filamentTotal.toFixed(2)}</Typography>
              </Box>
            </Grid>
            
            {/* Hardware */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Hardware:</Typography>
                <Typography variant="body2">{currencySymbol}{hardwareTotal.toFixed(2)}</Typography>
              </Box>
            </Grid>
            
            {/* Power */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Power:</Typography>
                <Typography variant="body2">{currencySymbol}{powerCost.toFixed(2)}</Typography>
              </Box>
            </Grid>
            
            {/* Depreciation */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Depreciation:</Typography>
                <Typography variant="body2">{currencySymbol}{depreciationCost.toFixed(2)}</Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Material Subtotal */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 1, mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="medium">Material Subtotal:</Typography>
            <Typography variant="subtitle2" fontWeight="medium">{currencySymbol}{materialCostsTotal.toFixed(2)}</Typography>
          </Box>
        </Grid>
        
        {/* Right Side - Labour Costs */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
            Labour Costs
          </Typography>
          
          <Grid container spacing={2}>
            {/* Design */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Design:</Typography>
                <Typography variant="body2">{labour.design_minutes}m</Typography>
              </Box>
            </Grid>
            
            {/* Preparation */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Preparation:</Typography>
                <Typography variant="body2">{labour.preparation_minutes}m</Typography>
              </Box>
            </Grid>
            
            {/* Post Processing */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Post Processing:</Typography>
                <Typography variant="body2">{labour.post_processing_minutes}m</Typography>
              </Box>
            </Grid>
            
            {/* Other */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Other:</Typography>
                <Typography variant="body2">{labour.other_minutes}m</Typography>
              </Box>
            </Grid>
            

          </Grid>
          
          {/* Labour Subtotal */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 1, mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="medium">Labour Subtotal:</Typography>
            <Typography variant="subtitle2" fontWeight="medium">{currencySymbol}{serviceCostsTotal.toFixed(2)}</Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* Totals Section */}
      <Box sx={{ backgroundColor: 'background.default', p: 3, borderRadius: 1, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
          Price Breakdown
        </Typography>
        
        {/* Base Subtotal */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1">Base Subtotal:</Typography>
          <Typography variant="subtitle1">{currencySymbol}{subtotal.toFixed(2)}</Typography>
        </Box>
        
        {/* Markup */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1">Markup ({markup}%):</Typography>
          <Typography variant="subtitle1">+{currencySymbol}{markupAmount.toFixed(2)}</Typography>
        </Box>
        
        {/* After Markup */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pt: 1, borderTop: '1px dashed rgba(0, 0, 0, 0.12)' }}>
          <Typography variant="subtitle1" fontWeight="medium">After Markup:</Typography>
          <Typography variant="subtitle1" fontWeight="medium">{currencySymbol}{afterMarkup.toFixed(2)}</Typography>
        </Box>
        
        {/* Discount - only show if there is a discount */}
        {discount > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Discount ({discount}%):</Typography>
              <Typography variant="subtitle1" color="error">-{currencySymbol}{discountAmount.toFixed(2)}</Typography>
            </Box>
          </>
        )}
        
        {/* After Discount - only show if there is a discount */}
        {discount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pt: 1, borderTop: '1px dashed rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="subtitle1" fontWeight="medium">After Discount:</Typography>
            <Typography variant="subtitle1" fontWeight="medium">{currencySymbol}{afterDiscount.toFixed(2)}</Typography>
          </Box>
        )}
        
        {/* Tax - only show if tax rate is greater than 0 */}
        {tax_rate > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Tax ({tax_rate}%):</Typography>
              <Typography variant="subtitle1">+{currencySymbol}{taxAmount.toFixed(2)}</Typography>
            </Box>
          </>
        )}
        
        {/* Final Total */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mt: 2, 
          pt: 2,
          borderTop: 1, 
          borderColor: 'divider'
        }}>
          <Typography variant="h6" fontWeight="bold">Final Total:</Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {currencySymbol}{totalCost.toFixed(2)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default CostSummary;
