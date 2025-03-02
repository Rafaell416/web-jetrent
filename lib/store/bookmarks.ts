import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ZillowProperty } from '@/lib/zillow-scraper';

interface BookmarkState {
  bookmarks: ZillowProperty[];
  addBookmark: (property: ZillowProperty) => void;
  removeBookmark: (propertyId: string) => void;
  isBookmarked: (propertyId: string) => boolean;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      
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
            bookmarks: [...state.bookmarks, property],
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
    }),
    {
      name: 'property-bookmarks',
    }
  )
); 