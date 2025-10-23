# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Apps Script (GAS) based sales reporting system that records sales data with location tracking. The system consists of:

- **Code.gs**: Main server-side functions for handling form submissions, geocoding, and data management
- **Index.html**: Client-side web interface for sales reporting
- **Tests.gs**: Comprehensive unit tests for all major functions

## Architecture

### Core Components

1. **Web App Handler** (`doPost`): Processes sales submissions with location validation
2. **Geocoding Service** (`getAddressFromCoordinates`): Converts coordinates to addresses using Google Maps API
3. **Data Sources**: Dynamically loads member, area, and store lists from Google Sheets
4. **HTML Interface** (`doGet`): Serves the sales form with real-time location capture

### Data Flow

1. User submits sales data via web form with geolocation
2. `doPost` validates all required parameters (name, area, samplingDate, coordinates, store, branch, product sales)
3. System geocodes coordinates to readable address
4. Creates one record per product: [timestamp, name, area, samplingDate, store, branch, latitude, longitude, address, note, productType, productName, salesCount, samplingCount, productNote]

### Google Sheets Structure

- **Record Sheet**: Sales records (15 columns, one record per product)
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
SpreadSheet_ID: Google Sheets ID for data storage
Record_Sheet_Name: Main inventory records sheet name
Member_Sheet_Name: Sheet containing employee names (default: 'Member')
Area_Sheet_Name: Sheet containing area names (default: 'Area')
Store_Sheet_Name: Sheet containing store/branch data (default: 'Store')
Product_Sheet_Name: Sheet containing product data (default: 'Product')
Maps_API_KEY: Google Maps Geocoding API key
```

## Key Implementation Details

- **Parameter Validation**: Basic parameters (name, area, samplingDate, latitude, longitude, store, branch) plus at least one product sales required
- **Error Handling**: Graceful degradation when geocoding fails (still records sales)
- **Security**: API keys stored in Script Properties, not hardcoded
- **Client-Side**: Uses navigator.geolocation with fallback error handling
- **Dynamic Dropdowns**: Store selection populates corresponding branch options
- **Sales Fields**: Separate sales/sampling counts and sales-specific notes

## Testing Strategy

The test suite covers:
- API integration with proper mocking
- Parameter validation and error cases
- Data structure integrity (15-column format, one record per product)
- Configuration validation
- Performance benchmarking

Tests are designed to work in both configured and unconfigured environments.

## Current Data Structure

The Record sheet contains 15 columns (one record per product):
1. **Timestamp**: Automatic timestamp
2. **Name**: User name from Member sheet (column B)
3. **Area**: Selected area from Area sheet (column A)
4. **Sampling Date**: Sampling date for all products (user-entered, defaults to today, common to all products)
5. **Store**: Selected store from Store sheet (column A)
6. **Branch**: Selected branch from Store sheet (column B)
7. **Latitude**: GPS coordinates
8. **Longitude**: GPS coordinates
9. **Address**: Geocoded address from coordinates
10. **Note**: General notes (optional free text)
11. **Product Type**: Product type from Product sheet (column A)
12. **Product Name**: Product name from Product sheet (column B)
13. **Sales Count**: Number of bottles sold
14. **Sampling Count**: Number of cups sampled
15. **Product Note**: Product-specific notes (optional free text)

## Product Management

The system includes a comprehensive product sales feature:
- **Product Sheet**: Manages available products with types and names
- **Tabbed Interface**: Product tabs displayed at bottom of form (up to ~10 products)
- **Individual Tracking**: Each product can have separate sales/sampling counts
- **Per-Product Records**: Creates one record per product with sales data
- **Validation**: Requires at least one product to have sales data before submission