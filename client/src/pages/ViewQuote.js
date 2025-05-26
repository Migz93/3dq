import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  FileCopy as FileCopyIcon,
  Delete as DeleteIcon,
  Description as InvoiceIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import SettingsContext from '../context/SettingsContext';

function ViewQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch quote data
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/quotes/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quote');
        }
        const data = await response.json();
        setQuote(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quote:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  // Handle quote duplication
  const handleDuplicateQuote = async () => {
    setDuplicating(true);
    try {
      const response = await fetch(`/api/quotes/${id}/duplicate`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to duplicate quote');
      }
      
      const newQuote = await response.json();
      
      // Navigate to the new quote
      navigate(`/quote/${newQuote.id}`);
    } catch (error) {
      console.error('Error duplicating quote:', error);
      setError(error.message);
      setDuplicating(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // Handle quote deletion
  const handleDeleteQuote = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }
      
      // Navigate back to quotes list
      navigate('/');
    } catch (error) {
      console.error('Error deleting quote:', error);
      setError(error.message);
      setDeleting(false);
      closeDeleteDialog();
    }
  };

  // Generate invoice
  const generateInvoice = (type) => {
    window.open(`/api/quotes/${id}/invoice/${type}`, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 4 }}>
        Error: {error}
      </Alert>
    );
  }

  if (!quote) {
    return (
      <Alert severity="warning" sx={{ mb: 4 }}>
        Quote not found
      </Alert>
    );
  }

  // Calculate totals
  const filamentTotal = quote.filaments?.reduce((sum, f) => sum + f.total_cost, 0) || 0;
  const hardwareTotal = quote.hardware?.reduce((sum, h) => sum + h.total_cost, 0) || 0;
  const powerCost = quote.printSetup?.power_cost || 0;
  const depreciationCost = quote.printSetup?.depreciation_cost || 0;
  const labourCost = quote.labour?.total_cost || 0;
  
  const subtotal = filamentTotal + hardwareTotal + powerCost + depreciationCost + labourCost;
  const markup = subtotal * (quote.markup_percent / 100);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {quote.title}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<InvoiceIcon />}
            onClick={() => generateInvoice('client')}
            sx={{ mr: 1 }}
          >
            Client Invoice
          </Button>
          <Button
            variant="outlined"
            startIcon={<InvoiceIcon />}
            onClick={() => generateInvoice('internal')}
            sx={{ mr: 1 }}
          >
            Internal Invoice
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            component={Link}
            to={`/quote/edit/${id}`}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileCopyIcon />}
            onClick={handleDuplicateQuote}
            disabled={duplicating}
            sx={{ mr: 1 }}
          >
            Duplicate
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={openDeleteDialog}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 4, backgroundColor: 'background.paper' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Quote Number</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{quote.quote_number}</Typography>
            
            <Typography variant="subtitle1">Customer</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{quote.customer_name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Date</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{quote.date}</Typography>
            
            <Typography variant="subtitle1">Status</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {quote.is_quick_quote ? 'Quick Quote' : 'Standard Quote'}
            </Typography>
          </Grid>
          {quote.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle1">Notes</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{quote.notes}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Filament Section */}
      {quote.filaments && quote.filaments.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, backgroundColor: 'background.paper' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Filament Usage</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Weight (g)</TableCell>
                  <TableCell align="right">Price per gram</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quote.filaments.map((filament, index) => (
                  <TableRow key={index}>
                    <TableCell>{filament.filament_name}</TableCell>
                    <TableCell align="right">{filament.grams_used}</TableCell>
                    <TableCell align="right">
                      {settings.currency_symbol}{filament.filament_price_per_gram.toFixed(4)}
                    </TableCell>
                    <TableCell align="right">
                      {settings.currency_symbol}{filament.total_cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right"><strong>Total Filament Cost</strong></TableCell>
                  <TableCell align="right">
                    <strong>{settings.currency_symbol}{filamentTotal.toFixed(2)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Hardware Section */}
      {quote.hardware && quote.hardware.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, backgroundColor: 'background.paper' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Hardware</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quote.hardware.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.hardware_name}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">
                      {settings.currency_symbol}{item.unit_price.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      {settings.currency_symbol}{item.total_cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right"><strong>Total Hardware Cost</strong></TableCell>
                  <TableCell align="right">
                    <strong>{settings.currency_symbol}{hardwareTotal.toFixed(2)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Print Setup Section */}
      {quote.printSetup && (
        <Paper sx={{ p: 3, mb: 4, backgroundColor: 'background.paper' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Print Setup</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Printer</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{quote.printSetup.printer_name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Print Time</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{quote.printSetup.print_time} hours</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Power Cost</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {settings.currency_symbol}{quote.printSetup.power_cost.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Depreciation Cost</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {settings.currency_symbol}{quote.printSetup.depreciation_cost.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Labour Section */}
      {quote.labour && (
        <Paper sx={{ p: 3, mb: 4, backgroundColor: 'background.paper' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Labour</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle1">Design</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{quote.labour.design_minutes} min</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle1">Preparation</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{quote.labour.preparation_minutes} min</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle1">Post Processing</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{quote.labour.post_processing_minutes} min</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle1">Other</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{quote.labour.other_minutes} min</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Labour Rate</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {settings.currency_symbol}{quote.labour.labour_rate_per_hour.toFixed(2)} per hour
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Total Labour Cost</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {settings.currency_symbol}{quote.labour.total_cost.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Cost Summary */}
      <Paper sx={{ p: 3, backgroundColor: 'background.paper' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Cost Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">Filament Cost: {settings.currency_symbol}{filamentTotal.toFixed(2)}</Typography>
            <Typography variant="body1">Hardware Cost: {settings.currency_symbol}{hardwareTotal.toFixed(2)}</Typography>
            <Typography variant="body1">Power Cost: {settings.currency_symbol}{powerCost.toFixed(2)}</Typography>
            <Typography variant="body1">Depreciation: {settings.currency_symbol}{depreciationCost.toFixed(2)}</Typography>
            <Typography variant="body1">Labour Cost: {settings.currency_symbol}{labourCost.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">Subtotal: {settings.currency_symbol}{subtotal.toFixed(2)}</Typography>
            <Typography variant="body1">
              Markup ({quote.markup_percent}%): {settings.currency_symbol}{markup.toFixed(2)}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Total: {settings.currency_symbol}{quote.total_cost.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the quote "{quote.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button 
            onClick={handleDeleteQuote} 
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ViewQuote;
