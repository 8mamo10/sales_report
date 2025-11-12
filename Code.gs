// Function to format timestamp with DD/MM/YYYY format and 0-padding
function formatTimestamp(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Function to format date from YYYY-MM-DD to DD/MM/YYYY
function formatDateToDDMMYYYY(dateString) {
  if (!dateString) return "";

  // Parse YYYY-MM-DD format
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString; // Return as-is if not in expected format

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return `${day}/${month}/${year}`;
}

function doPost(e) {
  // Verify password from POST request
  const authPassword = e.parameter.authPassword;

  if (!authPassword || !isAuthenticated(authPassword)) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Authentication failed. Please log in again."
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Set the spreadsheet ID here
  const spreadSheetId =
    PropertiesService.getScriptProperties().getProperty("SpreadSheet_ID");
  if (!spreadSheetId) {
    throw new Error("Spreadsheet ID is not set in Script Properties.");
  }

  // Specify the sheet name
  const recordSheetName =
    PropertiesService.getScriptProperties().getProperty(
      "Record_Sheet_Name"
    ) || "Record";

  // Get data sent via POST request
  const name = e.parameter.name;
  const area = e.parameter.area || "";
  const latitude = e.parameter.latitude;
  const longitude = e.parameter.longitude;
  const store = e.parameter.store || "";
  const branch = e.parameter.branch || "";
  const note = e.parameter.note || "";
  const samplingDate = e.parameter.samplingDate || "";
  const productInventoryJSON = e.parameter.productInventory || "[]";
  const samplingActivitiesJSON = e.parameter.samplingActivities || "[]";
  const stockBalancesJSON = e.parameter.stockBalances || "[]";

  // Parse product inventory data
  let productInventory = [];
  try {
    productInventory = JSON.parse(productInventoryJSON);
  } catch (err) {
    console.error("Failed to parse product inventory:", err);
    productInventory = [];
  }

  // Parse sampling activities data
  let samplingActivities = [];
  try {
    samplingActivities = JSON.parse(samplingActivitiesJSON);
  } catch (err) {
    console.error("Failed to parse sampling activities:", err);
    samplingActivities = [];
  }

  // Parse stock balances data
  let stockBalances = [];
  try {
    stockBalances = JSON.parse(stockBalancesJSON);
  } catch (err) {
    console.error("Failed to parse stock balances:", err);
    stockBalances = [];
  }

  if (
    !name ||
    !area ||
    !samplingDate ||
    !latitude ||
    !longitude ||
    !store ||
    !branch
  ) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "Missing parameters" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.openById(spreadSheetId);
  const sheet = ss.getSheetByName(recordSheetName);

  // Add timestamp with formatted date
  const now = new Date();
  const formattedTimestamp = formatTimestamp(now);
  let address = "Fetching address...";
  let finalLatitude = latitude;
  let finalLongitude = longitude;

  // Check if GPS coordinates are available
  if (latitude === "GPS_FAILED" || longitude === "GPS_FAILED") {
    finalLatitude = "GPS not available";
    finalLongitude = "GPS not available";
    address = "GPS not available";
  } else {
    try {
      // Call function to get address from latitude and longitude
      address = getAddressFromCoordinates(latitude, longitude);
    } catch (err) {
      console.error("Failed to fetch address:", err);
      address = "Failed to fetch address";
    }
  }

  // Validate that we have product inventory data
  if (!productInventory || productInventory.length === 0) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "At least one product inventory is required",
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Validate that ALL products have required fields completed
  const validationErrors = [];
  productInventory.forEach((product) => {
    // Sales and sampling counts are always required
    if (
      !product.salesCount ||
      product.salesCount === "" ||
      product.salesCount === null ||
      product.salesCount === undefined
    ) {
      validationErrors.push(`${product.name}: Sales Count is required`);
    }
    if (
      !product.samplingCount ||
      product.samplingCount === "" ||
      product.samplingCount === null ||
      product.samplingCount === undefined
    ) {
      validationErrors.push(`${product.name}: Sampling Count is required`);
    }
  });

  if (validationErrors.length > 0) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: validationErrors[0] })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Format sampling date to DD/MM/YYYY and add ' prefix to ensure it's treated as text
  const formattedSamplingDate = "'" + formatDateToDDMMYYYY(samplingDate);

  // Create a map of sampling activities by product for quick lookup
  const samplingActivityMap = {};
  if (samplingActivities && samplingActivities.length > 0) {
    samplingActivities.forEach((activity) => {
      const key = `${activity.productType}|${activity.productName}`;
      samplingActivityMap[key] = {
        cupsServed: activity.cupsServed || 0,
        bottlesUsed: activity.bottlesUsed || 0,
      };
    });
  }

  // Create a map of stock balances by product for quick lookup
  const stockBalanceMap = {};
  if (stockBalances && stockBalances.length > 0) {
    stockBalances.forEach((balance) => {
      const key = `${balance.productType}|${balance.productName}`;
      stockBalanceMap[key] = balance.bottlesRemained || 0;
    });
  }

  // Prepare all rows for batch insert (much faster than individual appendRow calls)
  const rowsToInsert = productInventory.map((product) => {
    // Check if there's a matching sampling activity for this product
    const key = `${product.type}|${product.name}`;
    const samplingActivity = samplingActivityMap[key] || null;
    const bottlesRemained = stockBalanceMap[key] || "";

    return [
      formattedTimestamp,
      name,
      area,
      store,
      branch,
      finalLatitude,
      finalLongitude,
      address,
      note,
      formattedSamplingDate,
      product.type,
      product.name,
      product.salesCount || 0,
      product.samplingCount || 0,
      product.note || "",
      samplingActivity ? samplingActivity.cupsServed : "",
      samplingActivity ? samplingActivity.bottlesUsed : "",
      bottlesRemained,
    ];
  });

  // Insert all rows at once (single API call instead of multiple)
  if (rowsToInsert.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    const range = sheet.getRange(
      startRow,
      1,
      rowsToInsert.length,
      rowsToInsert[0].length
    );
    range.setValues(rowsToInsert);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: "success", message: "Finish registration" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function getAddressFromCoordinates(lat, lng) {
  // Get API key from script properties:
  const apiKey =
    PropertiesService.getScriptProperties().getProperty("Maps_API_KEY");
  if (!apiKey) {
    throw new Error("Google Maps API Key is not set in Script Properties.");
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=ja`;

  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());

  if (json.status === "OK" && json.results.length > 0) {
    // Return the formatted_address of the most accurate result (usually results[0])
    return json.results[0].formatted_address;
  } else if (json.status === "ZERO_RESULTS") {
    return "Not found";
  } else {
    throw new Error(
      `Geocoding API Error: ${json.status} - ${json.error_message || ""}`
    );
  }
}

// Function to verify password
function verifyPassword(inputPassword) {
  const correctPassword = PropertiesService.getScriptProperties().getProperty("Password");

  if (!correctPassword) {
    throw new Error("Password is not set in Script Properties. Please set 'Password' property.");
  }

  return inputPassword === correctPassword;
}

// Function to check if user is authenticated (via password parameter)
function isAuthenticated(password) {
  if (!password) {
    return false;
  }

  return verifyPassword(password);
}

// Function for deploying as a web application (execute only once initially)
function doGet(e) {
  // Serve the main Index page which includes login logic
  const template = HtmlService.createTemplateFromFile("Index");
  const language = PropertiesService.getScriptProperties().getProperty("Language") || "EN";
  template.language = language;

  return template
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Function to return HTML file content
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Function to get the main form HTML after authentication
function getMainFormHTML() {
  const template = HtmlService.createTemplateFromFile("Index");
  const language = PropertiesService.getScriptProperties().getProperty("Language") || "EN";
  template.language = language;

  return template.evaluate().getContent();
}

// Function to get member list
function getMemberList() {
  const spreadSheetId =
    PropertiesService.getScriptProperties().getProperty("SpreadSheet_ID");
  if (!spreadSheetId) {
    throw new Error("Spreadsheet ID is not set in Script Properties.");
  }

  const memberSheetName =
    PropertiesService.getScriptProperties().getProperty("Member_Sheet_Name") ||
    "Member";

  const ss = SpreadsheetApp.openById(spreadSheetId);
  const memberSheet = ss.getSheetByName(memberSheetName);

  if (!memberSheet) {
    throw new Error(
      `Member sheet "${memberSheetName}" not found. Please create a sheet named "${memberSheetName}" with names in column B.`
    );
  }

  // Get data from column with names (column B) starting from row 2
  const range = memberSheet.getRange("B2:B");
  const values = range.getValues();

  // Exclude blank cells and remove duplicates (maintain sheet order)
  const member = values
    .map((row) => row[0])
    .filter((name) => name && name.toString().trim() !== "")
    .map((name) => name.toString().trim())
    .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

  return member;
}

// Function to get store list
function getStoreList() {
  const spreadSheetId =
    PropertiesService.getScriptProperties().getProperty("SpreadSheet_ID");
  if (!spreadSheetId) {
    throw new Error("Spreadsheet ID is not set in Script Properties.");
  }

  const storeSheetName =
    PropertiesService.getScriptProperties().getProperty("Store_Sheet_Name") ||
    "Store";

  const ss = SpreadsheetApp.openById(spreadSheetId);
  const storeSheet = ss.getSheetByName(storeSheetName);

  if (!storeSheet) {
    throw new Error(`Store sheet "${storeSheetName}" not found.`);
  }

  // Get store names, areas, branch names, and product availability (columns A-M) starting from row 2
  const range = storeSheet.getRange("A2:M");
  const values = range.getValues();

  // Exclude blank rows and organize data
  const storeData = values
    .filter((row) => row[0] && row[0].toString().trim() !== "")
    .map((row) => ({
      store: row[0].toString().trim(),
      area: row[1] ? row[1].toString().trim() : "",
      branch: row[2] ? row[2].toString().trim() : "",
      productAvailability: row.slice(3, 13), // Columns D-M (indices 3-12)
    }));

  // Get store name list (remove duplicates, maintain order)
  const store = [];
  const storeMap = new Map();
  const storeAreaMap = new Map();
  const areaBranchMap = new Map();
  const areaStoreMap = new Map();
  const areaStoreBranchMap = new Map();
  const storeBranchProductMap = new Map();

  storeData.forEach((item) => {
    if (!storeMap.has(item.store)) {
      store.push(item.store);
      storeMap.set(item.store, []);
      storeAreaMap.set(item.store, item.area);
    }
    if (item.branch) {
      storeMap.get(item.store).push(item.branch);

      // Create area-branch mapping
      if (!areaBranchMap.has(item.area)) {
        areaBranchMap.set(item.area, []);
      }
      if (!areaBranchMap.get(item.area).includes(item.branch)) {
        areaBranchMap.get(item.area).push(item.branch);
      }

      // Create area-store mapping
      if (!areaStoreMap.has(item.area)) {
        areaStoreMap.set(item.area, []);
      }
      if (!areaStoreMap.get(item.area).includes(item.store)) {
        areaStoreMap.get(item.area).push(item.store);
      }

      // Create area-store-branch mapping
      const areaStoreKey = `${item.area}|${item.store}`;
      if (!areaStoreBranchMap.has(areaStoreKey)) {
        areaStoreBranchMap.set(areaStoreKey, []);
      }
      if (!areaStoreBranchMap.get(areaStoreKey).includes(item.branch)) {
        areaStoreBranchMap.get(areaStoreKey).push(item.branch);
      }

      // Create store-branch-product mapping
      const storeBranchKey = `${item.store}|${item.branch}`;
      if (!storeBranchProductMap.has(storeBranchKey)) {
        storeBranchProductMap.set(storeBranchKey, []);
      }

      // Check which products are available (marked with "●")
      const availableProducts = [];
      item.productAvailability.forEach((availability, index) => {
        if (availability && availability.toString().trim() === "●") {
          availableProducts.push(index); // Store product index (0-9 for columns D-M)
        }
      });
      storeBranchProductMap.set(storeBranchKey, availableProducts);
    }
  });

  return {
    store: store,
    storeMap: Object.fromEntries(storeMap),
    storeAreaMap: Object.fromEntries(storeAreaMap),
    areaBranchMap: Object.fromEntries(areaBranchMap),
    areaStoreMap: Object.fromEntries(areaStoreMap),
    areaStoreBranchMap: Object.fromEntries(areaStoreBranchMap),
    storeBranchProductMap: Object.fromEntries(storeBranchProductMap),
  };
}

// Function to get area list
function getAreaList() {
  const spreadSheetId =
    PropertiesService.getScriptProperties().getProperty("SpreadSheet_ID");
  if (!spreadSheetId) {
    throw new Error("Spreadsheet ID is not set in Script Properties.");
  }

  const areaSheetName =
    PropertiesService.getScriptProperties().getProperty("Area_Sheet_Name") ||
    "Area";

  const ss = SpreadsheetApp.openById(spreadSheetId);
  const areaSheet = ss.getSheetByName(areaSheetName);

  if (!areaSheet) {
    throw new Error(
      `Area sheet "${areaSheetName}" not found. Please create a sheet named "${areaSheetName}" with area names in column A.`
    );
  }

  // Get data from column with area names (column A) starting from row 2
  const range = areaSheet.getRange("A2:A");
  const values = range.getValues();

  // Exclude blank cells and remove duplicates (maintain sheet order)
  const area = values
    .map((row) => row[0])
    .filter((name) => name && name.toString().trim() !== "")
    .map((name) => name.toString().trim())
    .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

  return area;
}

// Function to get product list
function getProductList() {
  const spreadSheetId =
    PropertiesService.getScriptProperties().getProperty("SpreadSheet_ID");
  if (!spreadSheetId) {
    throw new Error("Spreadsheet ID is not set in Script Properties.");
  }

  const productSheetName =
    PropertiesService.getScriptProperties().getProperty("Product_Sheet_Name") ||
    "Product";

  const ss = SpreadsheetApp.openById(spreadSheetId);
  const productSheet = ss.getSheetByName(productSheetName);

  if (!productSheet) {
    throw new Error(
      `Product sheet "${productSheetName}" not found. Please create a sheet named "${productSheetName}" with product types in column A and product names in column B.`
    );
  }

  // Get data from columns with types (column A) and names (column B) starting from row 2
  const range = productSheet.getRange("A2:B");
  const values = range.getValues();

  // Exclude blank rows and organize data
  const products = values
    .filter(
      (row) =>
        row[0] &&
        row[0].toString().trim() !== "" &&
        row[1] &&
        row[1].toString().trim() !== ""
    )
    .map((row) => ({
      type: row[0].toString().trim(),
      name: row[1].toString().trim(),
    }));

  return products;
}
