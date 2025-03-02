'use client';

import React, { useState } from 'react';
import PropertyCard from './property-card';
import { useZillowScraper } from '@/lib/use-zillow-scraper';
import { ZillowProperty } from '@/lib/zillow-scraper';

interface PropertyListProps {
  searchParams: {
    location?: string;
    state?: string;
    bedrooms?: number;
    budget?: number;
  };
  isVisible: boolean;
}

export default function PropertyList({ searchParams, isVisible }: PropertyListProps) {
  // Add state for debug mode
  const [showDebug, setShowDebug] = useState(false);
  
  // Use our custom hook to fetch and manage Zillow properties
  const { properties, isLoading, error } = useZillowScraper({
    location: searchParams.location,
    state: searchParams.state,
    bedrooms: searchParams.bedrooms,
    budget: searchParams.budget,
    enabled: isVisible
  });

  // Ensure properties is an array to prevent the "properties.map is not a function" error
  const propertyArray = Array.isArray(properties) ? properties : [];

  // If the panel is not visible, don't render anything
  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 w-full md:w-96 h-full overflow-y-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Property Listings</h2>
        
        {/* Debug toggle button for developers */}
        <button 
          onClick={() => setShowDebug(prev => !prev)}
          className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          {showDebug ? 'Hide Debug' : 'Debug'}
        </button>
      </div>
      
      {searchParams.location && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Showing results for: {searchParams.location}
          {searchParams.state ? `, ${searchParams.state}` : ''}
          {searchParams.bedrooms !== undefined ? 
            ` • ${searchParams.bedrooms === 0 ? 'Studio' : `${searchParams.bedrooms} bed`}` : ''}
          {searchParams.budget ? ` • Up to $${searchParams.budget}` : ''}
        </p>
      )}
      
      {/* Debug information */}
      {showDebug && (
        <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md">
          <h3 className="text-sm font-semibold mb-1">Debug Info:</h3>
          <div className="text-xs font-mono overflow-x-auto">
            <p>Properties type: {typeof properties}</p>
            <p>Is Array: {Array.isArray(properties) ? 'Yes' : 'No'}</p>
            <p>Length: {Array.isArray(properties) ? properties.length : 'N/A'}</p>
            <p>PropertyArray length: {propertyArray.length}</p>
            {propertyArray.length > 0 && (
              <>
                <p>First item has plid: {propertyArray[0].plid ? 'Yes' : 'No'}</p>
                <p>First item has zpid: {propertyArray[0].zpid ? 'Yes' : 'No'}</p>
                <p>ID used: {propertyArray[0].plid || propertyArray[0].zpid || 'none'}</p>
              </>
            )}
            <details>
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400">Raw Response</summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                {JSON.stringify(properties, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading properties...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : propertyArray.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg text-yellow-700 dark:text-yellow-400">
          No properties found matching your criteria. Try adjusting your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {propertyArray.map((property: ZillowProperty) => (
            <PropertyCard 
              key={property.plid || property.zpid || Math.random().toString(36).substring(7)} 
              property={property} 
            />
          ))}
        </div>
      )}
    </div>
  );
} 