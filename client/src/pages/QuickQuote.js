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
import { Save as SaveIcon } from '@mui/icons-material';
import SettingsContext from '../context/SettingsContext';

function QuickQuote() {
  const { settings } = useContext(SettingsContext);
  const [filaments, setFilaments] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [quoteResult, setQuoteResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    filament_id: '',
    weight_grams: 0,
    print_time: 0,
    printer_id: '',
    customer_name: 'Quick Quote Customer'
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
      const printTime = parseFloat(formData.print_time) || 0;

      if (weightGrams <= 0) {
        throw new Error('Weight must be greater than 0');
      }

      if (printTime <= 0) {
        throw new Error('Print time must be greater than 0');
      }

      // Calculate costs
      const filamentCost = weightGrams * (selectedFilament.price_per_kg / 1000);
      // Convert watts to kilowatt-hours: watts / 1000 = kilowatts, then multiply by hours
      const powerUsageInKwh = (selectedPrinter.power_usage / 1000) * printTime;
      const electricityCost = powerUsageInKwh * parseFloat(settings.electricity_cost_per_kwh);
      const depreciationCost = printTime * selectedPrinter.depreciation_per_hour;
      
      const subtotal = filamentCost + electricityCost + depreciationCost;
      const markup = subtotal * (parseFloat(settings.default_markup_percent) / 100);
      const total = subtotal + markup;

      // Set quote result
      setQuoteResult({
        filament: {
          name: selectedFilament.name,
          weight_grams: weightGrams,
          cost: filamentCost
        },
        printer: {
          name: selectedPrinter.name,
          print_time: printTime
        },
        electricity_cost: electricityCost,
        depreciation_cost: depreciationCost,
        subtotal: subtotal,
        markup_percent: parseFloat(settings.default_markup_percent),
        markup: markup,
        total: total
      });
    } catch (error) {
      console.error('Error calculating quote:', error);
      setError(error.message);
    } finally {
      setCalculating(false);
    }
  };

  // Save quote
  const saveQuote = async () => {
    if (!quoteResult) return;

    setSaving(true);
    setError(null);

    try {
      // Get next quote number
      const quoteNumberResponse = await fetch('/api/settings/quote/next-number');
      if (!quoteNumberResponse.ok) {
        throw new Error('Failed to get quote number');
      }
      const quoteNumberData = await quoteNumberResponse.json();

      // Prepare quote data
      const quoteData = {
        quote_number: quoteNumberData.quote_number,
        title: `${quoteNumberData.quote_number} - Quick Quote`,
        customer_name: formData.customer_name,
        date: new Date().toISOString().split('T')[0],
        notes: `Quick quote for ${quoteResult.filament.weight_grams}g of ${quoteResult.filament.name}, printed on ${quoteResult.printer.name} for ${quoteResult.printer.print_time} hours.`,
        markup_percent: quoteResult.markup_percent,
        total_cost: quoteResult.total,
        is_quick_quote: true,
        
        // Filament data
        filaments: [
          {
            filament_id: parseInt(formData.filament_id),
            filament_name: quoteResult.filament.name,
            filament_price_per_gram: quoteResult.filament.cost / quoteResult.filament.weight_grams,
            grams_used: quoteResult.filament.weight_grams,
            total_cost: quoteResult.filament.cost
          }
        ],
        
        // Print setup data
        printSetup: {
          printer_id: parseInt(formData.printer_id),
          printer_name: quoteResult.printer.name,
          print_time: quoteResult.printer.print_time,
          power_cost: quoteResult.electricity_cost,
          depreciation_cost: quoteResult.depreciation_cost
        },
        
        // Empty hardware and labour
        hardware: [],
        labour: {
          design_minutes: 0,
          preparation_minutes: 0,
          post_processing_minutes: 0,
          other_minutes: 0,
          labour_rate_per_hour: parseFloat(settings.labour_rate_per_hour),
          total_cost: 0
        }
      };

      // Save quote
      const saveResponse = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save quote');
      }

      setSaveSuccess(true);
      
      // Reset form after successful save
      setTimeout(() => {
        setQuoteResult(null);
        setSaveSuccess(false);
        setFormData({
          ...formData,
          weight_grams: 0,
          print_time: 0
        });
      }, 3000);
    } catch (error) {
      console.error('Error saving quote:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
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
        Quick Quote
      </Typography>

      {(filaments.length === 0 || printers.length === 0) ? (
        <Alert severity="warning" sx={{ mb: 4 }}>
          {filaments.length === 0 && 'You need to add at least one filament. '}
          {printers.length === 0 && 'You need to add at least one printer. '}
          Please set these up before creating a quote.
        </Alert>
      ) : null}

      <Card sx={{ mb: 4, backgroundColor: 'background.paper' }}>
        <CardHeader title="Quick Quote Calculator" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={filaments.length === 0}>
                <InputLabel id="filament-label">Filament</InputLabel>
                <Select
                  labelId="filament-label"
                  name="filament_id"
                  value={formData.filament_id}
                  onChange={handleInputChange}
                  label="Filament"
                  required
                >
                  {filaments.map((filament) => (
                    <MenuItem key={filament.id} value={filament.id}>
                      {filament.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={printers.length === 0}>
                <InputLabel id="printer-label">Printer</InputLabel>
                <Select
                  labelId="printer-label"
                  name="printer_id"
                  value={formData.printer_id}
                  onChange={handleInputChange}
                  label="Printer"
                  required
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
              <TextField
                name="weight_grams"
                label="Filament Used (g)"
                type="number"
                value={formData.weight_grams}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">g</InputAdornment>,
                }}
                disabled={filaments.length === 0}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="print_time"
                label="Print Time"
                type="number"
                value={formData.print_time}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">hours</InputAdornment>,
                }}
                disabled={printers.length === 0}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={calculateQuote}
                  disabled={calculating || filaments.length === 0 || printers.length === 0}
                  sx={{ minWidth: 120 }}
                >
                  {calculating ? <CircularProgress size={24} /> : 'Calculate'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 4 }}>
          Quote saved successfully!
        </Alert>
      )}

      {quoteResult && (
        <Paper sx={{ p: 3, backgroundColor: 'background.paper' }}>
          <Typography variant="h5" gutterBottom>
            Quote Summary
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">
                Filament: {quoteResult.filament.name}
              </Typography>
              <Typography variant="body2">
                Weight: {quoteResult.filament.weight_grams}g
              </Typography>
              <Typography variant="body2">
                Filament Cost: {settings.currency_symbol}{quoteResult.filament.cost.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">
                Printer: {quoteResult.printer.name}
              </Typography>
              <Typography variant="body2">
                Print Time: {quoteResult.printer.print_time} hours
              </Typography>
              <Typography variant="body2">
                Electricity Cost: {settings.currency_symbol}{quoteResult.electricity_cost.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                Depreciation: {settings.currency_symbol}{quoteResult.depreciation_cost.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                Subtotal: {settings.currency_symbol}{quoteResult.subtotal.toFixed(2)}
              </Typography>
              <Typography variant="body1">
                Markup ({quoteResult.markup_percent}%): {settings.currency_symbol}{quoteResult.markup.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Total: {settings.currency_symbol}{quoteResult.total.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <TextField
              name="customer_name"
              label="Customer Name"
              value={formData.customer_name}
              onChange={handleInputChange}
              sx={{ mr: 2, width: 250 }}
            />
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveQuote}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Quote'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default QuickQuote;
