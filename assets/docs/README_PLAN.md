
# 3DQ  Full Technical Specification

##  Overview
3DQ is a self-hosted quoting tool for 3D-printed parts. It is built as a **single application** using:

- **React** for the frontend UI
- **Express (Node.js)** for backend logic and API routing
- **SQLite** for data storage

This is a unified app with no separate frontend/backend deployment  React is built and served statically via Express.

---

##  Development Setup

Ensure the following entries are included in your `.gitignore`:

```
node_modules/
dist/
build/
.env
*.sqlite
*.db
```

---

##  Filament Management Page

Allows users to add, edit, delete, and archive filament types.

### Fields per Filament:
| Field                | Description                                       |
|----------------------|---------------------------------------------------|
| **Name**             | Descriptive name (e.g., eSun PLA+ White)         |
| **Type / Material**  | Text field (e.g., PLA, ABS, PETG)                |
| **Diameter (mm)**    | Usually 1.75 or 2.85                             |
| **Spool Weight (g)** | Weight of the spool in grams                    |
| **Spool Price ()**  | Price paid for the spool                        |
| **Density**  | Optional but can assist with calculation         |
| **Price per kg ()** | Auto-calculated but editable                     |
| **Colour**           | Colour picker for UI reference                   |
| **Link (optional)**  | URL to supplier (Amazon, AliExpress, etc.)      |
| **Status**           | Active or Archived                               |

---

##  Printer Management Page

Allows users to manage printer configurations.

### Fields per Printer:
| Field                     | Description                                       |
|---------------------------|---------------------------------------------------|
| **Name**                  | e.g. Prusa MK3S+, Bambu X1C                      |
| **Material Diameter (mm)**| Usually 1.75 or 2.85                             |
| **Price ()**             | Printer cost                                     |
| **Depreciation Time (hrs)**| Lifespan in hours                               |
| **Service Cost ()**      | Expected lifetime maintenance cost               |
| **Power Usage (kWh)**     | Hourly energy consumption                        |
| **Depreciation per Hour ()** | Auto-calculated, editable override          |
| **Status**                | Active or Archived                               |

---

##  Quote Builder Sections

### 1. Job Info
- Customer Name
- Quote Title (auto-generated if blank using template: `{quote_prefix}{quote_number} - {Customer Name}`)
- User may manually override the generated title
- Date (auto-filled)
- Notes

### 2. Filament Usage
- Default: one material input with grams used
- Can toggle to multi-material mode
- Price per gram is pulled from material table but is editable
- Dropdown populated from Filament list (auto-select first if no choice made)

### 3. Hardware Usage
- Multiple items, each with:
  - Name (from dropdown)
  - Quantity (pcs)
  - Unit Price (fixed)
  - Optional link to Amazon, AliExpress, etc.

### 4. Print Setup
- Print Time (hours)
- Printer (dropdown from Printers list)
- Used only for power + depreciation calculations

### 5. Manual Time Entry (Labour)
- Design (min)  default 0
- Preparation (min)  default 5
- Post Processing (min)  default 5
- Other (min)  default 0

 Labour cost =

### 6. Cost Summary
- Filament cost
- Power cost
- Depreciation
- Hardware cost
- Labour cost (via manual time fields)
- Markup (defaults from settings but editable per quote)
- Final Total

###  Quick Quote Option
A fast quoting feature accessed via "Quick Quote" section.

Inputs:
- Filament (dropdown)
- Weight in grams
- Print duration in hours

Outputs:
- Instant quote summary including:
  - Filament cost
  - Power cost
  - Depreciation
  - Combined printing cost

This quote is not saved unless explicitly chosen. It is auto-named with the quote prefix and suffixed with "Quick".

---

##  PDF Export Options

###  Internal Invoice
Detailed view for internal or business use, includes:
- Filament cost per material
- Hardware cost per item
- Printer depreciation
- Electricity
- Labour cost breakdown:
  - Design
  - Preparation
  - Post Processing
  - Other
- Final total

###  Client Invoice
Client-safe summary view, includes:
- **Printing**: Combined cost of filament, depreciation, electricity
- **Design & Handling**: Merged cost of all labour activities
- **Hardware**: Combined cost of all hardware used
- **Final Total**: Rounded to 2 decimal places
- Does not include internal cost breakdowns or time estimates

---

##  Settings Page

| Setting Key              | Default | Description                                  |
|---------------------------|---------|----------------------------------------------|
| `electricity_cost_per_kwh`| 0.2166  | Cost per kWh                                 |
| `labour_rate_per_hour`    | 13.00   | Used to calculate labour cost                |
| `default_markup_percent`  | 50      | Used in quote total                          |
| `currency_symbol`         |        | Used in all monetary fields                  |
| `quote_prefix`            | 3DQ     | Used to generate quote numbers (e.g. 3DQ0001)|

---

##  Quote Identification

- If no title is entered, one is auto-generated using:
  `{quote_prefix}{quote_number} - {Customer Name}`
- Users can manually override the title
- `quote_number` is auto-incremented
- All monetary values are rounded to **exactly 2 decimal places**

---

##  Historical Accuracy Rules

- When a quote is saved:
  - All costs and inputs are saved with it (filament prices, power cost, depreciation, labour)
  - Saved quotes never recalculate using updated settings
  - Quotes remain as they were at the time of creation

---

##  UI Theme and Responsiveness

- Dark mode is the default UI theme
- Accent colour (e.g., blue, green, orange) can be selected in Settings
- UI must be fully **responsive**, scaling layout and controls appropriately for desktop, tablet, and mobile screen sizes

---

##  Feature Notes

- Quotes can be duplicated
- Filament and printer fields in quotes are dropdowns
- First item in each dropdown auto-selected if no input
- Internal and client invoice PDF exports supported
- Quick quote mode for fast pricing calculation
- All pricing is rounded and version-locked at quote creation
## Sidebar Navigation

The application will include a persistent sidebar menu on the left side of the screen.

### Pages Available:
- **Quotes**  
  Main dashboard for viewing saved quotes. Includes a button for "New Quote" and "Quick Quote".

- **Filament**  
  Management interface for adding/editing filament types and pricing.

- **Printers**  
  Configuration interface for printer hardware used in calculations.

- **Hardware**  
  Component list and pricing for additional parts used in quotes (e.g. bolts, LEDs).

- **Settings**  
  General configuration for electricity rates, labour rates, currency symbol, default markup, and quote ID prefix.

Each of these pages must be accessible via the left sidebar at all times. The currently selected page should be clearly highlighted.



