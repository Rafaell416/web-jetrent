'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBookmarkStore } from '@/lib/store/bookmarks';
import PropertyCard from '@/components/property/property-card';
import PropertyLabels from '@/components/property/property-labels';
import { ChevronLeft, Plus, Tag, Filter, X } from 'lucide-react';

export default function BookmarksPage() {
  const { bookmarks, labels } = useBookmarkStore();
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showLabelManager, setShowLabelManager] = useState(false);
  
  // Filter bookmarks by selected labels
  const filteredBookmarks = useMemo(() => {
    if (selectedLabels.length === 0) {
      return bookmarks;
    }
    
    return bookmarks.filter(property => {
      if (!property.labels) return false;
      
      // Check if the property has at least one of the selected labels
      return selectedLabels.some(labelId => 
        property.labels?.includes(labelId)
      );
    });
  }, [bookmarks, selectedLabels]);

  // Toggle a label in the filter
  const toggleLabelFilter = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId) 
        : [...prev, labelId]
    );
  };
  
  // Clear all label filters
  const clearFilters = () => {
    setSelectedLabels([]);
  };

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
      
      {/* Label filters */}
      {labels.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter by Labels
            </h2>
            {selectedLabels.length > 0 && (
              <button 
                onClick={clearFilters}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {labels.map(label => (
              <button
                key={label.id}
                onClick={() => toggleLabelFilter(label.id)}
                className={`px-3 py-1.5 rounded-full flex items-center ${
                  selectedLabels.includes(label.id)
                    ? 'text-white'
                    : 'text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={selectedLabels.includes(label.id) ? { backgroundColor: label.color } : {}}
              >
                <span 
                  className={`w-3 h-3 rounded-full mr-2 ${!selectedLabels.includes(label.id) ? 'opacity-70' : ''}`}
                  style={{ backgroundColor: label.color }} 
                />
                {label.name}
              </button>
            ))}
            
            <button
              onClick={() => setShowLabelManager(true)}
              className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Manage Labels
            </button>
          </div>
        </div>
      )}

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
      ) : filteredBookmarks.length === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg text-blue-700 dark:text-blue-400 text-center">
          <p className="mb-2 text-lg font-semibold">No matching properties</p>
          <p className="mb-4">No properties match your selected label filters.</p>
          <button 
            onClick={clearFilters}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookmarks.map((property) => (
            <div key={property.plid || property.zpid} className="flex flex-col">
              <PropertyCard property={property} />
              {/* Full-size property labels section for detailed labels management */}
              <div className="mt-2">
                <PropertyLabels 
                  propertyId={property.plid || property.zpid || ''} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Label manager modal */}
      {showLabelManager && labels[0] && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Manage Global Labels
              </h3>
              <button 
                onClick={() => setShowLabelManager(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Use any property ID to manage the global labels */}
            <PropertyLabels 
              propertyId={bookmarks[0]?.plid || bookmarks[0]?.zpid || ''}
            />
            
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => setShowLabelManager(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 