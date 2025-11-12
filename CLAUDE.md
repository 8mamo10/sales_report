# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Apps Script (GAS) based sales reporting system that records sales data with location tracking. The system consists of:

- **Code.gs**: Main server-side functions for handling form submissions, geocoding, authentication, and data management
- **Index.html**: Client-side web interface for sales reporting and sampling activity tracking
- **Login.html**: Password-based login page for authentication
- **Tests.gs**: Comprehensive unit tests for all major functions

## Architecture

### Core Components

1. **Authentication System**: Password-based login protecting access to the application
   - `doGet`: Shows login page or main form based on authentication status
   - `verifyPassword`: Validates user password against Script Properties
   - `isAuthenticated`: Checks if provided password is correct
2. **Web App Handler** (`doPost`): Processes sales submissions with location validation and authentication
3. **Geocoding Service** (`getAddressFromCoordinates`): Converts coordinates to addresses using Google Maps API
4. **Data Sources**: Dynamically loads member, area, and store lists from Google Sheets
5. **HTML Interface** (`doGet`): Serves login page or sales form with real-time location capture

### Data Flow

1. User accesses web app and sees login page
2. User enters password, which is validated against Script Properties
3. Upon successful authentication, password is stored in sessionStorage and user sees the main form
4. User submits sales data via web form with geolocation
5. `doPost` validates authentication (password) and all required parameters (name, area, samplingDate, coordinates, store, branch, product sales)
6. System geocodes coordinates to readable address
7. Creates one record per product: [timestamp, name, area, store, branch, latitude, longitude, address, note, samplingDate, productType, productName, salesCount, samplingCount, productNote]

### Google Sheets Structure

- **Record Sheet**: Sales records (17 columns, one record per product, includes sampling activity data)
- **Member Sheet**: Employee names in column B (starting row 2)
- **Area Sheet**: Area names in column A (starting row 2)
- **Store Sheet**: Store names (column A), area names (column B), and branch names (column C) starting row 2
- **Product Sheet**: Product types (column A) and product names (column B) starting row 2

## Development Commands

### Testing
```javascript
// Run all unit tests
runAllTests()

// Run specific test categories
testGetAddressFromCoordinates()
testGetMemberList() 
testGetAreaList()
testGetStoreList()
testGetProductList()
testDoPostValidInput()

// Setup test configuration
setupTestProperties()

// Performance testing
runPerformanceTest()
```

### Required Script Properties
```
Password: Authentication password for accessing the application
SpreadSheet_ID: Google Sheets ID for data storage
Record_Sheet_Name: Main record sheet name (default: 'Record')
Member_Sheet_Name: Sheet containing employee names (default: 'Member')
Area_Sheet_Name: Sheet containing area names (default: 'Area')
Store_Sheet_Name: Sheet containing store/branch data (default: 'Store')
Product_Sheet_Name: Sheet containing product data (default: 'Product')
Maps_API_KEY: Google Maps Geocoding API key
Language: UI language setting (default: 'EN', supports 'EN', 'JA', 'VI')
```

## Key Implementation Details

- **Authentication**: Password-based login system using Script Properties
  - Password stored in sessionStorage on client-side after successful login
  - All POST requests include password for server-side validation
  - Login page shown by default; main form only accessible after authentication
- **Parameter Validation**: Basic parameters (name, area, samplingDate, latitude, longitude, store, branch) plus at least one product sales required
- **Error Handling**: Graceful degradation when geocoding fails (still records sales)
- **Security**: API keys and passwords stored in Script Properties, not hardcoded
- **Client-Side**: Uses navigator.geolocation with fallback error handling
- **Dynamic Dropdowns**: Store selection populates corresponding branch options
- **Sales Fields**: Separate sales/sampling counts and sales-specific notes

## Testing Strategy

The test suite covers:
- API integration with proper mocking
- Parameter validation and error cases
- Data structure integrity (17-column format, one record per product)
- Configuration validation
- Performance benchmarking

Tests are designed to work in both configured and unconfigured environments.

## Current Data Structure

The Record sheet contains 17 columns (one record per product):
1. **Timestamp**: Automatic timestamp
2. **Name**: User name from Member sheet (column B)
3. **Area**: Selected area from Area sheet (column A)
4. **Store**: Selected store from Store sheet (column A)
5. **Branch**: Selected branch from Store sheet (column B)
6. **Latitude**: GPS coordinates
7. **Longitude**: GPS coordinates
8. **Address**: Geocoded address from coordinates
9. **Note**: General notes (optional free text)
10. **Sampling Date**: Sampling date for all products (user-entered, defaults to today, common to all products)
11. **Product Type**: Product type from Product sheet (column A)
12. **Product Name**: Product name from Product sheet (column B)
13. **Sales Count**: Number of bottles sold
14. **Sampling Count**: Number of cups sampled
15. **Product Note**: Product-specific notes (optional free text)
16. **Cups Served**: Number of cups served (from Sampling Activity, blank if no activity for this product)
17. **Sample Bottles Used**: Number of sample bottles used (from Sampling Activity, blank if no activity for this product)

## Product Management

The system includes a comprehensive product sales feature:
- **Product Sheet**: Manages available products with types and names
- **Tabbed Interface**: Product tabs displayed at bottom of form (up to ~10 products)
- **Individual Tracking**: Each product can have separate sales/sampling counts
- **Per-Product Records**: Creates one record per product with sales data
- **Validation**: Requires at least one product to have sales data before submission

## Sampling Activity Management

The system includes a sampling activity tracking feature integrated into the Sales Record:
- **Dynamic Entries**: Users can add multiple sampling activity entries
- **Optional Product Selection**: Products can be specified or left unspecified
- **Cups Served & Bottles Used**: Track both cups served and sample bottles consumed
- **Integrated Data**: Sampling activities are matched to products and stored in the same Sales Record row
- **Optional Data**: Sampling activities are completely optional and don't affect sales data submission
- **Efficient Storage**: If a product has a matching sampling activity, cups served and bottles used are populated; otherwise these columns are left blank