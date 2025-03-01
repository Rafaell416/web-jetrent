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
}

interface ZillowFilterState {
  beds?: ZillowBedrooms;
  mp?: ZillowPrice;
  price?: ZillowPrice;
  fr?: ZillowFilterValue;
  fsba?: ZillowFilterValue;
  fsbo?: ZillowFilterValue;
  nc?: ZillowFilterValue;
  cmsn?: ZillowFilterValue;
  auc?: ZillowFilterValue;
  fore?: ZillowFilterValue;
}

interface ZillowSearchQueryState {
  usersSearchTerm: string;
  isMapVisible: boolean;
  filterState: ZillowFilterState;
  isListVisible: boolean;
  mapZoom: number;
}

/**
 * Generates a Zillow search URL based on location, bedrooms, and budget
 * @param location - The location to search in (city, neighborhood, etc.)
 * @param bedrooms - Minimum number of bedrooms (0 for studio)
 * @param budget - Maximum monthly rent in USD
 * @returns A formatted Zillow search URL
 */
export function generateZillowUrl(
  location?: string,
  bedrooms?: number,
  budget?: number
): string {
  if (!location) {
    return '';
  }

  // Format the location for the URL path (lowercase, spaces to hyphens)
  const formattedLocation = location.toLowerCase().replace(/\s+/g, '-');
  
  // Base URL components
  const baseUrl = 'https://www.zillow.com';
  const path = `/${formattedLocation}/apartments/`;
  
  // Build the searchQueryState object
  const searchQueryState: ZillowSearchQueryState = {
    usersSearchTerm: location,
    isMapVisible: true,
    filterState: {},
    isListVisible: true,
    mapZoom: 12
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
      max: budget
    };
    
    // Also set the price parameter for compatibility
    searchQueryState.filterState.price = {
      max: budget * 200 // Rough estimate for price filter based on monthly rent
    };
  }
  
  // Set rental filters
  searchQueryState.filterState.fr = { value: true }; // For Rent
  searchQueryState.filterState.fsba = { value: false }; // For Sale By Agent
  searchQueryState.filterState.fsbo = { value: false }; // For Sale By Owner
  searchQueryState.filterState.nc = { value: false }; // New Construction
  searchQueryState.filterState.cmsn = { value: false }; // Coming Soon
  searchQueryState.filterState.auc = { value: false }; // Auction
  searchQueryState.filterState.fore = { value: false }; // Foreclosure
  
  // Encode the searchQueryState as a URL parameter
  const encodedSearchQueryState = encodeURIComponent(JSON.stringify(searchQueryState));
  
  // Construct the final URL
  return `${baseUrl}${path}?searchQueryState=${encodedSearchQueryState}`;
} 