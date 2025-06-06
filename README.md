<p align="center">
  <img src="assets/images/Logo.svg" alt="3DQ Logo"/>
</p>

3DQ is a self-hosted quoting tool for 3D prints.
It helps you calculate quotes for 3D printing jobs by considering filament costs, power usage, printer depreciation, labor, and more.

# Preview

![Home Page](./assets/screenshots/Screenshot_Home.jpg)
![Quote](./assets/screenshots/Screenshot_Quote.jpg)
![Invoice](./assets/screenshots/Screenshot_Invoice.jpg)
![InvoiceInternal](./assets/screenshots/Screenshot_InvoiceInternal.jpg)

## Features

### Quote Management
- **Quote Builder**: Create detailed quotes with a step-by-step process
- **Quick Quote**: Generate fast quotes with minimal inputs
- **Quote Viewing & History**: View detailed quote information, including print setup (printer, duration, power/depreciation costs) and a comprehensive cost summary (breakdown of production costs and financial totals). Manage all past quotes.
- **HTML Invoices**: Generate client-friendly or detailed internal invoices with print functionality that inherits your brand colors
- **Historical Accuracy**: Quotes maintain their original values even when settings change
- **Discount Support**: Apply percentage-based discounts to quotes that are reflected in invoices
- **Clearer Invoice Icons**: Updated icons for generating client and internal invoices.

### Resource Management
- **Filament Management**: Add, edit, and archive filament types with pricing
- **Spoolman Integration**: Sync filaments with Spoolman, a filament management system
- **Printer Management**: Configure your printers with depreciation and power usage calculations
- **Hardware Management**: Track additional components used in prints (screws, magnets, etc.)

### UI/UX Features
- **Consistent Branding**: Professional logo and favicon for a polished look
- **Customizable Accent Color**: Personalize the application with your brand color throughout the interface
- **Responsive Design**: Works on desktop and mobile devices
- **Branded Invoices**: Invoices automatically use your accent color for a consistent brand experience
- **Intuitive Navigation**: Clear page titles and organized sidebar for easy access to all features

### Settings & Configuration
- **Global Settings**: Configure electricity costs, labor rates, default markup percentage
- **Currency Settings**: Set your preferred currency symbol
- **Company Branding**: Set your company name for invoices (default: "Prints Inc")
- **Quote Numbering**: Automatic sequential quote number generation (e.g., 3DQ0001)
- **UI Customization**: Set accent color for the application
- **External Integrations**: Configure Spoolman URL for filament synchronization

## Getting Started

### Quick Start with Docker

```bash
# Create a directory for persistent data
mkdir -p ~/3dq-data

# Run the container
docker run -d \
  --name 3dq \
  -p 6123:6123 \
  -v ~/3dq-data:/config \
  -e CONFIG_DIR=/config \
  miguel1993/3dq:latest
```

Then access the application at http://localhost:6123

### Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  3dq:
    image: miguel1993/3dq:latest
    container_name: 3dq
    ports:
      - "6123:6123"
    volumes:
      - ./data:/config
    environment:
      - CONFIG_DIR=/config
    restart: unless-stopped
```

Then run:

```bash
docker-compose up -d
```

### Manual Installation

1. Ensure you have Node.js (v14+) installed
2. Clone the repository
3. Install dependencies: `npm install`
4. Start the application: `npm start`
5. Access the application at http://localhost:6123



## Usage Guide

### Spoolman Integration

3DQ now integrates with [Spoolman](https://github.com/Donkie/Spoolman), a filament management system for 3D printing. This integration allows you to sync your filament spools from Spoolman directly into 3DQ, saving you time and ensuring consistency between systems.

To use the Spoolman integration:

1. Go to the Settings page and enable "Sync Filament With Spoolman Spools"
2. Enter your Spoolman URL (e.g., `http://localhost:7912` or any URL where your Spoolman instance is hosted)
3. Save the settings
4. Go to the Filaments page and click the "Sync with Spoolman" button
5. Your filaments will be imported from Spoolman with all relevant details (name, type, weight, price, etc.)

The integration preserves all the important data from Spoolman including:
- Vendor information
- Material type
- Color (including hex color codes and support for multi-color filaments)
- Weight and price information
- Density and diameter

**Important Notes:**
- Editing a Spoolman-synced filament will unlink it from Spoolman (with a warning dialog)
- The filament page shows which filaments are synced from Spoolman
- Multi-color filaments from Spoolman are supported (using the first color in the list)

### Initial Setup

1. First, configure your settings (Settings page)
   - Set your electricity cost per kWh
   - Configure labor rate per hour
   - Set default markup percentage
   - Choose your currency symbol

2. Add your resources:
   - **Filaments**: Add your filament types with costs per kg (or sync from Spoolman)
   - **Printers**: Configure your printers with purchase cost, estimated lifespan, and power consumption
   - **Hardware**: Add any hardware components you frequently use in prints

### Creating Quotes

#### Using Quote Builder
1. Navigate to the Quotes page and click "New Quote"
2. Fill in the job information (client name, project details)
3. Add filament usage details for each material used
4. Include any hardware components
5. Configure print setup (print time, electricity usage)
6. Add labor costs
7. Review the cost summary and adjust markup if needed
8. Save the quote and generate an invoice if required

#### Using Quick Quote
1. Navigate to the Quotes page and click "Quick Quote"
2. Enter basic information and get an instant price estimate
3. Save or refine the quote as needed

## Data Persistence

All your data is stored locally:

- **Database**: Contains all your filaments, printers, hardware, quotes, and settings
- **Quote Data**: All quote information is stored in the database for easy access and invoice generation
- **Example Data**: The application includes an example quote (Tardis Lightbox) with realistic values to help you understand how the system works

## Security Notice

3DQ was developed with the use of AI technologies (Windsurf with Claude 3.7 Sonnet). We can't verify that best practices were followed nor that the code is free of vulnerabilities.
Therefore we recommend:

- **Local Network Only**: For optimal security, run 3DQ on your local network rather than exposing it directly to the internet
- **Use VPN**: If remote access is needed, consider using a VPN
- **Regular Backups**: Keep regular backups of your database file located in the config directory
- **Updates**: Check for updates regularly as security improvements may be released

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

