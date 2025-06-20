import React, { createContext } from 'react';

const SettingsContext = createContext({
  settings: {
    electricity_cost_per_kwh: 0.2166,
    labour_rate_per_hour: 13.00,
    default_markup_percent: 50,
    currency_symbol: '£',
    quote_prefix: '3DQ',
    accent_color: '#E53935',
    company_name: 'Prints Inc',
    tax_rate: 0
  },
  setSettings: () => {}
});

export const SettingsProvider = SettingsContext.Provider;
export const SettingsConsumer = SettingsContext.Consumer;
export default SettingsContext;
