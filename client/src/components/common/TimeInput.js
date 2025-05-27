import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, Typography } from '@mui/material';

/**
 * A flexible time input component that handles various time formats
 * Supports input in days, hours, minutes or combinations
 * Examples: "5 minutes", "2 hours", "1 day 2 hours 30 minutes", "1.5 hours", etc.
 * 
 * @param {Object} props
 * @param {string} props.label - Input field label
 * @param {number} props.value - Time value in minutes (internal representation)
 * @param {function} props.onChange - Callback function when value changes
 * @param {string} props.name - Input field name
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {boolean} props.fullWidth - Whether the input takes full width
 * @param {Object} props.sx - Additional styling
 */
function TimeInput({ 
  label, 
  value = 0, 
  onChange, 
  name, 
  disabled = false, 
  fullWidth = true,
  sx = {},
  ...props 
}) {
  // Store the display value (what user types)
  const [displayValue, setDisplayValue] = useState('');
  
  // Convert minutes to human-readable format on initial load and when value changes
  useEffect(() => {
    if (value === 0 || value === '') {
      setDisplayValue('0m');
      return;
    }
    
    // Convert minutes to days, hours, minutes
    const totalMinutes = parseInt(value);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    
    // Use abbreviated format for consistency
    let formattedTime = '';
    if (days > 0) formattedTime += `${days}d `;
    if (hours > 0) formattedTime += `${hours}h `;
    if (minutes > 0) formattedTime += `${minutes}m`;
    
    // If no time units are present (all zeros), show as 0m
    if (formattedTime === '') {
      formattedTime = '0m';
    }
    
    setDisplayValue(formattedTime.trim());
  }, [value]);
  
  // Handle input change
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
  };
  
  // Parse time string to minutes when focus is lost
  const handleBlur = () => {
    if (!displayValue) {
      onChange({ target: { name, value: 0 } });
      return;
    }
    
    try {
      const minutes = parseTimeStringToMinutes(displayValue);
      onChange({ target: { name, value: minutes } });
    } catch (error) {
      // If parsing fails, revert to previous valid value
      console.error('Error parsing time:', error);
      
      // Reset display value to match the current valid value
      const totalMinutes = parseInt(value);
      const days = Math.floor(totalMinutes / (24 * 60));
      const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
      const minutes = totalMinutes % 60;
      
      // Use abbreviated format for consistency
      let formattedTime = '';
      if (days > 0) formattedTime += `${days}d `;
      if (hours > 0) formattedTime += `${hours}h `;
      if (minutes > 0) formattedTime += `${minutes}m`;
      
      // If no time units are present (all zeros), show as 0m
      if (formattedTime === '') {
        formattedTime = '0m';
      }
      
      setDisplayValue(formattedTime.trim());
    }
  };
  
  return (
    <TextField
      label={label}
      value={displayValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      name={name}
      disabled={disabled}
      fullWidth={fullWidth}
      sx={sx}
      InputProps={{
        endAdornment: <InputAdornment position="end">
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            e.g. 1d 6h 30m
          </Typography>
        </InputAdornment>,
      }}
      placeholder=""
      {...props}
    />
  );
}

/**
 * Parse a time string into minutes
 * Supports formats like:
 * - "5 minutes", "5 mins", "5m", "5min"
 * - "2 hours", "2 hrs", "2h", "2hour"
 * - "1 day", "1 days", "1d"
 * - "1 day 2 hours 30 minutes", "1d 2h 30m"
 * - "1.5 hours", "1.5h"
 * - "90" (assumes minutes if no unit)
 * 
 * @param {string} timeString - The time string to parse
 * @returns {number} - Time in minutes
 */
function parseTimeStringToMinutes(timeString) {
  if (!timeString) return 0;
  
  // If it's just a number, assume minutes
  if (/^\d+(\.\d+)?$/.test(timeString)) {
    return Math.round(parseFloat(timeString));
  }
  
  let totalMinutes = 0;
  
  // Match patterns like "1 day", "2 hours", "30 minutes", "1.5h", "2d", etc.
  const dayPattern = /(\d+(\.\d+)?)\s*(d|day|days)/gi;
  const hourPattern = /(\d+(\.\d+)?)\s*(h|hr|hrs|hour|hours)/gi;
  const minutePattern = /(\d+(\.\d+)?)\s*(m|min|mins|minute|minutes)/gi;
  
  // Extract days
  let dayMatch;
  while ((dayMatch = dayPattern.exec(timeString)) !== null) {
    const days = parseFloat(dayMatch[1]);
    totalMinutes += days * 24 * 60;
  }
  
  // Extract hours
  let hourMatch;
  while ((hourMatch = hourPattern.exec(timeString)) !== null) {
    const hours = parseFloat(hourMatch[1]);
    totalMinutes += hours * 60;
  }
  
  // Extract minutes
  let minuteMatch;
  while ((minuteMatch = minutePattern.exec(timeString)) !== null) {
    const minutes = parseFloat(minuteMatch[1]);
    totalMinutes += minutes;
  }
  
  // If no patterns matched but there's input, try to interpret it
  if (totalMinutes === 0 && timeString.trim() !== '') {
    // Split by spaces and try to interpret each part
    const parts = timeString.trim().split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (/^\d+(\.\d+)?$/.test(part)) {
        // It's a number, check the next part for unit or assume minutes
        const value = parseFloat(part);
        const unit = parts[i + 1]?.toLowerCase();
        
        if (unit && /^(d|day|days)$/.test(unit)) {
          totalMinutes += value * 24 * 60;
          i++; // Skip the unit
        } else if (unit && /^(h|hr|hrs|hour|hours)$/.test(unit)) {
          totalMinutes += value * 60;
          i++; // Skip the unit
        } else if (unit && /^(m|min|mins|minute|minutes)$/.test(unit)) {
          totalMinutes += value;
          i++; // Skip the unit
        } else {
          // No recognizable unit, assume minutes
          totalMinutes += value;
        }
      }
    }
  }
  
  return Math.round(totalMinutes);
}

export default TimeInput;
export { parseTimeStringToMinutes };
