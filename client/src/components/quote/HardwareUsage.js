import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Box,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon
} from '@mui/icons-material';

function HardwareUsage({ 
  hardwareItems, 
  quoteHardware, 
  setQuoteHardware,
  currencySymbol
}) {
  // Add a new hardware item to the quote
  const addHardwareItem = () => {
    if (hardwareItems.length === 0) return;
    
    const newItem = {
      id: Date.now(), // temporary id for UI
      hardware_id: hardwareItems[0].id,
      hardware_name: hardwareItems[0].name,
      quantity: 1,
      unit_price: hardwareItems[0].unit_price,
      total_cost: hardwareItems[0].unit_price
    };
    
    setQuoteHardware([...quoteHardware, newItem]);
  };

  // Remove a hardware item from the quote
  const removeHardwareItem = (id) => {
    setQuoteHardware(quoteHardware.filter(item => item.id !== id));
  };

  // Handle hardware selection change
  const handleHardwareChange = (id, hardwareId) => {
    const selectedHardware = hardwareItems.find(h => h.id === parseInt(hardwareId));
    if (!selectedHardware) return;
    
    setQuoteHardware(quoteHardware.map(item => {
      if (item.id === id) {
        return {
          ...item,
          hardware_id: selectedHardware.id,
          hardware_name: selectedHardware.name,
          unit_price: selectedHardware.unit_price,
          total_cost: item.quantity * selectedHardware.unit_price
        };
      }
      return item;
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (id, quantity) => {
    const quantityValue = parseInt(quantity) || 0;
    
    setQuoteHardware(quoteHardware.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: quantityValue,
          total_cost: quantityValue * item.unit_price
        };
      }
      return item;
    }));
  };

  // Handle unit price change
  const handlePriceChange = (id, price) => {
    const priceValue = parseFloat(price) || 0;
    
    setQuoteHardware(quoteHardware.map(item => {
      if (item.id === id) {
        return {
          ...item,
          unit_price: priceValue,
          total_cost: item.quantity * priceValue
        };
      }
      return item;
    }));
  };

  // Open hardware link
  const openHardwareLink = (hardwareId) => {
    const hardware = hardwareItems.find(h => h.id === hardwareId);
    if (hardware && hardware.link) {
      window.open(hardware.link, '_blank', 'noopener,noreferrer');
    }
  };

  // Calculate total hardware cost
  const totalHardwareCost = quoteHardware.reduce((sum, item) => sum + item.total_cost, 0);

  // Check if there are any hardware items available
  const noHardwareAvailable = hardwareItems.length === 0;

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Hardware Usage
        </Typography>
        <Button 
          startIcon={<AddIcon />} 
          onClick={addHardwareItem}
          disabled={noHardwareAvailable}
        >
          Add Hardware
        </Button>
      </Box>

      {noHardwareAvailable && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          No hardware items available. Please add hardware items in the Hardware Management section.
        </Typography>
      )}

      {quoteHardware.length === 0 ? (
        <Typography color="text.secondary">
          No hardware items added to this quote.
        </Typography>
      ) : (
        <>
          {quoteHardware.map((item, index) => (
            <Grid container spacing={2} key={item.id} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id={`hardware-label-${item.id}`}>Hardware</InputLabel>
                  <Select
                    labelId={`hardware-label-${item.id}`}
                    value={item.hardware_id}
                    onChange={(e) => handleHardwareChange(item.id, e.target.value)}
                    label="Hardware"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => openHardwareLink(item.hardware_id)}
                          edge="end"
                          disabled={!hardwareItems.find(h => h.id === item.hardware_id)?.link}
                        >
                          <LinkIcon />
                        </IconButton>
                      </InputAdornment>
                    }
                  >
                    {hardwareItems.map((h) => (
                      <MenuItem key={h.id} value={h.id}>
                        {h.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  label="Quantity"
                  type="number"
                  size="small"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Unit Price"
                  type="number"
                  size="small"
                  value={item.unit_price}
                  onChange={(e) => handlePriceChange(item.id, e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ flexGrow: 1 }}>
                  {currencySymbol}{item.total_cost.toFixed(2)}
                </Typography>
                <IconButton 
                  color="error" 
                  onClick={() => removeHardwareItem(item.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Typography variant="subtitle1">
              Total: {currencySymbol}{totalHardwareCost.toFixed(2)}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
}

export default HardwareUsage;
