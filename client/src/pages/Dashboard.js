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
  DialogTitle,
  TextField,
  Popover
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  FileCopy as FileCopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import SettingsContext from '../context/SettingsContext';

function Dashboard() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState(null);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Filtering state
  const [filterConfig, setFilterConfig] = useState({});
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [currentFilterColumn, setCurrentFilterColumn] = useState(null);
  
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

  // Sort function
  const sortedData = (data) => {
    if (sortConfig.key) {
      return [...data].sort((a, b) => {
        // Handle numeric fields
        if (['total_cost'].includes(sortConfig.key)) {
          if (sortConfig.direction === 'asc') {
            return parseFloat(a[sortConfig.key]) - parseFloat(b[sortConfig.key]);
          }
          return parseFloat(b[sortConfig.key]) - parseFloat(a[sortConfig.key]);
        }
        
        // Handle string fields
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  };
  
  // Request sort handler
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Filter handlers
  const handleFilterClick = (event, column) => {
    setCurrentFilterColumn(column);
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handleFilterChange = (event) => {
    const { value } = event.target;
    setFilterConfig(prev => ({
      ...prev,
      [currentFilterColumn]: value
    }));
  };
  
  const handleFilterClear = () => {
    setFilterConfig(prev => {
      const newConfig = { ...prev };
      delete newConfig[currentFilterColumn];
      return newConfig;
    });
    handleFilterClose();
  };
  
  // Filter quotes based on filter config
  const filteredQuotes = quotes.filter(quote => {
    return Object.entries(filterConfig).every(([key, value]) => {
      if (!value) return true;
      
      const itemValue = String(quote[key]).toLowerCase();
      return itemValue.includes(value.toLowerCase());
    });
  });
  
  // Apply sorting to filtered data
  const sortedQuotes = sortedData(filteredQuotes);
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Quotes
        </Typography>
        <Button
          component={Link}
          to="/quote/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Quote
        </Button>
      </Box>

      {sortedQuotes.length === 0 ? (
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
        <TableContainer component={Paper} sx={{ backgroundColor: 'background.paper', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ cursor: 'pointer' }} onClick={() => requestSort('quote_number')}>
                      Quote #
                      {sortConfig.key === 'quote_number' && (
                        sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                      )}
                    </Box>
                    <IconButton size="small" onClick={(e) => handleFilterClick(e, 'quote_number')}>
                      <FilterIcon fontSize="small" color={filterConfig.quote_number ? 'primary' : 'inherit'} />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ cursor: 'pointer' }} onClick={() => requestSort('title')}>
                      Title
                      {sortConfig.key === 'title' && (
                        sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                      )}
                    </Box>
                    <IconButton size="small" onClick={(e) => handleFilterClick(e, 'title')}>
                      <FilterIcon fontSize="small" color={filterConfig.title ? 'primary' : 'inherit'} />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ cursor: 'pointer' }} onClick={() => requestSort('customer_name')}>
                      Customer
                      {sortConfig.key === 'customer_name' && (
                        sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                      )}
                    </Box>
                    <IconButton size="small" onClick={(e) => handleFilterClick(e, 'customer_name')}>
                      <FilterIcon fontSize="small" color={filterConfig.customer_name ? 'primary' : 'inherit'} />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ cursor: 'pointer' }} onClick={() => requestSort('date')}>
                      Date
                      {sortConfig.key === 'date' && (
                        sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                      )}
                    </Box>
                    <IconButton size="small" onClick={(e) => handleFilterClick(e, 'date')}>
                      <FilterIcon fontSize="small" color={filterConfig.date ? 'primary' : 'inherit'} />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Box sx={{ cursor: 'pointer' }} onClick={() => requestSort('total_cost')}>
                      Total
                      {sortConfig.key === 'total_cost' && (
                        sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                      )}
                    </Box>
                    <IconButton size="small" onClick={(e) => handleFilterClick(e, 'total_cost')}>
                      <FilterIcon fontSize="small" color={filterConfig.total_cost ? 'primary' : 'inherit'} />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>{quote.quote_number}</TableCell>
                  <TableCell sx={{ maxWidth: { xs: '80px', sm: '200px' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quote.title}</TableCell>
                  <TableCell sx={{ maxWidth: { xs: '80px', sm: '200px' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quote.customer_name}</TableCell>
                  <TableCell sx={{ maxWidth: { xs: '80px', sm: '200px' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quote.date}</TableCell>
                  <TableCell align="right">
                    {settings.currency_symbol}{Number(quote.total_cost).toFixed(2)}
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
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
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Quote</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this quote? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteQuote} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
          <TextField
            label={`Filter by ${currentFilterColumn}`}
            value={filterConfig[currentFilterColumn] || ''}
            onChange={handleFilterChange}
            variant="outlined"
            size="small"
            autoFocus
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button size="small" onClick={handleFilterClear} color="error">
              Clear
            </Button>
            <Button size="small" onClick={handleFilterClose} variant="contained">
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}

export default Dashboard;
