// Zillow Scraper Service
// This service handles communication with the Zillow scraping API

// Define types for the API request parameters
export interface ZillowScraperParams {
  isApartment: boolean;
  isCondo: boolean;
  isLotLand: boolean;
  isManufactured: boolean;
  isMultiFamily: boolean;
  isSingleFamily: boolean;
  isTownhouse: boolean;
  maxPrice: number;
  search: string;
  status: string;
}

// Define types for the API response
export interface ZillowProperty {
  plid?: string;
  zpid?: string;
  imgSrc: string;
  hasImage: boolean;
  detailUrl?: string;
  statusType?: string;
  rawHomeStatusCd?: string;
  marketingStatusSimplifiedCd?: string;
  statusText?: string;
  price: string;
  address: string;
  minBeds: number;
  minBaths: number;
  minArea?: number;
  lotId?: number;
  latLong?: {
    latitude: number;
    longitude: number;
  };
  variableData?: {
    type: string;
    text?: string;
  };
  badgeInfo?: {
    type: string;
    text: string;
  };
  buildingName?: string;
  buildingId?: string;
  isBuilding?: boolean;
  canSaveBuilding?: boolean;
  has3DModel?: boolean;
  isHomeRec?: boolean;
  hasAdditionalAttributions?: boolean;
  isFeaturedListing?: boolean;
  isShowcaseListing?: boolean;
  listingType?: string;
  isFavorite?: boolean;
  timeOnZillow?: number;
  unitCount?: number;
  rentalMarketingSubType?: string;
  marketingTreatments?: string[];
}

/**
 * Fetches property listings from the Zillow scraper API
 * @param params - The search parameters for the API
 * @returns A promise resolving to an array of ZillowProperty objects
 */
export async function fetchZillowProperties(params: ZillowScraperParams): Promise<ZillowProperty[]> {
  try {
    const response = await fetch('https://jetrent-api-a73336585698.herokuapp.com/api/scrape/zillow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error(`API response error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    // Add defensive code to ensure we return an array
    if (!data) {
      console.error('API returned null or undefined response');
      return [];
    }
    
    // Check if the response is an array
    if (Array.isArray(data)) {
      return data as ZillowProperty[];
    }
    
    // IMPORTANT: Handle the actual API response format, which has a data field containing the array
    if (data.data && Array.isArray(data.data)) {
      console.log(`Found ${data.data.length} properties in data.data array`);
      return data.data as ZillowProperty[];
    }
    
    // If response is an object with a properties field that's an array
    if (data.properties && Array.isArray(data.properties)) {
      return data.properties as ZillowProperty[];
    }
    
    // If response is an object with a results field that's an array
    if (data.results && Array.isArray(data.results)) {
      return data.results as ZillowProperty[];
    }
    
    // If we can't find any array in the response, log and return empty array
    console.error('API response does not contain a properties array', data);
    return [];
  } catch (error) {
    console.error('Error fetching Zillow properties:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Converts search parameters from the chat interface to the format required by the Zillow scraper API
 * @param location - The location search term
 * @param bedrooms - Minimum number of bedrooms (optional)
 * @param budget - Maximum rent budget (optional)
 * @returns ZillowScraperParams object formatted for the API
 */
export function createZillowScraperParams(
  location: string,
  bedrooms?: number,
  budget?: number
): ZillowScraperParams {
  // Default to searching for apartments only
  const params: ZillowScraperParams = {
    isApartment: true,
    isCondo: false,
    isLotLand: false,
    isManufactured: false,
    isMultiFamily: false,
    isSingleFamily: false,
    isTownhouse: false,
    maxPrice: budget || 10000, // Default high budget if not specified
    search: location,
    status: "isForRent"
  };

  return params;
} 