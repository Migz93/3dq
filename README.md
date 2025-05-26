# 3DQ - 3D Printing Quote Tool

3DQ is a comprehensive self-hosted quoting tool for 3D-printed parts. It helps you calculate accurate quotes for 3D printing jobs by considering filament costs, printer depreciation, power usage, labor, and more. This tool is designed for 3D printing businesses and hobbyists who need to provide professional quotes to their clients.

![3DQ Screenshot](https://via.placeholder.com/800x450.png?text=3DQ+Screenshot)

## Features

### Quote Management
- **Quote Builder**: Create detailed quotes with a step-by-step process
- **Quick Quote**: Generate fast quotes with minimal inputs
- **Quote History**: View and manage all past quotes
- **PDF Export**: Generate client-friendly or detailed internal invoices
- **Historical Accuracy**: Quotes maintain their original values even when settings change

### Resource Management
- **Filament Management**: Add, edit, and archive filament types with pricing
- **Printer Management**: Configure your printers with depreciation and power usage calculations
- **Hardware Management**: Track additional components used in prints (screws, magnets, etc.)

### Settings & Configuration
- **Global Settings**: Configure electricity costs, labor rates, default markup percentage
- **Currency Settings**: Set your preferred currency symbol
- **Quote Numbering**: Automatic sequential quote number generation (e.g., 3DQ0001)
- **UI Customization**: Set accent color for the application

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

For detailed installation instructions, see the [Technical README](TECHNICAL_README.md).

## Usage Guide

### Initial Setup

1. First, configure your settings (Settings page)
   - Set your electricity cost per kWh
   - Configure labor rate per hour
   - Set default markup percentage
   - Choose your currency symbol

2. Add your resources:
   - **Filaments**: Add your filament types with costs per kg
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
8. Save the quote and generate a PDF if required

#### Using Quick Quote
1. Navigate to the Quotes page and click "Quick Quote"
2. Enter basic information and get an instant price estimate
3. Save or refine the quote as needed

## Data Persistence

All your data is stored locally:

- **Database**: Contains all your filaments, printers, hardware, quotes, and settings
- **Generated PDFs**: Saved in the quotes directory for easy access

## Troubleshooting

If you encounter any issues, check the [Technical README](TECHNICAL_README.md) for troubleshooting tips.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

