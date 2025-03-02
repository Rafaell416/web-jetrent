/**
 * Generates a Zillow URL based on search parameters
 */

// Define types for the Zillow search query state
interface ZillowFilterValue {
  value: boolean;
}

interface ZillowBedrooms {
  min: number;
  max: number | null;
}

interface ZillowPrice {
  max: number;
  min?: number;
}

interface ZillowSort {
  value: string;
}

interface ZillowFilterState {
  beds?: ZillowBedrooms;
  mp?: ZillowPrice;
  price?: ZillowPrice;
  sort?: ZillowSort;
  fr?: ZillowFilterValue;
  fsba?: ZillowFilterValue;
  fsbo?: ZillowFilterValue;
  nc?: ZillowFilterValue;
  cmsn?: ZillowFilterValue;
  auc?: ZillowFilterValue;
  fore?: ZillowFilterValue;
  mf?: ZillowFilterValue;
  land?: ZillowFilterValue;
  manu?: ZillowFilterValue;
  sf?: ZillowFilterValue;
  tow?: ZillowFilterValue;
}

interface ZillowPagination {
  currentPage?: number;
}

interface ZillowSearchQueryState {
  usersSearchTerm: string;
  filterState: ZillowFilterState;
  isListVisible: boolean;
  category: string;
  pagination?: ZillowPagination;
}

/**
 * Generates a Zillow search URL based on location, bedrooms, and budget
 * @param location - The location to search in (city, neighborhood, etc.)
 * @param state - The state abbreviation (e.g., NY, CA, IL)
 * @param zipcode - The ZIP code of the location (e.g., 07086, 10001)
 * @param bedrooms - Minimum number of bedrooms (0 for studio)
 * @param budget - Maximum monthly rent in USD
 * @returns A formatted Zillow search URL
 */
export function generateZillowUrl(
  location?: string,
  state?: string,
  zipcode?: string,
  bedrooms?: number,
  budget?: number
): string {
  if (!location) {
    return '';
  }

  console.log(`generateZillowUrl called with:`, { location, state, zipcode, bedrooms, budget });

  // Format the location for the URL path (lowercase, spaces to hyphens)
  const formattedLocation = location.toLowerCase().replace(/\s+/g, '-');
  
  // Add state and zipcode to the location if available
  let locationPath = formattedLocation;
  
  if (state) {
    locationPath += `-${state.toLowerCase()}`;
  }
  
  // Explicitly check for zipcode and add it to the path
  // if (zipcode && zipcode.trim() !== '') {
  //   locationPath += `-${zipcode}`;
  //   console.log(`Adding zipcode ${zipcode} to URL path: ${locationPath}`);
  // } else {
  //   console.log(`No zipcode provided for URL path: ${locationPath}`);
  // }
  
  // Base URL components
  const baseUrl = 'https://www.zillow.com';
  const path = `/${locationPath}/rentals/`; // Use rentals instead of apartments
  console.log(`URL path: ${path}`);
  
  // Format the search term
  let searchTerm = location;
  if (state) {
    searchTerm += `, ${state}`;
  }
  
  // Explicitly check for zipcode and add it to the search term
  // if (zipcode && zipcode.trim() !== '') {
  //   searchTerm += ` ${zipcode}`;
  //   console.log(`Adding zipcode ${zipcode} to search term: ${searchTerm}`);
  // }
  
  // Build the searchQueryState object
  const searchQueryState: ZillowSearchQueryState = {
    //pagination: {},
    usersSearchTerm: searchTerm,
    isListVisible: true,
    category: 'SEMANTIC',
    filterState: {
      //sort: { value: "priorityscore" },
      fr: { value: true }, // For Rent
      fsba: { value: false }, // For Sale By Agent
      fsbo: { value: false }, // For Sale By Owner
      nc: { value: false }, // New Construction
      cmsn: { value: false }, // Coming Soon
      auc: { value: false }, // Auction
      fore: { value: false }, // Foreclosure
      mf: { value: false }, // Multi-family
      land: { value: false }, // Land
      manu: { value: false }, // Manufactured
      sf: { value: false }, // Single Family
      tow: { value: false } // Townhouse
    }
  };
  
  // Add bedrooms filter if specified
  if (bedrooms !== undefined) {
    searchQueryState.filterState.beds = {
      min: bedrooms,
      max: null
    };
  }
  
  // Add budget filter if specified
  if (budget !== undefined) {
    // For rentals, Zillow uses 'mp' (monthly payment) as the parameter
    searchQueryState.filterState.mp = {
      max: budget,
      min: 0 // Add min value to match Zillow's format
    };
    
    // Also set the price parameter for compatibility
    // Zillow seems to use a multiplier around 200-205 for the price filter
    searchQueryState.filterState.price = {
      max: Math.round(budget * 203.66), // More precise multiplier based on the example URL
      min: 0 // Add min value to match Zillow's format
    };
  }
  
  // Encode the searchQueryState as a URL parameter
  const encodedSearchQueryState = encodeURIComponent(JSON.stringify(searchQueryState));
  
  // Log the final URL path for debugging
  const finalUrl = `${baseUrl}${path}?searchQueryState=${encodedSearchQueryState}&category=SEMANTIC`;
  console.log(`Generated Zillow URL: ${finalUrl}`);
  
  // Construct the final URL with the category parameter
  return finalUrl;
} 