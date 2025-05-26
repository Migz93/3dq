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
    customer_name: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
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
  
  const [markup, setMarkup] = useState(0);
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
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Fetch quote data if in edit mode
  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/quotes/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quote');
        }
        const quoteData = await response.json();
        
        // Populate form data
        setFormData({
          customer_name: quoteData.customer_name,
          title: quoteData.title,
          date: quoteData.date,
          notes: quoteData.notes || ''
        });
        
        // Populate filaments
        if (quoteData.filaments && quoteData.filaments.length > 0) {
          setQuoteFilaments(quoteData.filaments.map(f => ({
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
        if (quoteData.hardware && quoteData.hardware.length > 0) {
          setQuoteHardware(quoteData.hardware.map(h => ({
            id: h.id,
            hardware_id: h.hardware_id,
            hardware_name: h.hardware_name,
            quantity: h.quantity,
            unit_price: h.unit_price,
            total_cost: h.total_cost
          })));
        }
        
        // Populate print setup
        if (quoteData.printSetup) {
          setPrintSetup({
            printer_id: quoteData.printSetup.printer_id,
            printer_name: quoteData.printSetup.printer_name,
            print_time: quoteData.printSetup.print_time,
            power_cost: quoteData.printSetup.power_cost,
            depreciation_cost: quoteData.printSetup.depreciation_cost
          });
        }
        
        // Populate labour
        if (quoteData.labour) {
          setLabour({
            design_minutes: quoteData.labour.design_minutes,
            preparation_minutes: quoteData.labour.preparation_minutes,
            post_processing_minutes: quoteData.labour.post_processing_minutes,
            other_minutes: quoteData.labour.other_minutes,
            labour_rate_per_hour: quoteData.labour.labour_rate_per_hour,
            total_cost: quoteData.labour.total_cost
          });
        }
        
        // Set markup
        setMarkup(quoteData.markup_percent);
        setTotalCost(quoteData.total_cost);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quote data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchQuoteData();
  }, [id, isEditMode]);

  // Handle form input change for job info
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Validate current step
  const validateStep = () => {
    switch (activeStep) {
      case 0: // Job Info
        return formData.customer_name && formData.date;
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
      let quoteData = {
        title: formData.title,
        customer_name: formData.customer_name,
        date: formData.date,
        notes: formData.notes,
        markup_percent: markup,
        total_cost: totalCost,
        is_quick_quote: false,
        
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
        printSetup: {
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

      // Get quote number for new quotes
      if (!isEditMode) {
        const quoteNumberResponse = await fetch('/api/settings/quote/next-number');
        if (!quoteNumberResponse.ok) {
          throw new Error('Failed to get quote number');
        }
        const quoteNumberData = await quoteNumberResponse.json();
        quoteData.quote_number = quoteNumberData.quote_number;
        quoteData.title = formData.title || `${quoteNumberData.quote_number} - ${formData.customer_name}`;
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
      navigate(`/quote/${savedQuote.id}`);
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
            markup={markup}
            setMarkup={setMarkup}
            totalCost={totalCost}
            setTotalCost={setTotalCost}
            currencySymbol={settings.currency_symbol}
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

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {getStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<BackIcon />}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={saveQuote}
              startIcon={<SaveIcon />}
              disabled={saving || !validateStep()}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Quote'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
              disabled={!validateStep()}
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
