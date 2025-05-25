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
  Unarchive as UnarchiveIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import SettingsContext from '../context/SettingsContext';

function HardwarePage() {
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentHardware, setCurrentHardware] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  const { settings } = useContext(SettingsContext);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    unit_price: 0,
    link: '',
    status: 'Active'
  });

  // Fetch hardware from API
  useEffect(() => {
    const fetchHardware = async () => {
      try {
        const response = await fetch('/api/hardware');
        if (!response.ok) {
          throw new Error('Failed to fetch hardware');
        }
        const data = await response.json();
        setHardware(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching hardware:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchHardware();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open dialog to add new hardware
  const handleAddHardware = () => {
    setCurrentHardware(null);
    setFormData({
      name: '',
      unit_price: 0,
      link: '',
      status: 'Active'
    });
    setDialogOpen(true);
  };

  // Open dialog to edit hardware
  const handleEditHardware = (item) => {
    setCurrentHardware(item);
    setFormData({
      name: item.name,
      unit_price: item.unit_price,
      link: item.link || '',
      status: item.status
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
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const url = currentHardware 
        ? `/api/hardware/${currentHardware.id}` 
        : '/api/hardware';
      
      const method = currentHardware ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${currentHardware ? 'update' : 'create'} hardware item`);
      }
      
      const data = await response.json();
      
      if (currentHardware) {
        // Update hardware in list
        setHardware(hardware.map(h => h.id === data.id ? data : h));
      } else {
        // Add new hardware to list
        setHardware([data, ...hardware]);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving hardware:', error);
      setError(error.message);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (item) => {
    setCurrentHardware(item);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCurrentHardware(null);
  };

  // Handle hardware deletion
  const handleDeleteHardware = async () => {
    if (!currentHardware) return;
    
    try {
      const response = await fetch(`/api/hardware/${currentHardware.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete hardware item');
      }
      
      // Remove deleted hardware from the list
      setHardware(hardware.filter(h => h.id !== currentHardware.id));
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting hardware:', error);
      setError(error.message);
      handleCloseDeleteDialog();
    }
  };

  // Handle hardware archive/unarchive
  const handleToggleArchive = async (item) => {
    try {
      const response = await fetch(`/api/hardware/${item.id}/toggle-status`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update hardware status');
      }
      
      const updatedHardware = await response.json();
      
      // Update hardware in list
      setHardware(hardware.map(h => h.id === updatedHardware.id ? updatedHardware : h));
    } catch (error) {
      console.error('Error updating hardware status:', error);
      setError(error.message);
    }
  };

  // Open external link
  const handleOpenLink = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading hardware...</Typography>
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

  // Filter hardware based on active tab
  const filteredHardware = hardware.filter(item => {
    if (tabValue === 0) return item.status === 'Active';
    return item.status === 'Archived';
  });

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Hardware Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddHardware}
        >
          Add Hardware
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Active" />
          <Tab label="Archived" />
        </Tabs>
      </Box>

      {filteredHardware.length === 0 ? (
        <Card sx={{ mb: 4, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" align="center" sx={{ py: 4 }}>
              {tabValue === 0 
                ? 'No active hardware items found. Add hardware to get started.' 
                : 'No archived hardware items found.'}
            </Typography>
            {tabValue === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddHardware}
                >
                  Add Hardware
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
                <TableCell>Unit Price</TableCell>
                <TableCell>Link</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHardware.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{settings.currency_symbol}{Number(item.unit_price).toFixed(2)}</TableCell>
                  <TableCell>
                    {item.link ? (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenLink(item.link)}
                        title="Open Link"
                      >
                        <LinkIcon />
                      </IconButton>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No link</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditHardware(item)}
                      title="Edit Hardware"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleToggleArchive(item)}
                      title={item.status === 'Active' ? 'Archive Hardware' : 'Unarchive Hardware'}
                    >
                      {item.status === 'Active' ? <ArchiveIcon /> : <UnarchiveIcon />}
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(item)}
                      title="Delete Hardware"
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

      {/* Add/Edit Hardware Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentHardware ? 'Edit Hardware' : 'Add New Hardware'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                placeholder="e.g., M3 Hex Bolt, LED Strip"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="unit_price"
                label="Unit Price"
                type="number"
                value={formData.unit_price}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">{settings.currency_symbol}</InputAdornment>,
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
        <DialogTitle>Delete Hardware</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the hardware item "{currentHardware?.name}"? This action cannot be undone.
          </Typography>
          <Typography sx={{ mt: 2, color: 'warning.main' }}>
            Note: You cannot delete a hardware item that is used in any quotes. Consider archiving it instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteHardware} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default HardwarePage;
