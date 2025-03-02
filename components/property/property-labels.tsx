'use client';

import React, { useState } from 'react';
import { useBookmarkStore, PropertyLabel } from '@/lib/store/bookmarks';
import { Plus, X, Check, Edit, Trash2 } from 'lucide-react';

interface PropertyLabelsProps {
  propertyId: string;
  compact?: boolean; // For compact display in property cards
}

export default function PropertyLabels({ propertyId, compact = false }: PropertyLabelsProps) {
  const { 
    labels, 
    getPropertyLabels, 
    addLabelToProperty, 
    removeLabelFromProperty,
    addLabel,
    removeLabel,
    updateLabel
  } = useBookmarkStore();
  
  const [isManaging, setIsManaging] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6'); // Default blue color
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  
  // Get the current labels for this property
  const propertyLabels = getPropertyLabels(propertyId);
  
  // Toggle a label on the property
  const toggleLabel = (labelId: string) => {
    const hasLabel = propertyLabels.some(label => label.id === labelId);
    
    if (hasLabel) {
      removeLabelFromProperty(propertyId, labelId);
    } else {
      addLabelToProperty(propertyId, labelId);
    }
  };
  
  // Create a new label
  const handleCreateLabel = () => {
    if (newLabelName.trim()) {
      const labelId = addLabel(newLabelName.trim(), newLabelColor);
      addLabelToProperty(propertyId, labelId);
      setNewLabelName('');
      setNewLabelColor('#3B82F6');
    }
  };
  
  // Prepare for editing a label
  const startEditLabel = (label: PropertyLabel) => {
    setEditingLabelId(label.id);
    setNewLabelName(label.name);
    setNewLabelColor(label.color);
  };
  
  // Save label edits
  const saveEditLabel = () => {
    if (editingLabelId && newLabelName.trim()) {
      updateLabel(editingLabelId, {
        name: newLabelName.trim(),
        color: newLabelColor
      });
      setEditingLabelId(null);
      setNewLabelName('');
      setNewLabelColor('#3B82F6');
    }
  };
  
  // Cancel editing
  const cancelEditLabel = () => {
    setEditingLabelId(null);
    setNewLabelName('');
    setNewLabelColor('#3B82F6');
  };
  
  // Handle deleting a label
  const handleDeleteLabel = (labelId: string) => {
    removeLabel(labelId);
  };

  // Compact display for property cards
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {propertyLabels.map(label => (
          <span
            key={label.id}
            className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
          </span>
        ))}
        {propertyLabels.length === 0 && (
          <button
            onClick={() => setIsManaging(true)}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="inline w-3 h-3 mr-1" />
            Add label
          </button>
        )}
        
        {isManaging && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Manage Labels</h3>
                <button 
                  onClick={() => setIsManaging(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Full label management UI */}
              <div className="space-y-4">
                {/* Label selection */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Select Labels</h4>
                  {labels.map(label => (
                    <div key={label.id} className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`label-${label.id}`}
                        checked={propertyLabels.some(l => l.id === label.id)}
                        onChange={() => toggleLabel(label.id)}
                        className="mr-2"
                      />
                      <label 
                        htmlFor={`label-${label.id}`}
                        className="flex items-center flex-1"
                      >
                        <span 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: label.color }} 
                        />
                        <span>{label.name}</span>
                      </label>
                      
                      {/* Edit/Delete buttons */}
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => startEditLabel(label)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteLabel(label.id)}
                          className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Label creation/editing form */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-2">
                    {editingLabelId ? 'Edit Label' : 'Create New Label'}
                  </h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <input 
                      type="color" 
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-8 h-8 rounded border p-0"
                    />
                    <input 
                      type="text"
                      placeholder="Label name"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    {editingLabelId ? (
                      <>
                        <button 
                          onClick={saveEditLabel}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1 flex items-center justify-center"
                          disabled={!newLabelName.trim()}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </button>
                        <button 
                          onClick={cancelEditLabel}
                          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={handleCreateLabel}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1 flex items-center justify-center"
                        disabled={!newLabelName.trim()}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Label
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Full display for bookmarks page
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Labels</h3>
        <button
          onClick={() => setIsManaging(true)}
          className="text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Manage Labels
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {propertyLabels.map(label => (
          <span
            key={label.id}
            className="px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
          </span>
        ))}
        {propertyLabels.length === 0 && (
          <p className="text-sm text-gray-500">No labels added yet</p>
        )}
      </div>
      
      {isManaging && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Manage Labels</h3>
              <button 
                onClick={() => setIsManaging(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Full label management UI */}
            <div className="space-y-4">
              {/* Label selection */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Select Labels</h4>
                {labels.map(label => (
                  <div key={label.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={`label-${label.id}`}
                      checked={propertyLabels.some(l => l.id === label.id)}
                      onChange={() => toggleLabel(label.id)}
                      className="mr-2"
                    />
                    <label 
                      htmlFor={`label-${label.id}`}
                      className="flex items-center flex-1"
                    >
                      <span 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: label.color }} 
                      />
                      <span>{label.name}</span>
                    </label>
                    
                    {/* Edit/Delete buttons */}
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => startEditLabel(label)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteLabel(label.id)}
                        className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Label creation/editing form */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2">
                  {editingLabelId ? 'Edit Label' : 'Create New Label'}
                </h4>
                <div className="flex items-center space-x-2 mb-2">
                  <input 
                    type="color" 
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="w-8 h-8 rounded border p-0"
                  />
                  <input 
                    type="text"
                    placeholder="Label name"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                
                <div className="flex space-x-2">
                  {editingLabelId ? (
                    <>
                      <button 
                        onClick={saveEditLabel}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1 flex items-center justify-center"
                        disabled={!newLabelName.trim()}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </button>
                      <button 
                        onClick={cancelEditLabel}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleCreateLabel}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1 flex items-center justify-center"
                      disabled={!newLabelName.trim()}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Label
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 