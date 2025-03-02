import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ZillowProperty } from '@/lib/zillow-scraper';

// Define a label type
export interface PropertyLabel {
  id: string;
  name: string;
  color: string;
}

// Define a bookmark type that includes labels
export interface BookmarkedProperty extends ZillowProperty {
  labels?: string[]; // Array of label IDs
}

interface BookmarkState {
  bookmarks: BookmarkedProperty[];
  labels: PropertyLabel[];
  addBookmark: (property: ZillowProperty) => void;
  removeBookmark: (propertyId: string) => void;
  isBookmarked: (propertyId: string) => boolean;
  addLabel: (name: string, color: string) => string; // Returns the new label ID
  removeLabel: (labelId: string) => void;
  updateLabel: (labelId: string, updates: Partial<PropertyLabel>) => void;
  addLabelToProperty: (propertyId: string, labelId: string) => void;
  removeLabelFromProperty: (propertyId: string, labelId: string) => void;
  getPropertyLabels: (propertyId: string) => PropertyLabel[];
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      labels: [
        // Default labels
        { id: 'favorite', name: 'Favorite', color: '#FF4136' },
        { id: 'toVisit', name: 'To Visit', color: '#2ECC40' },
        { id: 'contacted', name: 'Contacted', color: '#0074D9' },
      ],
      
      addBookmark: (property) => {
        set((state) => {
          // Check if property is already bookmarked
          const id = property.plid || property.zpid || '';
          const isAlreadyBookmarked = state.bookmarks.some(
            (bookmark) => (bookmark.plid || bookmark.zpid) === id
          );
          
          if (isAlreadyBookmarked) {
            return state;
          }
          
          return {
            bookmarks: [...state.bookmarks, { ...property, labels: [] }],
          };
        });
      },
      
      removeBookmark: (propertyId) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter(
            (bookmark) => (bookmark.plid || bookmark.zpid) !== propertyId
          ),
        }));
      },
      
      isBookmarked: (propertyId) => {
        return get().bookmarks.some(
          (bookmark) => (bookmark.plid || bookmark.zpid) === propertyId
        );
      },
      
      addLabel: (name, color) => {
        const id = Date.now().toString();
        set((state) => ({
          labels: [...state.labels, { id, name, color }]
        }));
        return id;
      },
      
      removeLabel: (labelId) => {
        set((state) => {
          // Remove the label
          const labels = state.labels.filter(label => label.id !== labelId);
          
          // Remove the label from all properties
          const bookmarks = state.bookmarks.map(bookmark => {
            if (bookmark.labels) {
              return {
                ...bookmark,
                labels: bookmark.labels.filter(id => id !== labelId)
              };
            }
            return bookmark;
          });
          
          return { labels, bookmarks };
        });
      },
      
      updateLabel: (labelId, updates) => {
        set((state) => ({
          labels: state.labels.map(label => 
            label.id === labelId ? { ...label, ...updates } : label
          )
        }));
      },
      
      addLabelToProperty: (propertyId, labelId) => {
        set((state) => ({
          bookmarks: state.bookmarks.map(bookmark => {
            const id = bookmark.plid || bookmark.zpid || '';
            if (id === propertyId) {
              // Ensure labels array exists and add the label if not already present
              const labels = bookmark.labels || [];
              if (!labels.includes(labelId)) {
                return { ...bookmark, labels: [...labels, labelId] };
              }
            }
            return bookmark;
          })
        }));
      },
      
      removeLabelFromProperty: (propertyId, labelId) => {
        set((state) => ({
          bookmarks: state.bookmarks.map(bookmark => {
            const id = bookmark.plid || bookmark.zpid || '';
            if (id === propertyId && bookmark.labels) {
              return {
                ...bookmark,
                labels: bookmark.labels.filter(id => id !== labelId)
              };
            }
            return bookmark;
          })
        }));
      },
      
      getPropertyLabels: (propertyId) => {
        const { bookmarks, labels } = get();
        const property = bookmarks.find(
          bookmark => (bookmark.plid || bookmark.zpid) === propertyId
        );
        
        if (!property || !property.labels) {
          return [];
        }
        
        return property.labels
          .map(labelId => labels.find(label => label.id === labelId))
          .filter((label): label is PropertyLabel => label !== undefined);
      },
    }),
    {
      name: 'property-bookmarks',
    }
  )
); 