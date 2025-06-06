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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';

import SettingsContext from '../context/SettingsContext';
import TimeInput from '../components/common/TimeInput';

function QuickCost() { // Renamed from QuickQuote
  const { settings } = useContext(SettingsContext);
  const [filaments, setFilaments] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [quoteResult, setQuoteResult] = useState(null);


  // Form state
  const [formData, setFormData] = useState({
    filament_id: '',
    weight_grams: 0,
    print_time: 0,
    printer_id: ''
  });

  // Fetch filaments and printers from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active filaments
        const filamentsResponse = await fetch('/api/filaments/active');
        if (!filamentsResponse.ok) {
          throw new Error('Failed to fetch filaments');
        }
        const filamentsData = await filamentsResponse.json();
        setFilaments(filamentsData);

        // Fetch active printers
        const printersResponse = await fetch('/api/printers/active');
        if (!printersResponse.ok) {
          throw new Error('Failed to fetch printers');
        }
        const printersData = await printersResponse.json();
        setPrinters(printersData);

        setLoading(false);

        // Auto-select first filament and printer if available
        if (filamentsData.length > 0) {
          setFormData(prev => ({ ...prev, filament_id: filamentsData[0].id }));
        }
        if (printersData.length > 0) {
          setFormData(prev => ({ ...prev, printer_id: printersData[0].id }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear quote result when inputs change
    setQuoteResult(null);
  };

  // Calculate quote
  const calculateQuote = () => {
    setCalculating(true);
    setError(null);
    setQuoteResult(null);

    try {
      // Find selected filament and printer
      const selectedFilament = filaments.find(f => f.id === parseInt(formData.filament_id));
      const selectedPrinter = printers.find(p => p.id === parseInt(formData.printer_id));

      if (!selectedFilament || !selectedPrinter) {
        throw new Error('Please select both filament and printer');
      }

      const weightGrams = parseFloat(formData.weight_grams) || 0;
      const printTimeMinutes = parseInt(formData.print_time) || 0;
      const printTimeHours = printTimeMinutes / 60;

      if (weightGrams <= 0) {
        throw new Error('Weight must be greater than 0');
      }

      if (printTimeMinutes <= 0) {
        throw new Error('Print time must be greater than 0');
      }

      // Calculate costs
      const filamentCost = weightGrams * (selectedFilament.price_per_kg / 1000);
      // Convert watts to kilowatt-hours: watts / 1000 = kilowatts, then multiply by hours
      const powerUsageInKwh = (selectedPrinter.power_usage / 1000) * printTimeHours;
      const electricityCost = powerUsageInKwh * parseFloat(settings.electricity_cost_per_kwh);
      const depreciationCost = printTimeHours * selectedPrinter.depreciation_per_hour;
      
      const totalDirectCost = filamentCost + electricityCost + depreciationCost;

      // Set cost result
      setQuoteResult({
        filament: {
          name: selectedFilament.name,
          weight_grams: weightGrams,
          cost: filamentCost
        },
        printer: {
          name: selectedPrinter.name,
          print_time: printTimeMinutes,
          print_time_hours: printTimeHours
        },
        electricity_cost: electricityCost,
        depreciation_cost: depreciationCost,
        total_direct_cost: totalDirectCost
      });
    } catch (error) {
      console.error('Error calculating quote:', error);
      setError(error.message);
    } finally {
      setCalculating(false);
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Quick Cost
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Input Form Card - Full Width */}
        <Grid item xs={12} md={12}>
          <Card>
            <CardHeader title="Enter Print Details" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="filament-select-label">Filament</InputLabel>
                    <Select
                      labelId="filament-select-label"
                      id="filament_id"
                      name="filament_id"
                      value={formData.filament_id}
                      label="Filament"
                      onChange={handleInputChange}
                    >
                      {filaments.map((filament) => (
                        <MenuItem key={filament.id} value={filament.id}>
                          {filament.name} - {settings.currency_symbol}{filament.price_per_kg.toFixed(2)}/kg
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Filament Weight"
                    name="weight_grams"
                    type="number"
                    value={formData.weight_grams}
                    onChange={handleInputChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="printer-select-label">Printer</InputLabel>
                    <Select
                      labelId="printer-select-label"
                      id="printer_id"
                      name="printer_id"
                      value={formData.printer_id}
                      label="Printer"
                      onChange={handleInputChange}
                    >
                      {printers.map((printer) => (
                        <MenuItem key={printer.id} value={printer.id}>
                          {printer.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TimeInput 
                    label="Print Time"
                    name="print_time"
                    value={formData.print_time}
                    onChange={handleInputChange}
                    margin="normal" // Added for alignment
                    fullWidth // Ensure it takes full width of its grid item
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={calculateQuote}
                    disabled={calculating || loading}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {calculating ? <CircularProgress size={24} /> : 'Calculate Cost'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Result Card - Full Width, appears below */}
        {quoteResult && (
          <Grid item xs={12} md={12} sx={{ mt: 3 }}> {/* Retain top margin */}
            <Card>
              <CardHeader title="Estimated Direct Costs" />
              <CardContent>
                <Paper elevation={2} sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
                  <Typography variant="h6" gutterBottom>Cost Breakdown</Typography>
                  <Typography variant="body1">
                    Filament: {quoteResult.filament.name} ({quoteResult.filament.weight_grams}g) - {settings.currency_symbol}{quoteResult.filament.cost.toFixed(2)}
                  </Typography>
                  <Typography variant="body1">
                    Printer: {quoteResult.printer.name} ({quoteResult.printer.print_time_hours.toFixed(2)} hrs)
                  </Typography>
                  <Typography variant="body1">
                    Electricity Cost: {settings.currency_symbol}{quoteResult.electricity_cost.toFixed(2)}
                  </Typography>
                  <Typography variant="body1">
                    Printer Depreciation: {settings.currency_symbol}{quoteResult.depreciation_cost.toFixed(2)}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: settings.accent_color || '#E53935' }}>
                    Total Direct Cost: {settings.currency_symbol}{quoteResult.total_direct_cost.toFixed(2)}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default QuickCost; // Renamed export
