import React, { useContext, useEffect, useState } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import SettingsContext from '../../context/SettingsContext';
import TimeInput, { parseTimeStringToMinutes } from '../common/TimeInput';

function PrintSetup({ 
  printers, 
  printSetup, 
  setPrintSetup,
  currencySymbol
}) {
  const { settings } = useContext(SettingsContext);
  
  // Update costs when print time or printer changes
  useEffect(() => {
    if (!printSetup.printer_id || !printSetup.print_time) return;
    
    const selectedPrinter = printers.find(p => p.id === parseInt(printSetup.printer_id));
    if (!selectedPrinter) return;
    
    // Convert minutes to hours for calculations
    const printTimeMinutes = parseInt(printSetup.print_time) || 0;
    const printTimeHours = printTimeMinutes / 60;
    
    // Convert watts to kilowatt-hours: watts / 1000 = kilowatts, then multiply by hours
    const powerUsageInKwh = (selectedPrinter.power_usage / 1000) * printTimeHours;
    const electricityCost = powerUsageInKwh * parseFloat(settings.electricity_cost_per_kwh);
    const depreciationCost = printTimeHours * selectedPrinter.depreciation_per_hour;
    
    setPrintSetup({
      ...printSetup,
      power_cost: electricityCost,
      depreciation_cost: depreciationCost
    });
  }, [printSetup.printer_id, printSetup.print_time, printers, settings.electricity_cost_per_kwh]);

  // Handle printer selection change
  const handlePrinterChange = (e) => {
    const printerId = e.target.value;
    const selectedPrinter = printers.find(p => p.id === parseInt(printerId));
    
    if (!selectedPrinter) return;
    
    setPrintSetup({
      ...printSetup,
      printer_id: printerId,
      printer_name: selectedPrinter.name
    });
  };

  // Handle print time change
  const handlePrintTimeChange = (e) => {
    const { name, value } = e.target;
    setPrintSetup({
      ...printSetup,
      [name]: value
    });
  };

  // Check if there are any printers available
  const noPrintersAvailable = printers.length === 0;

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>
        Print Setup
      </Typography>

      {noPrintersAvailable && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          No printers available. Please add printers in the Printer Management section.
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={noPrintersAvailable}>
            <InputLabel id="printer-label">Printer</InputLabel>
            <Select
              labelId="printer-label"
              value={printSetup.printer_id}
              onChange={handlePrinterChange}
              label="Printer"
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
            name="print_time"
            label="Print Time"
            value={printSetup.print_time}
            onChange={handlePrintTimeChange}
            fullWidth
            disabled={noPrintersAvailable}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Power Cost"
            type="number"
            value={printSetup.power_cost.toFixed(2)}
            InputProps={{
              readOnly: true,
              startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
            }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Depreciation Cost"
            type="number"
            value={printSetup.depreciation_cost.toFixed(2)}
            InputProps={{
              readOnly: true,
              startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
            }}
            fullWidth
          />
        </Grid>
      </Grid>
    </Paper>
  );
}

export default PrintSetup;
