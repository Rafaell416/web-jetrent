'use client';

import React from 'react';
import Link from 'next/link';
import { useBookmarkStore } from '@/lib/store/bookmarks';
import PropertyCard from '@/components/property/property-card';
import { ChevronLeft } from 'lucide-react';

export default function BookmarksPage() {
  const { bookmarks } = useBookmarkStore();

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center mb-6">
        <Link 
          href="/"
          className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Bookmarked Properties</h1>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-lg text-yellow-700 dark:text-yellow-400 text-center">
          <p className="mb-2 text-lg font-semibold">No bookmarked properties</p>
          <p className="mb-4">You haven&apos;t bookmarked any properties yet.</p>
          <Link 
            href="/" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((property) => (
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