# 3DQ Invoice Documentation

This document outlines the structure and design of the invoice system in 3DQ, including both client-facing and internal invoices.

## Invoice Types

The 3DQ application supports two types of invoices:

1. **Client Invoice**: A simplified, customer-facing invoice that shows only necessary information without detailed costs.
2. **Internal Invoice**: A comprehensive invoice with detailed breakdowns of all costs, markups, and calculations for business use.

## Client Invoice Design

The client invoice is designed to be clean, professional, and easy to understand for customers.

### Header Section
- **Title**: The company name followed by "- Invoice" (e.g., "Prints Inc - Invoice")
- **Blue Divider Line**: A horizontal blue line (#3498db) separates the header from the information section

### Information Section
- A 2x2 table with no visible borders containing:
  - **Top Left**: Quote number
  - **Top Right**: Date
  - **Bottom Left**: Model name
  - **Bottom Right**: Customer name
- **Blue Divider Line**: Another horizontal blue line separates the information from the description section

### Description Section
- A table with a single column header labeled "Description"
- The header has a light blue background (#e6f2ff) and is slightly larger text (1.2em)
- All cells have borders (1px solid #b3d9ff) to clearly separate items
- Contents include:
  - Print Duration with the print time in hours (e.g., "Print Duration - 2.50 hours")
  - Each filament with name and grams used (e.g., "PLA White - 45.20g")
  - Each hardware item listed on its own line (e.g., "M3 Screws")
  - Simply the word "Labour" if any labor was recorded (no time details)
- **Blue Divider Line**: A horizontal blue line separates the description from the pricing section

### Pricing Section
- Right-aligned on the page
- If a discount is applied:
  - Shows the subtotal
  - Shows the discount percentage and amount (e.g., "Discount (10%): -$5.00")
  - Shows the final total in slightly larger text
- If no discount is applied:
  - Shows only the final total in slightly larger text

### Notes Section (Optional)
- Only displayed if notes are provided
- Section title "Notes" followed by the note text

## Internal Invoice Design

The internal invoice provides comprehensive details for business use and cost analysis.

### Header Section
- Similar to the client invoice but labeled as "INTERNAL INVOICE"

### Summary Section
- A table showing category totals:
  - Materials total
  - Hardware total
  - Printing costs
  - Labour costs
  - Subtotal
  - Discount (if applicable)
  - Markup percentage and amount
  - Final total

### Materials Section
- Detailed breakdown of each material:
  - Material name
  - Amount used in grams
  - Price per gram
  - Total cost

### Hardware Section
- Detailed breakdown of each hardware item:
  - Item name
  - Quantity
  - Unit price
  - Total cost

### Printing Section
- Details about the printing process:
  - Printer used
  - Print time in hours
  - Power cost
  - Depreciation cost
  - Total printing cost

### Labour Section
- Breakdown of labour costs:
  - Task type (Design, Preparation, Post-Processing, Other)
  - Time spent on each task
  - Hourly rate
  - Cost for each task
  - Total labour cost

## Styling Elements

### Colors
- Primary Blue: #3498db (used for divider lines and table headers)
- Light Blue Background: #e6f2ff (used for description table header)
- Light Blue Border: #b3d9ff (used for table cell borders)

### Typography
- Font Family: Arial, sans-serif
- Description Header: 1.2em
- Total Price: 1.2em, bold

### Layout
- Maximum Width: 800px
- Centered on page
- Responsive design for various screen sizes

## Implementation Notes

- The invoice is generated as HTML for easy viewing and printing
- Currency symbol is dynamically pulled from system settings
- Company name is customizable through system settings
- All calculations are performed server-side to ensure accuracy
- Print functionality is included for easy printing of invoices

## Technical Reference

### Key Files

#### Backend (Server-side)
- `/routes/quotes.js` - Contains the main invoice generation logic
  - Route: `GET /api/quotes/:id/invoice/:type` - Generates invoice HTML
  - Handles both internal and client invoice types
  - Performs all calculations for costs, discounts, and markups
  - Generates the complete HTML structure with styling

#### Frontend (Client-side)
- `/client/public/print-invoice.html` - Print-friendly invoice page
  - Loads invoice content from the API
  - Provides a print button for easy printing
  - Handles responsive styling for different devices
  - Contains additional print-specific CSS

- `/client/src/pages/ViewQuote.js` - Quote viewing page with invoice buttons
  - Contains buttons to generate client or internal invoices
  - Calls the invoice generation function
  - Opens the invoice in a new tab via the print-invoice.html page

- `/client/src/pages/SettingsPage.js` - Settings page
  - Contains company name setting that appears on invoices

### Data Flow

1. User clicks "Client Invoice" or "Internal Invoice" button in ViewQuote.js
2. The application opens print-invoice.html with the quote ID and invoice type as URL parameters
3. print-invoice.html makes an API request to `/api/quotes/:id/invoice/:type`
4. The server (quotes.js) generates the HTML for the invoice based on the type
5. The HTML is returned to print-invoice.html and displayed to the user
6. User can then print the invoice using the print button

### Customization

To modify the invoice appearance or content:

- Edit the HTML template in `/routes/quotes.js` - Look for the section that begins with `// Generate HTML based on invoice type`
- Modify the CSS styles in the same file - Look for the `<style>` section
- For print-specific styling, edit `/client/public/print-invoice.html`

To change the data shown on invoices:

- Modify the database queries in `/routes/quotes.js` to include additional information
- Update the HTML template to display the new data
