import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon
} from '@mui/icons-material';
import SettingsContext from '../context/SettingsContext';

// Import quote components
import JobInfo from '../components/quote/JobInfo';
import FilamentUsage from '../components/quote/FilamentUsage';
import HardwareUsage from '../components/quote/HardwareUsage';
import PrintSetup from '../components/quote/PrintSetup';
import Labour from '../components/quote/Labour';
import CostSummary from '../components/quote/CostSummary';

function QuoteBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { settings } = useContext(SettingsContext);
  
  // Check if we're editing an existing quote
  const isEditMode = !!id;
  
  // Step state
  const [activeStep, setActiveStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const steps = ['Job Info', 'Filament', 'Hardware', 'Print Setup', 'Labour', 'Summary'];
  
  // Data states
  const [filaments, setFilaments] = useState([]);
  const [hardwareItems, setHardwareItems] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    quote_number: '',
    customer_name: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    markup: 0,
    discount: 0,
    quantity: 1
  });
  
  const [quoteFilaments, setQuoteFilaments] = useState([]);
  const [quoteHardware, setQuoteHardware] = useState([]);
  
  const [printSetup, setPrintSetup] = useState({
    printer_id: '',
    printer_name: '',
    print_time: 0,
    power_cost: 0,
    depreciation_cost: 0
  });
  
  const [labour, setLabour] = useState({
    design_minutes: 0,
    preparation_minutes: 5,
    post_processing_minutes: 5,
    other_minutes: 0,
    labour_rate_per_hour: 0,
    total_cost: 0
  });
  
  // Markup is now handled in formData
  const [totalCost, setTotalCost] = useState(0);

  // Fetch data from API
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

        // Fetch active hardware
        const hardwareResponse = await fetch('/api/hardware/active');
        if (!hardwareResponse.ok) {
          throw new Error('Failed to fetch hardware');
        }
        const hardwareData = await hardwareResponse.json();
        setHardwareItems(hardwareData);

        // Fetch active printers
        const printersResponse = await fetch('/api/printers/active');
        if (!printersResponse.ok) {
          throw new Error('Failed to fetch printers');
        }
        const printersData = await printersResponse.json();
        setPrinters(printersData);

        setLoading(false);

        // Only initialize with default values if we're not in edit mode
        // Edit mode will load the quote data in a separate useEffect
        if (!isEditMode) {
          // Initialize with first filament if available
          if (filamentsData.length > 0) {
            const firstFilament = filamentsData[0];
            setQuoteFilaments([{
              id: Date.now(),
              filament_id: firstFilament.id,
              filament_name: firstFilament.name,
              filament_price_per_gram: firstFilament.price_per_kg / 1000,
              grams_used: 0,
              total_cost: 0
            }]);
          }

          // Initialize with first printer if available
          if (printersData.length > 0) {
            setPrintSetup(prev => ({
              ...prev,
              printer_id: printersData[0].id,
              printer_name: printersData[0].name
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [isEditMode]);
  
  // Fetch quote data if in edit mode
  useEffect(() => {
    const loadQuoteData = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/quotes/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quote');
        }
        const data = await response.json();
        
        // Populate form data
        setFormData({
          quote_number: data.quote_number,
          customer_name: data.customer_name,
          title: data.title || '',
          date: data.date,
          notes: data.notes || '',
          markup: data.markup_percent || 0,
          discount: data.discount_percent || 0
        });
        
        // Populate filaments
        if (data.filaments && data.filaments.length > 0) {
          setQuoteFilaments(data.filaments.map(f => ({
            id: f.id,
            filament_id: f.filament_id,
            filament_name: f.filament_name,
            filament_price_per_gram: f.filament_price_per_gram,
            grams_used: f.grams_used,
            total_cost: f.total_cost
          })));
          
          // No need to set multi-material flag anymore
        }
        
        // Populate hardware
        if (data.hardware && data.hardware.length > 0) {
          setQuoteHardware(data.hardware.map(h => ({
            id: h.id,
            hardware_id: h.hardware_id,
            hardware_name: h.hardware_name,
            quantity: h.quantity,
            unit_price: h.unit_price,
            total_cost: h.total_cost
          })));
        }
        
        // Populate print setup
        if (data.print_setup) {
          setPrintSetup({
            printer_id: data.print_setup.printer_id,
            printer_name: data.print_setup.printer_name,
            print_time: data.print_setup.print_time,
            power_cost: data.print_setup.power_cost,
            depreciation_cost: data.print_setup.depreciation_cost
          });
        }
        
        // Populate labour
        if (data.labour) {
          setLabour({
            design_minutes: data.labour.design_minutes,
            preparation_minutes: data.labour.preparation_minutes,
            post_processing_minutes: data.labour.post_processing_minutes,
            other_minutes: data.labour.other_minutes,
            labour_rate_per_hour: data.labour.labour_rate_per_hour,
            total_cost: data.labour.total_cost
          });
        }
        
        // Set markup
        setTotalCost(data.total_cost);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading quote:', error);
        setError('Failed to load quote. Please try again.');
        setLoading(false);
      }
    };
    
    loadQuoteData();
  }, [id, isEditMode]);

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Update markup state when it changes in formData
    if (name === 'markup') {
      setTotalCost(calculateTotalCost(formData.markup, formData.discount));
    }
    
    // Update total when discount changes
    if (name === 'discount') {
      setTotalCost(calculateTotalCost(formData.markup, value));
    }
  };
  
  // Calculate total cost based on all components
  const calculateTotalCost = (markupValue, discountValue) => {
    const filamentTotal = quoteFilaments.reduce((sum, f) => sum + f.total_cost, 0);
    const hardwareTotal = quoteHardware.reduce((sum, h) => sum + h.total_cost, 0);
    const powerCost = printSetup.power_cost || 0;
    const depreciationCost = printSetup.depreciation_cost || 0;
    const labourCost = labour.total_cost || 0;
    
    const subtotal = filamentTotal + hardwareTotal + powerCost + depreciationCost + labourCost;
    const markupAmount = subtotal * (markupValue / 100);
    const afterMarkup = subtotal + markupAmount;
    const discountAmount = afterMarkup * (discountValue / 100);
    
    return afterMarkup - discountAmount;
  };

  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevActiveStep) => {
      const nextStep = prevActiveStep + 1;
      // Update the max step reached if we're going to a new step
      if (nextStep > maxStepReached) {
        setMaxStepReached(nextStep);
      }
      return nextStep;
    });
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Navigate directly to a specific step
  const handleStepClick = (stepIndex) => {
    // When editing an existing quote, allow navigation to any step
    // For new quotes, allow navigation to any step we've previously reached
    if (isEditMode || stepIndex <= maxStepReached) {
      setActiveStep(stepIndex);
    }
  };

  // Validate current step
  const validateStep = () => {
    switch (activeStep) {
      case 0: // Job Info
        return formData.customer_name && formData.date && formData.title;
      case 1: // Filament
        return quoteFilaments.length > 0 && quoteFilaments.every(f => f.grams_used > 0);
      case 2: // Hardware
        return true; // Hardware is optional
      case 3: // Print Setup
        return printSetup.printer_id && printSetup.print_time > 0;
      case 4: // Labour
        return true; // Labour fields have defaults
      case 5: // Summary
        return true;
      default:
        return true;
    }
  };

  // Save quote
  const saveQuote = async () => {
    setSaving(true);
    setError(null);

    try {
      // Prepare quote data
      const quoteData = {
        quote_number: formData.quote_number,
        title: formData.title,
        customer_name: formData.customer_name,
        date: formData.date,
        notes: formData.notes,
        markup_percent: formData.markup,
        discount_percent: formData.discount,
        quantity: formData.quantity,
        total_cost: totalCost,
        
        // Filament data
        filaments: quoteFilaments.map(f => ({
          filament_id: parseInt(f.filament_id),
          filament_name: f.filament_name,
          filament_price_per_gram: f.filament_price_per_gram,
          grams_used: f.grams_used,
          total_cost: f.total_cost
        })),
        
        // Hardware data
        hardware: quoteHardware.map(h => ({
          hardware_id: parseInt(h.hardware_id),
          hardware_name: h.hardware_name,
          quantity: h.quantity,
          unit_price: h.unit_price,
          total_cost: h.total_cost
        })),
        
        // Print setup data
        print_setup: {
          printer_id: parseInt(printSetup.printer_id),
          printer_name: printSetup.printer_name,
          print_time: printSetup.print_time,
          power_cost: printSetup.power_cost,
          depreciation_cost: printSetup.depreciation_cost
        },
        
        // Labour data
        labour: {
          design_minutes: parseInt(labour.design_minutes),
          preparation_minutes: parseInt(labour.preparation_minutes),
          post_processing_minutes: parseInt(labour.post_processing_minutes),
          other_minutes: parseInt(labour.other_minutes),
          labour_rate_per_hour: parseFloat(labour.labour_rate_per_hour),
          total_cost: labour.total_cost
        }
      };

      // Set title for new quotes if not provided
      if (!isEditMode && !formData.title) {
        quoteData.title = `${formData.quote_number} - ${formData.customer_name}`;
      }
      
      // Save or update quote
      const saveResponse = await fetch(isEditMode ? `/api/quotes/${id}` : '/api/quotes', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save quote');
      }

      const savedQuote = await saveResponse.json();
      
      // Navigate to the saved quote
      // For edit mode, use the existing ID if savedQuote.id is undefined
      const quoteId = isEditMode ? (savedQuote.id || id) : savedQuote.id;
      navigate(`/quote/${quoteId}`);
    } catch (error) {
      console.error('Error saving quote:', error);
      setError(error.message);
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

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <JobInfo 
            formData={formData} 
            handleInputChange={handleInputChange}
            isEditMode={isEditMode}
          />
        );
      case 1:
        return (
          <FilamentUsage 
            filaments={filaments} 
            quoteFilaments={quoteFilaments} 
            setQuoteFilaments={setQuoteFilaments}
            currencySymbol={settings.currency_symbol}
          />
        );
      case 2:
        return (
          <HardwareUsage 
            hardwareItems={hardwareItems} 
            quoteHardware={quoteHardware} 
            setQuoteHardware={setQuoteHardware}
            currencySymbol={settings.currency_symbol}
          />
        );
      case 3:
        return (
          <PrintSetup 
            printers={printers} 
            printSetup={printSetup} 
            setPrintSetup={setPrintSetup}
            currencySymbol={settings.currency_symbol}
          />
        );
      case 4:
        return (
          <Labour 
            labour={labour} 
            setLabour={setLabour}
            currencySymbol={settings.currency_symbol}
          />
        );
      case 5:
        return (
          <CostSummary
            quoteFilaments={quoteFilaments}
            quoteHardware={quoteHardware}
            printSetup={printSetup}
            labour={labour}
            markup={parseFloat(formData.markup) || 0}
            discount={parseFloat(formData.discount) || 0}
            quantity={parseInt(formData.quantity) || 1}
            totalCost={totalCost}
            setTotalCost={setTotalCost}
            currencySymbol={settings.currency_symbol || '$'}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        {isEditMode ? 'Edit Quote' : 'New Quote'}
      </Typography>

      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: 4,
            minWidth: { xs: 600, md: '100%' }, // Force minimum width on mobile
            '& .MuiStepLabel-root': {
              ...(isEditMode && {
                // In edit mode, make ALL steps look accessible with primary.light color
                '& .MuiStepIcon-root': {
                  '&:not(.Mui-active):not(.Mui-completed)': {
                    color: 'primary.light'
                  }
                }
              }),
              ...(!isEditMode && {
                // In new quote mode, only color steps we've reached
                '& .MuiStepIcon-root': {
                  '&:not(.Mui-active):not(.Mui-completed)': {
                    // Apply conditional styling based on index
                    '&.MuiStepIcon-root[data-reached="true"]': {
                      color: 'primary.light'
                    }
                  }
                }
              })
            }
          }}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                sx={{
                  '& .MuiStepLabel-labelContainer': {
                    // Hide text on very small screens
                    display: { xs: 'none', sm: 'block' },
                    // Make future step labels slightly darker than default if they're accessible
                    ...((isEditMode || (index <= maxStepReached && index > activeStep)) && {
                      color: 'text.primary'
                    })
                  },
                  ...((isEditMode || index <= maxStepReached) && {
                    cursor: 'pointer',
                    '&:hover': {
                      '& .MuiStepLabel-label': {
                        color: 'primary.main'
                      }
                    }
                  }),
                  // Add custom styling for the step icon
                  '& .MuiStepIcon-root': {
                    // This will be used by our CSS selector
                    ...(index <= maxStepReached && {
                      '&::after': {
                        content: '"reached"'
                      }
                    })
                  }
                }}
                onClick={() => handleStepClick(index)}
                // Add a data attribute to indicate if this step has been reached
                StepIconProps={{
                  'data-reached': index <= maxStepReached
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {getStepContent(activeStep)}

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: { xs: 'stretch', sm: 'space-between' },
        gap: 2,
        mt: 2 
      }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<BackIcon />}
          disabled={activeStep === 0}
          sx={{ order: { xs: 2, sm: 1 } }}
          fullWidth={false}
        >
          Back
        </Button>
        <Box sx={{ 
          order: { xs: 1, sm: 2 },
          alignSelf: { xs: 'stretch', sm: 'auto' }
        }}>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={saveQuote}
              startIcon={<SaveIcon />}
              disabled={saving || !validateStep()}
              fullWidth
            >
              {saving ? <CircularProgress size={24} /> : 'Save Quote'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
              disabled={!validateStep()}
              fullWidth
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default QuoteBuilder;
