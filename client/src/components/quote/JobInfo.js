import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Paper
} from '@mui/material';

function JobInfo({ formData, handleInputChange }) {
  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>
        Job Information
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="customer_name"
            label="Customer Name"
            value={formData.customer_name}
            onChange={handleInputChange}
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="title"
            label="Quote Title (optional)"
            value={formData.title}
            onChange={handleInputChange}
            fullWidth
            placeholder="Auto-generated if left blank"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="date"
            label="Date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            fullWidth
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            name="notes"
            label="Notes (optional)"
            value={formData.notes}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}

export default JobInfo;
