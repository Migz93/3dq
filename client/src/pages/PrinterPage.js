import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon
} from '@mui/icons-material';
import SettingsContext from '../context/SettingsContext';

function PrinterPage() {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPrinter, setCurrentPrinter] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  const { settings } = useContext(SettingsContext);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    material_diameter: 1.75,
    price: 0,
    depreciation_time: 0,
    service_cost: 0,
    power_usage: 0,
    depreciation_per_hour: 0,
    status: 'Active'
  });

  // Fetch printers from API
  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const response = await fetch('/api/printers');
        if (!response.ok) {
          throw new Error('Failed to fetch printers');
        }
        const data = await response.json();
        setPrinters(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching printers:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchPrinters();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open dialog to add new printer
  const handleAddPrinter = () => {
    setCurrentPrinter(null);
    setFormData({
      name: '',
      material_diameter: 1.75,
      price: 0,
      depreciation_time: 0,
      service_cost: 0,
      power_usage: 0,
      depreciation_per_hour: 0,
      status: 'Active'
    });
    setDialogOpen(true);
  };

  // Open dialog to edit printer
  const handleEditPrinter = (printer) => {
    setCurrentPrinter(printer);
    setFormData({
      name: printer.name,
      material_diameter: printer.material_diameter,
      price: printer.price,
      depreciation_time: printer.depreciation_time,
      service_cost: printer.service_cost,
      power_usage: printer.power_usage,
      depreciation_per_hour: printer.depreciation_per_hour,
      status: printer.status
    });
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-calculate depreciation per hour
    if (name === 'price' || name === 'depreciation_time' || name === 'service_cost') {
      const price = name === 'price' ? parseFloat(value) || 0 : parseFloat(formData.price) || 0;
      const depreciationTime = name === 'depreciation_time' ? parseFloat(value) || 0 : parseFloat(formData.depreciation_time) || 0;
      const serviceCost = name === 'service_cost' ? parseFloat(value) || 0 : parseFloat(formData.service_cost) || 0;
      
      if (depreciationTime > 0) {
        const depreciationPerHour = (price + serviceCost) / depreciationTime;
        setFormData(prev => ({ ...prev, depreciation_per_hour: depreciationPerHour.toFixed(2) }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const url = currentPrinter 
        ? `/api/printers/${currentPrinter.id}` 
        : '/api/printers';
      
      const method = currentPrinter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${currentPrinter ? 'update' : 'create'} printer`);
      }
      
      const data = await response.json();
      
      if (currentPrinter) {
        // Update printer in list
        setPrinters(printers.map(p => p.id === data.id ? data : p));
      } else {
        // Add new printer to list
        setPrinters([data, ...printers]);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving printer:', error);
      setError(error.message);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (printer) => {
    setCurrentPrinter(printer);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCurrentPrinter(null);
  };

  // Handle printer deletion
  const handleDeletePrinter = async () => {
    if (!currentPrinter) return;
    
    try {
      const response = await fetch(`/api/printers/${currentPrinter.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete printer');
      }
      
      // Remove deleted printer from the list
      setPrinters(printers.filter(p => p.id !== currentPrinter.id));
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting printer:', error);
      setError(error.message);
      handleCloseDeleteDialog();
    }
  };

  // Handle printer archive/unarchive
  const handleToggleArchive = async (printer) => {
    try {
      const response = await fetch(`/api/printers/${printer.id}/toggle-status`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update printer status');
      }
      
      const updatedPrinter = await response.json();
      
      // Update printer in list
      setPrinters(printers.map(p => p.id === updatedPrinter.id ? updatedPrinter : p));
    } catch (error) {
      console.error('Error updating printer status:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading printers...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  // Filter printers based on active tab
  const filteredPrinters = printers.filter(printer => {
    if (tabValue === 0) return printer.status === 'Active';
    return printer.status === 'Archived';
  });

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Printer Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPrinter}
        >
          Add Printer
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Active" />
          <Tab label="Archived" />
        </Tabs>
      </Box>

      {filteredPrinters.length === 0 ? (
        <Card sx={{ mb: 4, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" align="center" sx={{ py: 4 }}>
              {tabValue === 0 
                ? 'No active printers found. Add a printer to get started.' 
                : 'No archived printers found.'}
            </Typography>
            {tabValue === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddPrinter}
                >
                  Add Printer
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: 'background.paper' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Material Diameter</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Depreciation Time</TableCell>
                <TableCell>Service Cost</TableCell>
                <TableCell>Power Usage</TableCell>
                <TableCell>Depreciation per Hour</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrinters.map((printer) => (
                <TableRow key={printer.id}>
                  <TableCell>{printer.name}</TableCell>
                  <TableCell>{printer.material_diameter} mm</TableCell>
                  <TableCell>{settings.currency_symbol}{Number(printer.price).toFixed(2)}</TableCell>
                  <TableCell>{printer.depreciation_time} hrs</TableCell>
                  <TableCell>{settings.currency_symbol}{Number(printer.service_cost).toFixed(2)}</TableCell>
                  <TableCell>{printer.power_usage} W</TableCell>
                  <TableCell>{settings.currency_symbol}{Number(printer.depreciation_per_hour).toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditPrinter(printer)}
                      title="Edit Printer"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleToggleArchive(printer)}
                      title={printer.status === 'Active' ? 'Archive Printer' : 'Unarchive Printer'}
                    >
                      {printer.status === 'Active' ? <ArchiveIcon /> : <UnarchiveIcon />}
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(printer)}
                      title="Delete Printer"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Printer Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentPrinter ? 'Edit Printer' : 'Add New Printer'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                placeholder="e.g., Prusa MK3S+, Bambu X1C"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="material_diameter"
                label="Material Diameter"
                type="number"
                value={formData.material_diameter}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="price"
                label="Printer Price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">{settings.currency_symbol}</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="depreciation_time"
                label="Depreciation Time"
                type="number"
                value={formData.depreciation_time}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="service_cost"
                label="Service Cost"
                type="number"
                value={formData.service_cost}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">{settings.currency_symbol}</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="power_usage"
                label="Power Usage"
                type="number"
                value={formData.power_usage}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">W</InputAdornment>,
                }}
                helperText="Average power consumption in watts while printing"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="depreciation_per_hour"
                label="Depreciation per Hour"
                type="number"
                value={formData.depreciation_per_hour}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">{settings.currency_symbol}</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Printer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the printer "{currentPrinter?.name}"? This action cannot be undone.
          </Typography>
          <Typography sx={{ mt: 2, color: 'warning.main' }}>
            Note: You cannot delete a printer that is used in any quotes. Consider archiving it instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeletePrinter} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PrinterPage;
