# 3DQ Invoice Documentation

This document outlines the structure and design of the invoice system in 3DQ, including both client-facing and internal invoices.

## Invoice Types

The 3DQ application supports two types of invoices:

1.  **Client Invoice**: A simplified, customer-facing invoice that shows only necessary information without detailed costs. Key information includes quote number, date, model name, customer name, a description of services/items (print duration, filaments used, hardware, labour summary), and the final pricing (subtotal, discount if any, and total).
2.  **Internal Invoice**: A comprehensive invoice with detailed breakdowns of all costs, markups, and calculations for business use. This includes detailed sections for materials, hardware, printing costs (printer, time, power, depreciation), and labour (tasks, time, rate, cost per task), culminating in a full financial summary (subtotal before markup, markup amount, subtotal after markup, discount if any, and final total).

## Client Invoice Design

The client invoice is designed to be clean, professional, and easy to understand for customers.

### Header Section
-   **Title**: The company name followed by "- Invoice" (e.g., "Prints Inc - Invoice")
-   **Blue Divider Line**: A horizontal blue line (#3498db) separates the header from the information section.

### Information Section
-   A 2x2 table with no visible borders containing:
    -   **Top Left**: Quote number
    -   **Top Right**: Date
    -   **Bottom Left**: Model name
    -   **Bottom Right**: Customer name
-   **Blue Divider Line**: Another horizontal blue line separates the information from the description section.

### Description Section
-   A table with a single column header labeled "Description".
-   The header has a light blue background (#e6f2ff) and is slightly larger text (1.2em).
-   All cells have borders (1px solid #b3d9ff) to clearly separate items.
-   Contents include:
    -   Print Duration with the print time in hours (e.g., "Print Duration - 2.50 hours")
    -   Each filament with name and grams used (e.g., "PLA White - 45.20g")
    -   Each hardware item listed on its own line (e.g., "M3 Screws")
    -   Simply the word "Labour" if any labor was recorded (no time details).
-   **Blue Divider Line**: A horizontal blue line separates the description from the pricing section.

### Pricing Section
-   Right-aligned on the page.
-   If a discount is applied:
    -   Shows the subtotal (after markup).
    -   Shows the discount percentage and amount (e.g., "Discount (10%): -$5.00").
    -   Shows the final total in slightly larger text.
-   If no discount is applied:
    -   Shows only the final total in slightly larger text.

## Internal Invoice Design

The internal invoice provides comprehensive details for business use and cost analysis. Font sizes are generally smaller than the client invoice to fit more information.

### Header Section
-   Similar to the client invoice but labeled as "INTERNAL INVOICE". Header elements are centered and have reduced margins.

### Information Section
- Similar to client invoice but with reduced padding between rows for a more compact layout.

### Costs Sections (Materials, Hardware, Printing, Labour)
-   Each section has a table with detailed breakdowns:
    -   **Materials**: Material name, amount used (grams), price per gram, total cost.
    -   **Hardware**: Item name, quantity, unit price, total cost.
    -   **Printing**: Printer used, print time (hours), power cost, depreciation cost, total printing cost.
    -   **Labour**: Task type (Design, Preparation, Post-Processing, Other), time spent, hourly rate, cost per task, total labour cost.
-   Table headers have a light blue background (#e6f2ff).
-   All cells have borders (1px solid #b3d9ff or #ccc for sub-headers).

### Financial Summary Section
-   Right-aligned on the page with reduced top margin.
-   Shows a full breakdown:
    -   Subtotal (Before Markup)
    -   Markup (percentage and amount)
    -   Subtotal (After Markup)
    -   Discount (if applicable, percentage and amount)
    -   Final Total (bold and slightly larger text).

## Styling Elements

### Colors
-   Primary Blue: #3498db (used for divider lines and table headers)
-   Light Blue Background: #e6f2ff (used for description/costs table headers)
-   Light Blue Border: #b3d9ff (used for most table cell borders)
-   Grey Border: #ccc (used for sub-header table cell borders in internal invoice)

### Typography
-   Font Family: Arial, sans-serif
-   Client Invoice Description Header: 1.2em
-   Client Invoice Total Price: 1.2em, bold
-   Internal Invoice font sizes are generally smaller (e.g., 0.8em for table data, 1.0em for headers) for compactness.

### Layout
-   Maximum Width: 800px, centered on page.
-   The invoice HTML includes all necessary CSS within `<style>` tags for self-contained rendering.

## Features

-   **Print/Save as PDF Button**: A button is displayed in the top-right corner of the invoice page (when viewed in a browser) allowing the user to trigger the browser's print dialog, which can be used to print or save as PDF.
    -   This button is hidden via CSS (`display: none !important;`) when the invoice is actually printed.
-   **Print-Specific Styling**:
    -   Browser default headers and footers are not explicitly hidden due to inconsistencies, but page margins are set (`@page { margin: 1cm; }`).
    -   Table borders, including right borders, are explicitly defined for print using `border-collapse: separate !important;` and `border: 1px solid ... !important;` on `<th>` and `<td>` elements to ensure they render correctly.
    -   Background colors for table headers are forced to print using `-webkit-print-color-adjust: exact; print-color-adjust: exact;`.
    -   Box shadows on the invoice container are removed for printing.

## Implementation Notes

-   The invoice is generated as a complete HTML document (including embedded CSS) by the backend.
-   Currency symbol is dynamically pulled from system settings.
-   Company name is customizable through system settings and displayed in the invoice header.
-   All calculations (costs, markups, discounts) are performed server-side in `/routes/quotes.js` to ensure accuracy and consistency.

## Technical Reference

### Key Files

#### Backend (Server-side)
-   **`/routes/quotes.js`**: This is the core file for the invoicing system.
    -   **Route**: `GET /api/quotes/:id/invoice/:type`
    -   **Functionality**: Fetches all necessary data (quote details, filament usage, hardware, print setup, labour, company settings). Performs all calculations for costs, markups, and discounts. Generates the complete HTML structure for the specified invoice type (`client` or `internal`), including all content and embedded CSS styling.

#### Frontend (Client-side)
-   **`/client/src/pages/ViewQuote.js`**: This page displays quote details and provides the interface for generating invoices.
    -   **Functionality**: Contains "Generate Client Invoice" and "Generate Internal Invoice" buttons. When clicked, a JavaScript function (`generateInvoice(type)`) calls the backend API endpoint (`/api/quotes/:id/invoice/:type`). The raw HTML response from the backend is then opened in a new browser tab (`window.open()`).
-   **`/client/src/pages/SettingsPage.js`**: Allows users to configure application settings.
    -   **Functionality**: Contains the company name setting, which is fetched and displayed on the generated invoices.

### Data Flow

1.  User navigates to the `ViewQuote.js` page for a specific quote.
2.  User clicks either the "Generate Client Invoice" or "Generate Internal Invoice" button.
3.  The `generateInvoice(type)` function in `ViewQuote.js` makes an asynchronous HTTP GET request to the backend API endpoint: `/api/quotes/:id/invoice/:type` (e.g., `/api/quotes/11/invoice/client`).
4.  The backend route in `/routes/quotes.js` receives the request.
    -   It fetches all required data from the database (quote details, associated costs, company settings).
    -   It performs all necessary calculations (subtotals, markup, discount, final total).
    -   It constructs the complete HTML string for the requested invoice type, embedding all necessary CSS within `<style>` tags.
5.  The server responds to the API request with the generated HTML string as the response body (content type `text/html`).
6.  The `generateInvoice(type)` function in `ViewQuote.js` receives the HTML response.
7.  It opens a new browser tab and writes the received HTML content into it, rendering the invoice.
8.  The user can then use the "Print/Save as PDF" button on the new invoice page or the browser's native print functionality.

### Customization

To modify the invoice appearance or content:

-   **HTML Structure & Content**: Edit the HTML template strings directly within the `if (type === 'client') { ... } else if (type === 'internal') { ... }` blocks in `/routes/quotes.js`.
-   **CSS Styling**: Modify the CSS rules within the `<style> ... </style>` tags embedded in the HTML template strings in `/routes/quotes.js`.

To change the data shown on invoices:

-   **Data Fetching**: Modify the database queries in `/routes/quotes.js` (within the `router.get('/:id/invoice/:type', ...)` handler) to retrieve additional or different data.
-   **Data Display**: Update the HTML template strings in `/routes/quotes.js` to incorporate and display the new data fields.
