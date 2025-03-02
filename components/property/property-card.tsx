'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ZillowProperty } from '@/lib/zillow-scraper';

interface PropertyCardProps {
  property: ZillowProperty;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  // Format min beds for display
  const bedsDisplay = property.minBeds === 0 ? 'Studio' : `${property.minBeds} bed`;
  
  // Format min baths for display
  const bathsDisplay = `${property.minBaths} bath`;
  
  // Format area if available
  const areaDisplay = property.minArea ? `${property.minArea} sq ft` : '';

  // Handle building name
  const buildingDisplay = property.buildingName || '';
  
  // Format the Zillow URL - handle both detailUrl and zpid formats
  let zillowUrl;
  if (property.detailUrl) {
    zillowUrl = `https://www.zillow.com${property.detailUrl}`;
  } else if (property.zpid) {
    zillowUrl = `https://www.zillow.com/homedetails/${property.zpid}_zpid/`;
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative w-full h-48 overflow-hidden">
        {property.hasImage ? (
          <img 
            src={property.imgSrc} 
            alt={property.address || 'Property'} 
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500">
            No image available
          </div>
        )}
        {property.badgeInfo && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md">
            {property.badgeInfo.text}
          </div>
        )}
        {property.has3DModel && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-md">
            3D Tour
          </div>
        )}
      </div>
      
      <CardContent className="flex-grow p-4">
        <div className="font-bold text-lg mb-1">{property.price}</div>
        <div className="text-sm mb-2 flex gap-1">
          <span>{bedsDisplay}</span>
          <span>•</span>
          <span>{bathsDisplay}</span>
          {areaDisplay && (
            <>
              <span>•</span>
              <span>{areaDisplay}</span>
            </>
          )}
        </div>
        {buildingDisplay && (
          <div className="text-md font-semibold mb-1">{buildingDisplay}</div>
        )}
        <div className="text-sm text-gray-600">{property.address}</div>
      </CardContent>
      
      <CardFooter className="border-t p-3 bg-gray-50 dark:bg-gray-900">
        {zillowUrl ? (
          <a 
            href={zillowUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
          >
            {(() => {
              const sites = [
                { name: 'View on Zillow', color: 'text-blue-600 dark:text-blue-400' },
                { name: 'View on Apartments.com', color: 'text-green-600 dark:text-green-400' },
                { name: 'View on Rent.com', color: 'text-purple-600 dark:text-purple-400' }
              ];
              const randomSite = sites[Math.floor(Math.random() * sites.length)];
              return <span className={randomSite.color}>{randomSite.name}</span>;
            })()}
          </a>
        ) : (
          <span className="text-sm text-gray-500 w-full text-center">
            No details available
          </span>
        )}
      </CardFooter>
    </Card>
  );
} 