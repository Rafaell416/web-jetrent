// Mock apartment data for different locations
const mockApartments: Record<string, Array<{
  id: string;
  title: string;
  location: string;
  bedrooms: number;
  rent: number;
  description: string;
  imageUrl: string;
}>> = {
  'new york': [
    {
      id: 'ny-1',
      title: 'Modern Studio in Manhattan',
      location: 'Manhattan, New York',
      bedrooms: 0,
      rent: 2200,
      description: 'Cozy studio apartment in the heart of Manhattan with great views.',
      imageUrl: 'https://placehold.co/600x400/png?text=Manhattan+Studio'
    },
    {
      id: 'ny-2',
      title: 'Spacious 1BR in Brooklyn',
      location: 'Brooklyn, New York',
      bedrooms: 1,
      rent: 2800,
      description: 'Renovated 1-bedroom apartment with hardwood floors in trendy Brooklyn neighborhood.',
      imageUrl: 'https://placehold.co/600x400/png?text=Brooklyn+1BR'
    },
    {
      id: 'ny-3',
      title: 'Luxury 2BR in Upper East Side',
      location: 'Upper East Side, New York',
      bedrooms: 2,
      rent: 3500,
      description: 'Upscale 2-bedroom apartment with doorman and fitness center.',
      imageUrl: 'https://placehold.co/600x400/png?text=Upper+East+Side+2BR'
    }
  ],
  'los angeles': [
    {
      id: 'la-1',
      title: 'Beachside Studio in Santa Monica',
      location: 'Santa Monica, Los Angeles',
      bedrooms: 0,
      rent: 1900,
      description: 'Bright studio just steps from the beach with ocean views.',
      imageUrl: 'https://placehold.co/600x400/png?text=Santa+Monica+Studio'
    },
    {
      id: 'la-2',
      title: 'Modern 1BR in Downtown LA',
      location: 'Downtown, Los Angeles',
      bedrooms: 1,
      rent: 2300,
      description: 'Contemporary 1-bedroom loft in revitalized downtown area.',
      imageUrl: 'https://placehold.co/600x400/png?text=Downtown+LA+1BR'
    },
    {
      id: 'la-3',
      title: 'Spacious 2BR in Hollywood Hills',
      location: 'Hollywood Hills, Los Angeles',
      bedrooms: 2,
      rent: 3200,
      description: 'Luxurious 2-bedroom home with amazing city views and pool access.',
      imageUrl: 'https://placehold.co/600x400/png?text=Hollywood+Hills+2BR'
    }
  ],
  'chicago': [
    {
      id: 'chi-1',
      title: 'Loop Studio Apartment',
      location: 'The Loop, Chicago',
      bedrooms: 0,
      rent: 1600,
      description: 'Efficient studio in Chicago\'s business district with great amenities.',
      imageUrl: 'https://placehold.co/600x400/png?text=Chicago+Loop+Studio'
    },
    {
      id: 'chi-2',
      title: '1BR in Lincoln Park',
      location: 'Lincoln Park, Chicago',
      bedrooms: 1,
      rent: 1900,
      description: 'Charming 1-bedroom apartment in a historic building near the park.',
      imageUrl: 'https://placehold.co/600x400/png?text=Lincoln+Park+1BR'
    },
    {
      id: 'chi-3',
      title: 'Luxury 2BR in River North',
      location: 'River North, Chicago',
      bedrooms: 2,
      rent: 2700,
      description: 'Upscale 2-bedroom apartment with city views and rooftop deck.',
      imageUrl: 'https://placehold.co/600x400/png?text=River+North+2BR'
    }
  ],
  'boston': [
    {
      id: 'bos-1',
      title: 'Back Bay Studio',
      location: 'Back Bay, Boston',
      bedrooms: 0,
      rent: 1800,
      description: 'Cozy studio in historic brownstone building.',
      imageUrl: 'https://placehold.co/600x400/png?text=Back+Bay+Studio'
    },
    {
      id: 'bos-2',
      title: '1BR in Beacon Hill',
      location: 'Beacon Hill, Boston',
      bedrooms: 1,
      rent: 2400,
      description: 'Classic 1-bedroom apartment on gas-lit street.',
      imageUrl: 'https://placehold.co/600x400/png?text=Beacon+Hill+1BR'
    },
    {
      id: 'bos-3',
      title: 'Modern 2BR in Seaport',
      location: 'Seaport District, Boston',
      bedrooms: 2,
      rent: 3100,
      description: 'New construction with 2 bedrooms and harbor views.',
      imageUrl: 'https://placehold.co/600x400/png?text=Seaport+2BR'
    }
  ]
};

// Function to search apartments based on parameters
export function searchApartments({
  location,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  zipcode,
  bedrooms,
  budget
}: {
  location?: string;
  state?: string;
  zipcode?: string;
  bedrooms?: number;
  budget?: number;
}) {
  // Default to empty array if location is not found
  if (!location) return [];
  
  // State and zipcode parameters are accepted for API consistency but not used in mock data search
  
  const locationKey = location.toLowerCase();
  let apartments = [];
  
  // Try to find exact match for the location
  if (mockApartments[locationKey]) {
    apartments = mockApartments[locationKey];
  } else {
    // If no exact match, try to find a location that includes the search term
    const matchingLocation = Object.keys(mockApartments).find(key => 
      key.includes(locationKey) || locationKey.includes(key)
    );
    
    if (matchingLocation) {
      apartments = mockApartments[matchingLocation];
    } else {
      // If still no match, return apartments from any location (first in the list)
      const firstLocation = Object.keys(mockApartments)[0];
      apartments = mockApartments[firstLocation];
    }
  }
  
  // Filter by bedrooms if specified
  if (bedrooms !== undefined) {
    apartments = apartments.filter(apt => apt.bedrooms === bedrooms);
  }
  
  // Filter by budget if specified
  if (budget !== undefined) {
    apartments = apartments.filter(apt => apt.rent <= budget);
  }
  
  return apartments;
} 