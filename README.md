# Sales Report System

A Google Apps Script (GAS) based sales reporting system that records sales data with location tracking and geocoding capabilities.

## Features

- **Location-based Sales Tracking**: Automatically captures GPS coordinates and converts them to readable addresses
- **Multi-field Data Capture**: Records comprehensive sales information including sales counts, sampling counts, and notes
- **Sampling Activity Tracking**: Separate section to track sampling activities with cups served and sample bottles used
- **Dynamic Dropdowns**: Load member names, areas, stores, and branches from Google Sheets
- **Real-time Validation**: Client and server-side validation for data integrity
- **Mobile-friendly Interface**: Responsive design optimized for mobile devices
- **Comprehensive Testing**: Full test suite with unit and integration tests

## Data Captured

The system creates one record per product with sales data. Each record contains:

### Required Fields
- **Name**: User name (from Member sheet)
- **Area**: Selected area (from Area sheet)
- **Sampling Date**: Sampling date for all products (defaults to today, can be changed)
- **Store**: Selected store (from Store sheet)
- **Branch**: Selected branch (based on store selection)
- **Location**: GPS coordinates (automatic)
- **Product Sales**: At least one product must have sales data

### Optional Fields
- **Note**: General notes

### Product-Specific Fields (per product tab)
- **Sales Count**: Number of bottles sold for this product
- **Sampling Count**: Number of cups sampled for this product
- **Product Note**: Product-specific notes

### Automatic Fields
- **Timestamp**: Automatic timestamp
- **Address**: Geocoded address from GPS coordinates

## Google Sheets Structure

The system requires the following sheets in your Google Spreadsheet:

### Record Sheet
Main data storage with 15 columns (one record per product):
1. Timestamp
2. Name
3. Area
4. Store
5. Branch
6. Latitude
7. Longitude
8. Address
9. Note
10. Sampling Date
11. Product Type
12. Product Name
13. Sales Count
14. Sampling Count
15. Product Note

### Member Sheet
- **Column B**: Member names (starting from row 2)

### Area Sheet
- **Column A**: Area names (starting from row 2)

### Store Sheet
- **Column A**: Store names (starting from row 2)
- **Column B**: Area names (starting from row 2)
- **Column C**: Branch names (starting from row 2)

### Product Sheet
- **Column A**: Product types (starting from row 2)
- **Column B**: Product names (starting from row 2)

### Sampling Sheet (Auto-created)
Stores sampling activity data with 13 columns:
1. Timestamp
2. Name
3. Area
4. Store
5. Branch
6. Latitude
7. Longitude
8. Address
9. Sampling Date
10. Product Type
11. Product Name
12. Cups Served
13. Sample Bottles Used

## Setup Instructions

### 1. Google Apps Script Setup
1. Create a new Google Apps Script project
2. Copy the contents of `Code.gs` to your script
3. Add `Index.html` as an HTML file
4. Deploy as a web application

### 2. Google Sheets Setup
1. Create a new Google Spreadsheet
2. Create the required sheets: Record, Member, Area, Store, Product
3. Populate the Member, Area, Store, and Product sheets with your data
4. Note the spreadsheet ID from the URL

### 3. Script Properties Configuration
Set the following script properties in Google Apps Script:

```
SpreadSheet_ID: Your Google Sheets ID
Record_Sheet_Name: Name of your main record sheet
Member_Sheet_Name: Name of your member sheet (default: 'Member')
Area_Sheet_Name: Name of your area sheet (default: 'Area')
Store_Sheet_Name: Name of your store sheet (default: 'Store')
Product_Sheet_Name: Name of your product sheet (default: 'Product')
Maps_API_KEY: Your Google Maps Geocoding API key
```

### 4. Google Maps API Setup
1. Enable the Google Maps Geocoding API in Google Cloud Console
2. Create an API key
3. Add the API key to script properties

### 5. Web App Deployment
1. Deploy the script as a web application
2. Set execute permissions appropriately
3. Copy the web app URL
4. Update the URL in `Index.html` (replace 'YOUR_DEPLOYED_WEB_APP_URL')

## Usage

1. Access the deployed web application URL
2. Fill in all required fields:
   - Select your name from the dropdown
   - Choose the area
   - Select store and branch
   - Add general notes if needed
   - In the Product Sales section, select or modify the sampling date (defaults to today, common to all products)
   - Use product tabs to enter sales data for each product (at least one required)
   - For each product: enter sales counts, sampling counts, and product notes
3. Optionally, add sampling activities:
   - Click "+ Add Sampling Activity" to add a new entry
   - Select product (optional), enter cups served and sample bottles used
   - Can add multiple sampling activities
   - Click the × button to remove an activity
4. Click "Register" to submit the data
5. The system will automatically capture your location and save all data to the spreadsheet

## Testing

The system includes comprehensive tests. To run tests:

```javascript
// Run all tests
runAllTests()

// Run specific test categories
testGetMemberList()
testGetAreaList()
testGetStoreList()
testDoPostValidInput()

// Setup test configuration
setupTestProperties()
```

## Security Features

- **API Key Protection**: Google Maps API key stored securely in Script Properties
- **Input Validation**: Both client-side and server-side validation
- **Error Handling**: Graceful error handling with user feedback
- **Location Privacy**: GPS coordinates used only for address lookup

## Mobile Optimization

- Responsive design that works on mobile devices
- Touch-friendly interface elements
- Optimized for various screen sizes
- Fast loading and minimal data usage

## Error Handling

The system includes robust error handling for:
- Network connectivity issues
- GPS/location access problems
- Google Sheets access errors
- Invalid form data
- API rate limiting

## Browser Compatibility

- Modern mobile browsers (Chrome, Safari, Firefox)
- Desktop browsers
- Requires JavaScript enabled
- Requires location services permission

## Development

The codebase includes:
- **Code.gs**: Server-side Google Apps Script functions
- **Index.html**: Client-side interface with embedded JavaScript/CSS
- **Tests.gs**: Comprehensive test suite
- **CLAUDE.md**: Technical documentation for developers

## Support

For technical issues:
1. Check the browser console for JavaScript errors
2. Verify all required script properties are set
3. Ensure Google Sheets permissions are correct
4. Confirm Google Maps API key is valid and has proper permissions

## License

This project is provided as-is for sales tracking purposes.