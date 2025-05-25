# 3DQ - 3D Printing Quote Tool

3DQ is a self-hosted quoting tool for 3D-printed parts. It helps you calculate accurate quotes for 3D printing jobs by considering filament costs, printer depreciation, power usage, labor, and more.

## Features

- **Filament Management**: Add, edit, and archive filament types with pricing
- **Printer Management**: Configure your printers with depreciation and power usage
- **Hardware Management**: Track additional components used in prints
- **Quote Builder**: Create detailed quotes with multi-material support
- **Quick Quote**: Generate fast quotes with minimal inputs
- **PDF Export**: Generate client-friendly or detailed internal invoices
- **Historical Accuracy**: Quotes maintain their original values even when settings change

## Technology Stack

- **Frontend**: React with Material-UI
- **Backend**: Express.js (Node.js)
- **Database**: SQLite

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
npm run install-all
```

3. Initialize the database:

```bash
node database/init-db.js
```

4. Start the development server:

```bash
npm run dev
```

This will start both the backend server and the React development server.

## Production Deployment

To build the application for production:

```bash
npm run build
npm start
```

The Express server will serve the built React application.

## Usage

1. First, configure your settings (currency, electricity cost, etc.)
2. Add your filaments, printers, and hardware items
3. Create quotes using either the Quick Quote or full Quote Builder
4. Export quotes as PDFs for your clients

## License

MIT
