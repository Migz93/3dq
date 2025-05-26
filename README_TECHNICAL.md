# 3DQ - Technical Documentation

This document provides technical details about the 3DQ application architecture, development, and deployment.

## Technology Stack

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI v5)
- **State Management**: React Context API
- **Routing**: React Router v6
- **PDF Generation**: React-PDF

### Backend
- **Server**: Express.js (Node.js)
- **Database**: SQLite with better-sqlite3
- **API**: RESTful API endpoints

## Project Structure

```
3dq/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # Reusable components
│       │   ├── layout/     # Layout components (Sidebar, Header)
│       │   └── quote/      # Quote-related components
│       ├── context/        # React Context providers
│       ├── pages/          # Page components
│       ├── utils/          # Utility functions
│       └── App.js          # Main App component
├── config/                 # Configuration and data (persisted)
│   ├── 3dq.sqlite         # SQLite database
│   └── quotes/            # Generated PDF quotes
├── routes/                 # Express API routes
├── utils/                  # Utility scripts
│   └── init-db.js         # Database initialization script
├── server.js              # Express server entry point
└── package.json           # Project dependencies
```

## Database Schema

### Settings Table
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
```

### Filaments Table
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Printers Table
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

### Hardware Table
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

### Quotes Table
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Quote Filaments Table
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

### Quote Hardware Table
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

### Quote Print Setup Table
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

### Quote Labour Table
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

## API Endpoints

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update a setting
- `GET /api/settings/quote/next-number` - Get the next quote number

### Filaments
- `GET /api/filaments` - Get all filaments
- `GET /api/filaments/active` - Get active filaments
- `GET /api/filaments/:id` - Get a single filament
- `POST /api/filaments` - Create a filament
- `PUT /api/filaments/:id` - Update a filament
- `DELETE /api/filaments/:id` - Delete a filament
- `PATCH /api/filaments/:id/toggle-status` - Archive/unarchive a filament

### Printers
- `GET /api/printers` - Get all printers
- `GET /api/printers/active` - Get active printers
- `GET /api/printers/:id` - Get a single printer
- `POST /api/printers` - Create a printer
- `PUT /api/printers/:id` - Update a printer
- `DELETE /api/printers/:id` - Delete a printer
- `PATCH /api/printers/:id/toggle-status` - Archive/unarchive a printer

### Hardware
- `GET /api/hardware` - Get all hardware items
- `GET /api/hardware/active` - Get active hardware items
- `GET /api/hardware/:id` - Get a single hardware item
- `POST /api/hardware` - Create a hardware item
- `PUT /api/hardware/:id` - Update a hardware item
- `DELETE /api/hardware/:id` - Delete a hardware item
- `PATCH /api/hardware/:id/toggle-status` - Archive/unarchive a hardware item

### Quotes
- `GET /api/quotes` - Get all quotes
- `GET /api/quotes/:id` - Get a single quote with all related data
- `POST /api/quotes` - Create a quote
- `PUT /api/quotes/:id` - Update a quote
- `DELETE /api/quotes/:id` - Delete a quote
- `GET /api/quotes/:id/pdf/:type` - Generate a PDF for a quote (internal or client)

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/3dq.git
   cd 3dq
   ```

2. Install dependencies
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. Create a `.env` file in the root directory
   ```
   PORT=6123
   NODE_ENV=development
   ```

4. Initialize the database
   ```bash
   node utils/init-db.js
   ```

5. Start the development server
   ```bash
   # Start backend only
   npm start
   
   # Start frontend and backend concurrently
   npm run dev
   ```

### Building for Production
```bash
# Build the React frontend
cd client && npm run build && cd ..

# Start the production server
npm start
```

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
|----------|-------------|---------|
| PORT | Port for the Express server | 6123 |
| NODE_ENV | Environment (development/production) | development |
| CONFIG_DIR | Directory for configuration and data | ./config |

## Data Persistence

The application uses a SQLite database for data storage. The database file is stored in the `config` directory, which can be mounted as a volume in Docker for persistence.

Generated PDF quotes are stored in the `config/quotes` directory, which is also mounted as a volume in Docker.

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
total_cost = subtotal + markup
```

## Troubleshooting

### Database Issues
If you encounter database errors, you may need to reinitialize the database:

```bash
rm -f config/3dq.sqlite
node utils/init-db.js
```

### API Errors
Check the server logs for detailed error messages. Most API errors will be logged to the console.
