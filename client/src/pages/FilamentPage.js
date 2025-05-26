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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon
} from '@mui/icons-material';
import SettingsContext from '../context/SettingsContext';

function FilamentPage() {
  const [filaments, setFilaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentFilament, setCurrentFilament] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  const { settings } = useContext(SettingsContext);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    diameter: 1.75,
    spool_weight: 1000,
    spool_price: 0,
    density: '',
    price_per_kg: 0,
    color: '#ffffff',
    link: '',
    status: 'Active'
  });

  // Fetch filaments from API
  useEffect(() => {
    const fetchFilaments = async () => {
      try {
        const response = await fetch('/api/filaments');
        if (!response.ok) {
          throw new Error('Failed to fetch filaments');
        }
        const data = await response.json();
        setFilaments(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching filaments:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchFilaments();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open dialog to add new filament
  const handleAddFilament = () => {
    setCurrentFilament(null);
    setFormData({
      name: '',
      type: '',
      diameter: 1.75,
      spool_weight: 1000,
      spool_price: 0,
      density: '',
      price_per_kg: 0,
      color: '#ffffff',
      link: '',
      status: 'Active'
    });
    setDialogOpen(true);
  };

  // Open dialog to edit filament
  const handleEditFilament = (filament) => {
    setCurrentFilament(filament);
    setFormData({
      name: filament.name,
      type: filament.type,
      diameter: filament.diameter,
      spool_weight: filament.spool_weight,
      spool_price: filament.spool_price,
      density: filament.density || '',
      price_per_kg: filament.price_per_kg,
      color: filament.color,
      link: filament.link || '',
      status: filament.status
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

    // Auto-calculate price per kg when spool price or weight changes
    if (name === 'spool_price' || name === 'spool_weight') {
      const spoolPrice = name === 'spool_price' ? parseFloat(value) || 0 : parseFloat(formData.spool_price) || 0;
      const spoolWeight = name === 'spool_weight' ? parseFloat(value) || 0 : parseFloat(formData.spool_weight) || 0;
      
      if (spoolWeight > 0) {
        const pricePerKg = (spoolPrice / spoolWeight) * 1000;
        setFormData(prev => ({ ...prev, price_per_kg: pricePerKg.toFixed(2) }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const url = currentFilament 
        ? `/api/filaments/${currentFilament.id}` 
        : '/api/filaments';
      
      const method = currentFilament ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${currentFilament ? 'update' : 'create'} filament`);
      }
      
      const data = await response.json();
      
      if (currentFilament) {
        // Update filament in list
        setFilaments(filaments.map(f => f.id === data.id ? data : f));
      } else {
        // Add new filament to list
        setFilaments([data, ...filaments]);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving filament:', error);
      setError(error.message);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (filament) => {
    setCurrentFilament(filament);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCurrentFilament(null);
  };

  // Handle filament deletion
  const handleDeleteFilament = async () => {
    if (!currentFilament) return;
    
    try {
      const response = await fetch(`/api/filaments/${currentFilament.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete filament');
      }
      
      // Remove deleted filament from the list
      setFilaments(filaments.filter(f => f.id !== currentFilament.id));
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting filament:', error);
      setError(error.message);
      handleCloseDeleteDialog();
    }
  };

  // Handle filament archive/unarchive
  const handleToggleArchive = async (filament) => {
    try {
      const response = await fetch(`/api/filaments/${filament.id}/toggle-status`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update filament status');
      }
      
      const updatedFilament = await response.json();
      
      // Update filament in list
      setFilaments(filaments.map(f => f.id === updatedFilament.id ? updatedFilament : f));
    } catch (error) {
      console.error('Error updating filament status:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading filaments...</Typography>
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

  // Filter filaments based on active tab
  const filteredFilaments = filaments.filter(filament => {
    if (tabValue === 0) return filament.status === 'Active';
    return filament.status === 'Archived';
  });

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Filament Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddFilament}
        >
          Add Filament
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Active" />
          <Tab label="Archived" />
        </Tabs>
      </Box>

      {filteredFilaments.length === 0 ? (
        <Card sx={{ mb: 4, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" align="center" sx={{ py: 4 }}>
              {tabValue === 0 
                ? 'No active filaments found. Add a filament to get started.' 
                : 'No archived filaments found.'}
            </Typography>
            {tabValue === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddFilament}
                >
                  Add Filament
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: 'background.paper', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Color</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Diameter</TableCell>
                <TableCell>Spool Weight</TableCell>
                <TableCell>Spool Price</TableCell>
                <TableCell>Price/kg</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFilaments.map((filament) => (
                <TableRow key={filament.id}>
                  <TableCell>
                    <Box 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        backgroundColor: filament.color,
                        border: '1px solid rgba(255, 255, 255, 0.23)'
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: { xs: '80px', sm: '200px' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {filament.name}
                  </TableCell>
                  <TableCell sx={{ maxWidth: { xs: '60px', sm: '120px' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filament.type}</TableCell>
                  <TableCell>{filament.diameter} mm</TableCell>
                  <TableCell>{filament.spool_weight} g</TableCell>
                  <TableCell>{settings.currency_symbol}{Number(filament.spool_price).toFixed(2)}</TableCell>
                  <TableCell>{settings.currency_symbol}{Number(filament.price_per_kg).toFixed(2)}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditFilament(filament)}
                      title="Edit Filament"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleToggleArchive(filament)}
                      title={filament.status === 'Active' ? 'Archive Filament' : 'Unarchive Filament'}
                    >
                      {filament.status === 'Active' ? <ArchiveIcon /> : <UnarchiveIcon />}
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(filament)}
                      title="Delete Filament"
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

      {/* Add/Edit Filament Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentFilament ? 'Edit Filament' : 'Add New Filament'}</DialogTitle>
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
                placeholder="e.g., eSun PLA+ White"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="type"
                label="Material Type"
                value={formData.type}
                onChange={handleInputChange}
                fullWidth
                required
                placeholder="e.g., PLA, ABS, PETG"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="diameter"
                label="Diameter"
                type="number"
                value={formData.diameter}
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
                name="spool_weight"
                label="Spool Weight"
                type="number"
                value={formData.spool_weight}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">g</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="spool_price"
                label="Spool Price"
                type="number"
                value={formData.spool_price}
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
                name="density"
                label="Density (optional)"
                type="number"
                value={formData.density}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">g/cm³</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="price_per_kg"
                label="Price per kg"
                type="number"
                value={formData.price_per_kg}
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
                name="color"
                label="Color"
                type="color"
                value={formData.color}
                onChange={handleInputChange}
                fullWidth
                sx={{
                  '& input': {
                    height: 40,
                    cursor: 'pointer'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="link"
                label="Link (optional)"
                value={formData.link}
                onChange={handleInputChange}
                fullWidth
                placeholder="e.g., https://amazon.com/..."
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
        <DialogTitle>Delete Filament</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the filament "{currentFilament?.name}"? This action cannot be undone.
          </Typography>
          <Typography sx={{ mt: 2, color: 'warning.main' }}>
            Note: You cannot delete a filament that is used in any quotes. Consider archiving it instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteFilament} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FilamentPage;
