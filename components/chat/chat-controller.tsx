'use client';

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Message, { MessageType } from './message';
import ChatInput from './chat-input';
import { extractSearchParameters, generateAIResponse } from '@/lib/openai';
import { searchApartments } from '@/lib/apartments';
import { generateZillowUrl } from '@/lib/zillow';
import PropertyList from '@/components/property/property-list';

// Initial welcome message
const WELCOME_MESSAGE: MessageType = {
  id: 'welcome',
  content: "👋 Welcome to JetRent! I'm your apartment-finding assistant. Tell me about the apartment you're looking for, including location, number of bedrooms, and your budget.",
  role: 'assistant',
  timestamp: new Date()
};

// Define a type for OpenAI message roles
type OpenAIMessageRole = 'user' | 'assistant' | 'system';

export default function ChatController() {
  const [messages, setMessages] = useState<MessageType[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchState, setSearchState] = useState<{
    location?: string;
    state?: string;
    zipcode?: string;
    bedrooms?: number;
    budget?: number;
    zillowUrl?: string;
    hasAllParameters: boolean;
    searchPerformed: boolean;
  }>(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('searchState');
      return savedState 
        ? JSON.parse(savedState) 
        : { hasAllParameters: false, searchPerformed: false };
    }
    return { hasAllParameters: false, searchPerformed: false };
  });
  
  // New state to track the latest extracted parameters
  const [extractedParams, setExtractedParams] = useState<{
    location?: string;
    state?: string;
    zipcode?: string;
    bedrooms?: number;
    budget?: number;
    missingParameters?: string[];
    isGreeting?: boolean;
  }>(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedParams = localStorage.getItem('extractedParams');
      return savedParams ? JSON.parse(savedParams) : {};
    }
    return {};
  });
  
  // New state to control the property list visibility
  const [showPropertyList, setShowPropertyList] = useState(false);
  
  // Add useEffect to load property list visibility from localStorage on component mount
  useEffect(() => {
    const savedVisibility = localStorage.getItem('propertyListVisible');
    if (savedVisibility) {
      setShowPropertyList(savedVisibility === 'true');
    }
  }, []);
  
  // Add useEffect to save property list visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('propertyListVisible', showPropertyList.toString());
  }, [showPropertyList]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Add effect to save extractedParams to localStorage when it changes
  useEffect(() => {
    // Only save if we have some valid parameters (at least location)
    if (extractedParams.location) {
      localStorage.setItem('extractedParams', JSON.stringify(extractedParams));
    }
  }, [extractedParams]);

  // Add effect to save searchState to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('searchState', JSON.stringify(searchState));
  }, [searchState]);

  // Helper function to convert our MessageType to OpenAI message format
  const formatMessagesForOpenAI = (messagesToFormat: MessageType[]) => {
    return messagesToFormat.map(msg => ({
      role: msg.role === 'user' ? 'user' as OpenAIMessageRole : 'assistant' as OpenAIMessageRole,
      content: msg.content
    }));
  };

  // Function to handle user messages and implement the ReAct loop
  const handleSendMessage = async (content: string) => {
    if (isLoading) return;
    
    try {
      // Add user message to chat
      const userMessage: MessageType = {
        id: uuidv4(),
        content,
        role: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      
      // Check if this is an explicit search command
      const isSearchCommand = /^(search|find|show|get|give me|display)\s+(apartments|properties|listings|rentals|homes)/i.test(content.trim()) ||
                             /^(search|find|show|get|give me|display)\s+zillow/i.test(content.trim());
      
      // REASONING PHASE - Step 1: Understand user intent
      console.log("ReAct - Reasoning: Analyzing user message to understand intent");
      const extractedParams = await extractSearchParameters(content);
      
      // Update the extracted parameters state and show the display
      setExtractedParams(extractedParams);
      
      // Add the extracted parameters as a system message in the chat
      if (!extractedParams.isGreeting && Object.keys(extractedParams).some(key => {
        if (key === 'missingParameters' || key === 'isGreeting') return false;
        return extractedParams[key as keyof typeof extractedParams] !== undefined;
      })) {
        let paramMessage = "🔍 **Extracted Parameters:**\n\n";
        
        if (extractedParams.location) {
          paramMessage += `📍 **Location**: ${extractedParams.location}\n`;
        }
        
        if (extractedParams.state) {
          paramMessage += `🏙️ **State**: ${extractedParams.state}\n`;
        }
        
        if (extractedParams.zipcode) {
          // Check if zipcode was explicitly mentioned in the user's message
          const zipcodeExplicitlyMentioned = content.includes(extractedParams.zipcode);
          paramMessage += `📮 **ZIP Code**: ${extractedParams.zipcode}${zipcodeExplicitlyMentioned ? '' : ' (inferred)'}\n`;
        }
        
        if (extractedParams.bedrooms !== undefined) {
          paramMessage += `🛏️ **Bedrooms**: ${extractedParams.bedrooms === 0 ? 'Studio' : extractedParams.bedrooms}\n`;
        }
        
        if (extractedParams.budget !== undefined) {
          paramMessage += `💰 **Budget**: $${extractedParams.budget}\n`;
        }
        
        if (extractedParams.missingParameters && extractedParams.missingParameters.length > 0) {
          paramMessage += `\n⚠️ **Missing**: ${extractedParams.missingParameters.join(', ')}`;
        }
        
        const systemParamMessage: MessageType = {
          id: uuidv4(),
          content: paramMessage,
          role: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, systemParamMessage]);
      }
      
      // If this is just a greeting, respond accordingly
      if (extractedParams.isGreeting) {
        console.log("ReAct - Reasoning: Detected greeting");
        console.log("ReAct - Acting: Generating greeting response");
        
        const conversationHistory = formatMessagesForOpenAI(messages);
        conversationHistory.push({
          role: 'user' as OpenAIMessageRole,
          content
        });
        
        conversationHistory.push({
          role: 'system' as OpenAIMessageRole,
          content: "The user has just greeted you. Respond with a friendly greeting and ask what kind of apartment they're looking for. DO NOT assume any specific preferences."
        });
        
        const responseContent = await generateAIResponse(conversationHistory);
        
        const aiResponse: MessageType = {
          id: uuidv4(),
          content: responseContent,
          role: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
        return;
      }
      
      // REASONING PHASE - Step 2: Identify what parameters we have and what we're missing
      console.log("ReAct - Reasoning: Identifying search parameters");
      
      // Update with any newly extracted parameters
      const updatedLocation = extractedParams.location || searchState.location;
      const updatedState = extractedParams.state || searchState.state;
      const updatedZipcode = extractedParams.zipcode || searchState.zipcode;
      const updatedBedrooms = extractedParams.bedrooms !== undefined 
        ? extractedParams.bedrooms 
        : searchState.bedrooms;
      const updatedBudget = extractedParams.budget !== undefined 
        ? extractedParams.budget 
        : searchState.budget;
      
      // Debug log for zipcode
      console.log(`Extracted zipcode: ${extractedParams.zipcode}`);
      console.log(`Previous zipcode: ${searchState.zipcode}`);
      console.log(`Updated zipcode: ${updatedZipcode}`);
      
      // Determine what's missing
      const missingParams = [];
      if (!updatedLocation) missingParams.push('location');
      if (!updatedState) missingParams.push('state');
      if (updatedBedrooms === undefined) missingParams.push('number of bedrooms');
      if (updatedBudget === undefined) missingParams.push('budget');
      
      // Check if we have all parameters needed
      const hasAllParams = missingParams.length === 0;
      
      // Generate Zillow URL
      console.log(`Generating Zillow URL with zipcode: ${updatedZipcode}`);
      const zillowUrl = generateZillowUrl(
        updatedLocation,
        updatedState,
        updatedZipcode,
        updatedBedrooms,
        updatedBudget
      );
      console.log(`Generated Zillow URL: ${zillowUrl}`);
      
      // Update search state with what we know so far
      setSearchState({
        location: updatedLocation,
        state: updatedState,
        zipcode: updatedZipcode,
        bedrooms: updatedBedrooms,
        budget: updatedBudget,
        zillowUrl: hasAllParams ? zillowUrl : undefined,
        hasAllParameters: hasAllParams,
        searchPerformed: false
      });
      
      // Check if we should display property listings
      if (extractedParams.location) {
        // Show property list if:
        // 1. It's an explicit search command OR
        // 2. All required parameters are present
        const hasAllRequiredParams = 
          extractedParams.location && 
          (extractedParams.missingParameters === undefined || 
           extractedParams.missingParameters.length === 0);
           
        if (isSearchCommand || hasAllRequiredParams) {
          setShowPropertyList(true);
          
          // Add a message indicating that we're showing properties
          const searchResponseMessage: MessageType = {
            id: uuidv4(),
            content: `📊 **Showing Property Listings**\n\nI've found properties in ${extractedParams.location}${extractedParams.state ? `, ${extractedParams.state}` : ''} that match your criteria. You can view them in the panel on the right.`,
            role: 'assistant',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, searchResponseMessage]);
        }
      }
      
      // Only perform a search if explicitly requested
      if (isSearchCommand && hasAllParams) {
        console.log("ReAct - Acting: Performing apartment search based on explicit request");
        // All parameters are available and search was requested, let's search
        const apartments = searchApartments({
          location: updatedLocation,
          state: updatedState,
          bedrooms: updatedBedrooms,
          budget: updatedBudget
        });
        
        // Generate search results message
        let responseContent = '';
        
        if (apartments.length > 0) {
          console.log(`ReAct - Acting: Found ${apartments.length} matching apartments, generating results`);
          // Prepare apartment results to include in the message to the AI
          const locationDisplay = updatedState ? `${updatedLocation}, ${updatedState}` : updatedLocation;
          let apartmentResults = `Based on your criteria (${updatedBedrooms === 0 ? 'Studio' : `${updatedBedrooms} bedroom`} in ${locationDisplay} with budget $${updatedBudget}), I found ${apartments.length} apartments:\n\n`;
          
          apartments.forEach((apt, index) => {
            apartmentResults += `${index + 1}. ${apt.title} - ${apt.location} - ${apt.bedrooms === 0 ? 'Studio' : `${apt.bedrooms} bedroom`} - $${apt.rent}/month - ${apt.description}\n`;
          });
          
          // Add Zillow URL if available
          if (zillowUrl) {
            apartmentResults += `\nYou can also view similar listings on Zillow: ${zillowUrl}`;
          }
          
          // Get all previous messages
          const conversationHistory = formatMessagesForOpenAI(messages);
          conversationHistory.push({
            role: 'user' as OpenAIMessageRole,
            content
          });
          
          // Add a system message with the search results for the AI to reference
          conversationHistory.push({
            role: 'system' as OpenAIMessageRole,
            content: `You are presenting apartment search results to the user. Here are the results: ${apartmentResults}\n\nPresent these results in a friendly, conversational way. Format them nicely with emojis, and ask if they'd like to modify their search criteria. If there's a Zillow URL, mention it as an option to see more listings.`
          });
          
          // Generate AI response
          responseContent = await generateAIResponse(conversationHistory);
        } else {
          console.log("ReAct - Acting: No matching apartments found, generating empty results message");
          // No apartments found, let the AI generate an appropriate response
          const conversationHistory = formatMessagesForOpenAI(messages);
          conversationHistory.push({
            role: 'user' as OpenAIMessageRole,
            content
          });
          
          let systemMessage = `The user is looking for ${updatedBedrooms === 0 ? 'a studio' : `a ${updatedBedrooms} bedroom apartment`} in ${updatedLocation}, ${updatedState} with a budget of $${updatedBudget}, but no matching apartments were found.`;
          
          // Add Zillow URL if available
          if (zillowUrl) {
            systemMessage += ` However, they can check Zillow for similar listings: ${zillowUrl}`;
          }
          
          systemMessage += ` Inform them gently and ask if they'd like to try different criteria.`;
          
          conversationHistory.push({
            role: 'system' as OpenAIMessageRole,
            content: systemMessage
          });
          
          responseContent = await generateAIResponse(conversationHistory);
        }
        
        // Add AI response to chat
        const aiResponse: MessageType = {
          id: uuidv4(),
          content: responseContent,
          role: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
        
        // Mark search as performed
        setSearchState(prev => ({
          ...prev,
          zillowUrl,
          searchPerformed: true
        }));
      } else if (isSearchCommand && !hasAllParams) {
        // User requested a search but we're missing parameters
        console.log(`ReAct - Acting: Search requested but missing parameters: ${missingParams.join(', ')}`);
        
        const conversationHistory = formatMessagesForOpenAI(messages);
        conversationHistory.push({
          role: 'user' as OpenAIMessageRole,
          content
        });
        
        conversationHistory.push({
          role: 'system' as OpenAIMessageRole,
          content: `The user wants to search for apartments, but I'm missing some information: ${missingParams.join(', ')}. Ask for this information in a friendly way.`
        });
        
        const responseContent = await generateAIResponse(conversationHistory);
        
        const aiResponse: MessageType = {
          id: uuidv4(),
          content: responseContent,
          role: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
      } else if (!extractedParams.isGreeting) {
        // Not a search command, not a greeting, just acknowledge the parameters
        console.log("ReAct - Acting: Acknowledging parameters without searching");
        
        const conversationHistory = formatMessagesForOpenAI(messages);
        conversationHistory.push({
          role: 'user' as OpenAIMessageRole,
          content
        });
        
        let contextForAI = "The user has provided some apartment search parameters. ";
        
        if (updatedLocation) {
          contextForAI += `Location: ${updatedLocation}, ${updatedState}. `;
        }
        
        if (updatedBedrooms !== undefined) {
          contextForAI += `Bedrooms: ${updatedBedrooms === 0 ? 'Studio' : updatedBedrooms}. `;
        }
        
        if (updatedBudget !== undefined) {
          contextForAI += `Budget: $${updatedBudget}. `;
        }
        
        if (missingParams.length > 0) {
          contextForAI += `Still missing: ${missingParams.join(', ')}. `;
        }
        
        contextForAI += "Acknowledge the parameters they've provided. If all parameters are present, ask if they'd like to search for apartments. If parameters are missing, ask for the missing information.";
        
        conversationHistory.push({
          role: 'system' as OpenAIMessageRole,
          content: contextForAI
        });
        
        const responseContent = await generateAIResponse(conversationHistory);
        
        const aiResponse: MessageType = {
          id: uuidv4(),
          content: responseContent,
          role: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message to chat
      const errorMessage: MessageType = {
        id: uuidv4(),
        content: "I'm sorry, I encountered an error while processing your request. Please check that your OpenAI API key is correctly set up in the .env.local file, or try again later.",
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle property list visibility
  const togglePropertyList = () => {
    const newVisibility = !showPropertyList;
    setShowPropertyList(newVisibility);
    localStorage.setItem('propertyListVisible', newVisibility.toString());
  };

  return (
    <div className="flex h-screen">
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${showPropertyList ? 'md:border-r' : ''}`}>
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
              <span className="ml-2 text-gray-500">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          {/* Toggle button for property panel */}
          {extractedParams.location && (
            <div className="flex justify-end mb-2">
              <button 
                onClick={togglePropertyList}
                className="text-sm px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors duration-200"
              >
                {showPropertyList ? 'Hide Properties' : 'Show Properties'}
              </button>
            </div>
          )}
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
      
      {/* Property List Panel */}
      {showPropertyList && (
        <PropertyList 
          searchParams={extractedParams} 
          isVisible={showPropertyList} 
        />
      )}
    </div>
  );
} 