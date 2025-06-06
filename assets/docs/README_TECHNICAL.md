# 3DQ - Technical Documentation

This document provides technical details about the 3DQ application architecture, development, and deployment.

## Technology Stack

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI v5)
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTML Invoices**: Responsive invoice templates with print functionality that inherit brand colors
- **Branding**: Custom logo and favicon integration
- **Key Components**:
    - `ViewQuote.js`: Displays quote details and provides actions for editing, duplicating, deleting, and generating invoices
    - `Sidebar.js`: Provides navigation with integrated logo and accent color theming
    - `TopBar.js`: Displays context-aware page titles and navigation controls
    - `SettingsContext.js`: Manages application-wide settings including accent color
    - `DynamicLogo.js`: SVG logo component with dynamic accent color application

### Backend
- **Server**: Express.js (Node.js)
- **Database**: SQLite with better-sqlite3
- **API**: RESTful API endpoints
- **External Integrations**: Spoolman API for filament synchronization

## Logo Implementation

The application uses a custom SVG logo that dynamically adapts to the user's accent color preference:

- The logo is directly embedded as SVG code within the `DynamicLogo.js` component (`/client/src/components/logo/DynamicLogo.js`)
- SVG elements that should change color based on the accent color use the `className="accent-color"` attribute
- The component applies the current accent color from the SettingsContext to these elements using inline CSS
- To update the logo, the SVG code in the `DynamicLogo.js` file must be modified directly
- The favicon also uses the same SVG file, referenced in `/client/public/index.html`

### Logo Customization Process

1. When creating a new logo, export it as SVG
2. Identify which parts of the SVG should change color with the accent color
3. Add the `className="accent-color"` attribute to those SVG elements
4. Replace the SVG code in the `DynamicLogo.js` component
5. Ensure the SVG viewBox and other attributes are preserved

## Project Structure

```
3dq/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # Reusable components
│       │   ├── layout/     # Layout components (Sidebar, TopBar)
│       │   ├── logo/       # Logo components (DynamicLogo)
│       │   └── quote/      # Quote-related components
│       ├── context/        # React Context providers
│       ├── pages/          # Page components
│       ├── utils/          # Utility functions
│       └── App.js          # Main App component
├── config/                 # Configuration and data (persisted)
│   ├── 3dq.sqlite         # SQLite database
│   └── quotes/            # Directory for data persistence
├── routes/                 # Express API routes
│   ├── filaments.js       # Filament management routes
│   ├── quotes.js          # Quote management routes
│   ├── spoolman.js        # Spoolman integration routes
│   └── ...                # Other API routes
├── utils/                  # Utility scripts
│   └── init-db.js         # Database initialization script with example data
├── server.js              # Express server entry point
└── package.json           # Project dependencies
```

## Responsive Design

The 3DQ application is designed to be responsive and work well on both desktop and mobile devices:

### Collapsible Sidebar
- The sidebar can be toggled open/closed on all screen sizes
- Automatically collapses on mobile devices to maximize content space
- Remembers state when manually closed on desktop
- Toggle button in the top bar for easy access

### Adaptive Layouts
- Tables adjust for mobile viewing with horizontal scrolling
- Text truncation with ellipsis for longer content on small screens
- Form layouts adapt to screen size (stacked on mobile, side-by-side on desktop)
- Proper spacing and alignment on all screen sizes

### Theme and Styling
- Dark mode UI with customizable accent color
- Material UI components for consistent look and feel
- Print-friendly invoice templates

## Frontend Development

### Making and Applying Changes

The 3DQ application uses a React frontend that is built and then served by the Express backend. When you make changes to the frontend code (files in the `client/src` directory), you need to rebuild the frontend for those changes to take effect in the running application.

#### When to Rebuild

You need to rebuild the frontend in the following scenarios:

- After modifying React components (`.js` files in `client/src`)  
- After updating styles (CSS files)
- After adding new frontend dependencies
- After modifying routes or context providers

#### How to Rebuild

To rebuild the frontend after making changes:

```bash
# Stop the running server (if it's running)
# Then rebuild the frontend
npm run build

# Start the server again to serve the updated frontend
npm start
```

The `npm run build` command compiles the React application into optimized static files in the `client/build` directory, which the Express server then serves to clients.

## Calculations

### Filament Cost
```
filament_cost = (grams_used / 1000) * price_per_kg
```

### Printer Depreciation
```
depreciation_per_hour = (price + service_cost) / depreciation_time
depreciation_cost = print_time * depreciation_per_hour
```

### Power Cost
```
power_cost = print_time * power_usage * electricity_cost_per_kwh
```

### Labour Cost
```
total_minutes = design_minutes + preparation_minutes + post_processing_minutes + other_minutes
labour_cost = (total_minutes / 60) * labour_rate_per_hour
```

### Total Cost
```
subtotal = filament_cost + hardware_cost + power_cost + depreciation_cost + labour_cost
markup = subtotal * (markup_percent / 100)
total_before_discount = subtotal + markup
discount = total_before_discount * (discount_percent / 100)
total_cost = total_before_discount - discount
```

## External Integrations

### Spoolman Integration

3DQ integrates with [Spoolman](https://github.com/Donkie/Spoolman), a filament management system for 3D printing. This integration allows users to synchronize filament data from Spoolman to 3DQ.

#### Features

- One-way synchronization from Spoolman to 3DQ
- Automatic color and price information import

#### Implementation

- Settings page controls for enabling/disabling integration and setting the URL
- Filaments page has a "Sync with Spoolman" button
- API endpoint: `GET {spoolman_url}/api/v1/spool`
- Routes in `/api/spoolman` handle all Spoolman-related functionality

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

## Docker Build

To build the Docker image:

```bash
docker build -t 3dq .
```

The Dockerfile:
- Uses Node.js as the base image
- Installs dependencies for both backend and frontend
- Builds the React frontend
- Sets environment variables
- Exposes port 6123
- Starts the application with `npm start`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| PORT | Port for the Express server | 6123 |
| NODE_ENV | Environment (development/production) | development |
| CONFIG_DIR | Directory for configuration and data | ./config |

## Data Persistence

The application uses a SQLite database for data storage. The database file is stored in the `config` directory, which can be mounted as a volume in Docker for persistence.

## Invoicing System

The application generates HTML invoices directly on the backend:

### Implementation
- Backend route `GET /api/quotes/:id/invoice/:type` in `/routes/quotes.js` generates the HTML
- Fetches all quote data (filament, hardware, print setup, labour, company settings)
- Performs calculations (costs, markups, discounts)
- Constructs complete HTML with embedded CSS

### Invoice Types
- **Client Invoice**: Shows summary and final price for customers
- **Internal Invoice**: Shows detailed cost breakdowns and full financial summary

### Frontend Integration
- `ViewQuote.js` has 'Generate Client Invoice' and 'Generate Internal Invoice' buttons
- `generateInvoice(type)` function calls the API endpoint and opens the HTML in a new browser tab

### Features
- Print/Save as PDF button (hidden on actual print)
- Print-specific CSS for table borders and header background colors
- Company name from settings used in invoice headers

## Default Data and Examples

The application initializes with example data to help users understand the system:

### Default Settings
- Electricity cost: £0.2166 per kWh
- Labour rate: £13.00 per hour
- Default markup: 50%
- Currency symbol: £
- Quote prefix: 3DQ
- Company name: "Prints Inc"

### Default Resources
- **Printer**: Bambu Lab X1 Carbon with 100W power usage and £0.14/hour depreciation
- **Filament**: Bambu Lab PLA Basic - Black at £17.49/kg
- **Hardware**: Various components including battery holders, USB cables, and LED strips

### Example Quote
A complete example quote ("Tardis Lightbox") is included with the following details:
- 100g of PLA filament
- 1 LED strip
- 6 hours print time on the Bambu Lab X1 Carbon
- 10 minutes of labor (5 min preparation, 5 min post-processing)
- 50% markup and 5% discount

## Troubleshooting

### Database Issues
If you encounter database errors, you may need to reinitialize the database:

```bash
rm -f config/3dq.sqlite
node utils/init-db.js
```

### API Errors
Check the server logs for detailed error messages. Most API errors will be logged to the console.

## Recent Updates

### Discount Feature
- Added `discount_percent` column to the quotes table
- Implemented discount calculation in the quote builder and view quote pages
- Updated invoice templates to display subtotal, discount, and final total

## Database Schema and API Reference

### API Endpoints

#### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update a setting
- `GET /api/settings/quote/next-number` - Get the next quote number

#### Filaments
- `GET /api/filaments` - Get all filaments
- `GET /api/filaments/active` - Get active filaments
- `GET /api/filaments/:id` - Get a single filament
- `POST /api/filaments` - Create a filament
- `PUT /api/filaments/:id` - Update a filament
- `DELETE /api/filaments/:id` - Delete a filament
- `PATCH /api/filaments/:id/toggle-status` - Archive/unarchive a filament

#### Printers
- `GET /api/printers` - Get all printers
- `GET /api/printers/active` - Get active printers
- `GET /api/printers/:id` - Get a single printer
- `POST /api/printers` - Create a printer
- `PUT /api/printers/:id` - Update a printer
- `DELETE /api/printers/:id` - Delete a printer
- `PATCH /api/printers/:id/toggle-status` - Archive/unarchive a printer

#### Hardware
- `GET /api/hardware` - Get all hardware items
- `GET /api/hardware/active` - Get active hardware items
- `GET /api/hardware/:id` - Get a single hardware item
- `POST /api/hardware` - Create a hardware item
- `PUT /api/hardware/:id` - Update a hardware item
- `DELETE /api/hardware/:id` - Delete a hardware item
- `PATCH /api/hardware/:id/toggle-status` - Archive/unarchive a hardware item

#### Quotes
- `GET /api/quotes` - Get all quotes
- `GET /api/quotes/:id` - Get a single quote with all related data
- `POST /api/quotes` - Create a quote
- `PUT /api/quotes/:id` - Update a quote
- `DELETE /api/quotes/:id` - Delete a quote
- `GET /api/quotes/:id/invoice/:type` - Generate an HTML invoice for a quote (internal or client)

#### Spoolman
- `GET /api/spoolman/status` - Get Spoolman integration status
- `POST /api/spoolman/test-connection` - Test connection to Spoolman
- `POST /api/spoolman/sync` - Sync filaments from Spoolman

### Database Schema

#### Settings Table
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
```

#### Filaments Table
```sql
CREATE TABLE IF NOT EXISTS filaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  diameter REAL NOT NULL,
  spool_weight REAL NOT NULL,
  spool_price REAL NOT NULL,
  density REAL,
  price_per_kg REAL NOT NULL,
  color TEXT NOT NULL,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  spoolman_id INTEGER,
  spoolman_synced BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### Printers Table
```sql
CREATE TABLE IF NOT EXISTS printers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  material_diameter REAL NOT NULL,
  price REAL NOT NULL,
  depreciation_time REAL NOT NULL,
  service_cost REAL NOT NULL,
  power_usage REAL NOT NULL,
  depreciation_per_hour REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### Hardware Table
```sql
CREATE TABLE IF NOT EXISTS hardware (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### Quotes Table
```sql
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_number TEXT NOT NULL,
  title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  markup_percent REAL NOT NULL,
  total_cost REAL NOT NULL,
  is_quick_quote BOOLEAN NOT NULL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### Quote Filaments Table
```sql
CREATE TABLE IF NOT EXISTS quote_filaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  filament_id INTEGER NOT NULL,
  filament_name TEXT NOT NULL,
  filament_price_per_gram REAL NOT NULL,
  grams_used REAL NOT NULL,
  total_cost REAL NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (filament_id) REFERENCES filaments(id) ON DELETE RESTRICT
)
```

#### Quote Hardware Table
```sql
CREATE TABLE IF NOT EXISTS quote_hardware (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  hardware_id INTEGER NOT NULL,
  hardware_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_cost REAL NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (hardware_id) REFERENCES hardware(id) ON DELETE RESTRICT
)
```

#### Quote Print Setup Table
```sql
CREATE TABLE IF NOT EXISTS quote_print_setup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  printer_id INTEGER NOT NULL,
  printer_name TEXT NOT NULL,
  print_time REAL NOT NULL,
  power_cost REAL NOT NULL,
  depreciation_cost REAL NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE RESTRICT
)
```

#### Quote Labour Table
```sql
CREATE TABLE IF NOT EXISTS quote_labour (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  design_minutes INTEGER NOT NULL DEFAULT 0,
  preparation_minutes INTEGER NOT NULL DEFAULT 5,
  post_processing_minutes INTEGER NOT NULL DEFAULT 5,
  other_minutes INTEGER NOT NULL DEFAULT 0,
  labour_rate_per_hour REAL NOT NULL,
  total_cost REAL NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
)
```