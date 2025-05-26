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
  Divider,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

function FilamentUsage({ 
  filaments, 
  quoteFilaments, 
  setQuoteFilaments, 
  currencySymbol
}) {
  // Add a new filament to the quote
  const addFilament = () => {
    if (filaments.length === 0) return;
    
    const newFilament = {
      id: Date.now(), // temporary id for UI
      filament_id: filaments[0].id,
      filament_name: filaments[0].name,
      filament_price_per_gram: filaments[0].price_per_kg / 1000,
      grams_used: 0,
      total_cost: 0
    };
    
    setQuoteFilaments([...quoteFilaments, newFilament]);
  };

  // Remove a filament from the quote
  const removeFilament = (id) => {
    setQuoteFilaments(quoteFilaments.filter(f => f.id !== id));
  };

  // Handle filament selection change
  const handleFilamentChange = (id, filamentId) => {
    const selectedFilament = filaments.find(f => f.id === parseInt(filamentId));
    if (!selectedFilament) return;
    
    setQuoteFilaments(quoteFilaments.map(f => {
      if (f.id === id) {
        const pricePerGram = selectedFilament.price_per_kg / 1000;
        return {
          ...f,
          filament_id: selectedFilament.id,
          filament_name: selectedFilament.name,
          filament_price_per_gram: pricePerGram,
          total_cost: f.grams_used * pricePerGram
        };
      }
      return f;
    }));
  };

  // Handle weight change
  const handleWeightChange = (id, weight) => {
    const weightValue = parseFloat(weight) || 0;
    
    setQuoteFilaments(quoteFilaments.map(f => {
      if (f.id === id) {
        return {
          ...f,
          grams_used: weightValue,
          total_cost: weightValue * f.filament_price_per_gram
        };
      }
      return f;
    }));
  };

  // Handle price per gram change
  const handlePriceChange = (id, price) => {
    const priceValue = parseFloat(price) || 0;
    
    setQuoteFilaments(quoteFilaments.map(f => {
      if (f.id === id) {
        return {
          ...f,
          filament_price_per_gram: priceValue,
          total_cost: f.grams_used * priceValue
        };
      }
      return f;
    }));
  };

  // Ensure we always have at least one filament
  React.useEffect(() => {
    if (quoteFilaments.length === 0 && filaments.length > 0) {
      addFilament();
    }
  }, [quoteFilaments.length, filaments.length]);

  // Calculate total filament cost
  const totalFilamentCost = quoteFilaments.reduce((sum, f) => sum + f.total_cost, 0);

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Filament Usage
        </Typography>
      </Box>

      {
        // Multi-material mode
        <>
          {quoteFilaments.map((filament, index) => (
            <Grid container spacing={2} key={filament.id} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id={`filament-label-${filament.id}`}>Filament</InputLabel>
                  <Select
                    labelId={`filament-label-${filament.id}`}
                    value={filament.filament_id}
                    onChange={(e) => handleFilamentChange(filament.id, e.target.value)}
                    label="Filament"
                  >
                    {filaments.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Weight"
                  type="number"
                  size="small"
                  value={filament.grams_used}
                  onChange={(e) => handleWeightChange(filament.id, e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">g</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Price per gram"
                  type="number"
                  size="small"
                  value={filament.filament_price_per_gram}
                  onChange={(e) => handlePriceChange(filament.id, e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ flexGrow: 1 }}>
                  {currencySymbol}{filament.total_cost.toFixed(2)}
                </Typography>
                <IconButton 
                  color="error" 
                  onClick={() => removeFilament(filament.id)}
                  disabled={quoteFilaments.length <= 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button 
              startIcon={<AddIcon />} 
              onClick={addFilament}
              disabled={filaments.length === 0}
            >
              Add Filament
            </Button>
            <Typography variant="subtitle1">
              Total: {currencySymbol}{totalFilamentCost.toFixed(2)}
            </Typography>
          </Box>
        </>
      }
    </Paper>
  );
}



export default FilamentUsage;
