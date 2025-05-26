import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
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
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Add as AddIcon,
  FlashOn as FlashOnIcon,
  Visibility as VisibilityIcon,
  FileCopy as FileCopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import SettingsContext from '../context/SettingsContext';

function Dashboard() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState(null);
  
  const { settings } = useContext(SettingsContext);

  // Fetch quotes from API
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/quotes');
        if (!response.ok) {
          throw new Error('Failed to fetch quotes');
        }
        const data = await response.json();
        setQuotes(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quotes:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  // Handle quote duplication
  const handleDuplicateQuote = async (id) => {
    try {
      const response = await fetch(`/api/quotes/${id}/duplicate`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to duplicate quote');
      }
      
      const newQuote = await response.json();
      
      // Update quotes list with the new quote
      setQuotes([newQuote, ...quotes]);
    } catch (error) {
      console.error('Error duplicating quote:', error);
      setError(error.message);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (quote) => {
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setQuoteToDelete(null);
  };

  // Handle quote deletion
  const handleDeleteQuote = async () => {
    if (!quoteToDelete) return;
    
    try {
      const response = await fetch(`/api/quotes/${quoteToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }
      
      // Remove deleted quote from the list
      setQuotes(quotes.filter(quote => quote.id !== quoteToDelete.id));
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting quote:', error);
      setError(error.message);
      closeDeleteDialog();
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading quotes...</Typography>
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

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Quotes
        </Typography>
        <Box>
          <Button
            component={Link}
            to="/quote/quick"
            variant="outlined"
            startIcon={<FlashOnIcon />}
            sx={{ mr: 2 }}
          >
            Quick Quote
          </Button>
          <Button
            component={Link}
            to="/quote/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            New Quote
          </Button>
        </Box>
      </Box>

      {quotes.length === 0 ? (
        <Card sx={{ mb: 4, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" align="center" sx={{ py: 4 }}>
              No quotes found. Create your first quote to get started.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                component={Link}
                to="/quote/new"
                variant="contained"
                startIcon={<AddIcon />}
              >
                Create Quote
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: 'background.paper' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Quote Number</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>{quote.quote_number}</TableCell>
                  <TableCell>{quote.title}</TableCell>
                  <TableCell>{quote.customer_name}</TableCell>
                  <TableCell>{quote.date}</TableCell>
                  <TableCell align="right">
                    {settings.currency_symbol}{Number(quote.total_cost).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      component={Link}
                      to={`/quote/${quote.id}`}
                      color="primary"
                      size="small"
                      title="View Quote"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      component={Link}
                      to={`/quote/edit/${quote.id}`}
                      color="primary"
                      size="small"
                      title="Edit Quote"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleDuplicateQuote(quote.id)}
                      title="Duplicate Quote"
                    >
                      <FileCopyIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => openDeleteDialog(quote)}
                      title="Delete Quote"
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the quote "{quoteToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteQuote} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;
