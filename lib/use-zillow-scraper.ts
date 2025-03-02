import { useState, useEffect, useCallback } from 'react';
import { ZillowProperty, fetchZillowProperties, createZillowScraperParams } from './zillow-scraper';

interface UseZillowScraperProps {
  location?: string;
  state?: string;
  bedrooms?: number;
  budget?: number;
  enabled?: boolean;
}

interface UseZillowScraperResult {
  properties: ZillowProperty[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage Zillow property data
 * @param props - Search parameters and options
 * @returns Object containing properties, loading state, error state, and refetch function
 */
export function useZillowScraper(props: UseZillowScraperProps): UseZillowScraperResult {
  const { location, bedrooms, budget, enabled = true } = props;
  const [properties, setProperties] = useState<ZillowProperty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch properties
  const fetchProperties = useCallback(async () => {
    // Don't fetch if no location or not enabled
    if (!location || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create search params for the Zillow scraper API
      const params = createZillowScraperParams(location, bedrooms, budget);
      
      // Fetch properties from the API
      const results = await fetchZillowProperties(params);
      
      // Ensure results is an array
      if (!Array.isArray(results)) {
        console.error('fetchZillowProperties returned non-array value:', results);
        setProperties([]);
        setError('Received invalid data format from the API. Please try again.');
        return;
      }
      
      setProperties(results);
      
      // Log success to console for debugging
      console.log(`Successfully fetched ${results.length} properties for ${location}`);
      
    } catch (err) {
      console.error('Error fetching Zillow properties:', err);
      setProperties([]);
      setError('Failed to load properties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [bedrooms, budget, enabled, location]);

  // Fetch properties when search parameters change
  useEffect(() => {
    fetchProperties();
  }, [location, bedrooms, budget, enabled, fetchProperties]);

  return {
    properties,
    isLoading,
    error,
    refetch: fetchProperties
  };
} 