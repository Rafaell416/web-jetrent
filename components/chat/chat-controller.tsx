'use client';

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Message, { MessageType } from './message';
import ChatInput from './chat-input';
import { extractSearchParameters, generateAIResponse } from '@/lib/openai';
import { searchApartments } from '@/lib/apartments';
import { Card } from '@/components/ui/card';

// Initial welcome message
const WELCOME_MESSAGE: MessageType = {
  id: 'welcome',
  content: "👋 Welcome to JetRent! I'm your apartment-finding assistant. Tell me about the apartment you're looking for, including location, number of bedrooms, and your budget.",
  role: 'assistant',
  timestamp: new Date()
};

// Define a type for OpenAI message roles
type OpenAIMessageRole = 'user' | 'assistant' | 'system';

// Component to display extracted parameters
const ParameterDisplay = ({ 
  params, 
  title = "Extracted Parameters", 
  visible = true
}: { 
  params: { 
    location?: string; 
    bedrooms?: number; 
    budget?: number; 
    missingParameters?: string[];
  };
  title?: string;
  visible?: boolean;
}) => {
  if (!visible) return null;
  
  return (
    <div className="my-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">{title}</h3>
      <div className="grid grid-cols-1 gap-1 text-sm">
        <div className="flex items-center">
          <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">Location:</span>
          <span className="text-gray-900 dark:text-gray-100">{params.location || "Not specified"}</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">Bedrooms:</span>
          <span className="text-gray-900 dark:text-gray-100">
            {params.bedrooms !== undefined ? 
              (params.bedrooms === 0 ? 'Studio' : params.bedrooms) : 
              "Not specified"}
          </span>
        </div>
        <div className="flex items-center">
          <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">Budget:</span>
          <span className="text-gray-900 dark:text-gray-100">
            {params.budget !== undefined ? `$${params.budget}` : "Not specified"}
          </span>
        </div>
        {params.missingParameters && params.missingParameters.length > 0 && (
          <div className="flex items-center mt-1 text-amber-600 dark:text-amber-400">
            <span className="font-medium mr-2">Missing:</span>
            <span>{params.missingParameters.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ChatController() {
  const [messages, setMessages] = useState<MessageType[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchState, setSearchState] = useState<{
    location?: string;
    bedrooms?: number;
    budget?: number;
    hasAllParameters: boolean;
    searchPerformed: boolean;
  }>({
    hasAllParameters: false,
    searchPerformed: false
  });
  
  // New state to track the latest extracted parameters
  const [extractedParams, setExtractedParams] = useState<{
    location?: string;
    bedrooms?: number;
    budget?: number;
    missingParameters?: string[];
    isGreeting?: boolean;
  }>({});
  
  // State to control parameter display visibility
  const [showParameters, setShowParameters] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      
      // REASONING PHASE - Step 1: Understand user intent
      console.log("ReAct - Reasoning: Analyzing user message to understand intent");
      const extractedParams = await extractSearchParameters(content);
      
      // Update the extracted parameters state and show the display
      setExtractedParams(extractedParams);
      setShowParameters(true);
      
      // Add the extracted parameters as a system message in the chat
      if (!extractedParams.isGreeting && Object.keys(extractedParams).some(key => {
        if (key === 'missingParameters' || key === 'isGreeting') return false;
        return extractedParams[key as keyof typeof extractedParams] !== undefined;
      })) {
        let paramMessage = "🔍 **Extracted Parameters:**\n\n";
        
        if (extractedParams.location) {
          paramMessage += `📍 **Location**: ${extractedParams.location}\n`;
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
      const updatedBedrooms = extractedParams.bedrooms !== undefined 
        ? extractedParams.bedrooms 
        : searchState.bedrooms;
      const updatedBudget = extractedParams.budget !== undefined 
        ? extractedParams.budget 
        : searchState.budget;
      
      // Determine what's missing
      const missingParams = [];
      if (!updatedLocation) missingParams.push('location');
      if (updatedBedrooms === undefined) missingParams.push('number of bedrooms');
      if (updatedBudget === undefined) missingParams.push('budget');
      
      // Check if we have all parameters needed
      const hasAllParams = missingParams.length === 0;
      
      // REASONING PHASE - Step 3: Determine next action
      if (hasAllParams) {
        console.log("ReAct - Reasoning: All parameters collected, can perform search");
      } else {
        console.log(`ReAct - Reasoning: Missing parameters: ${missingParams.join(', ')}, need to ask user`);
      }
      
      // Update search state with what we know so far
      setSearchState({
        location: updatedLocation,
        bedrooms: updatedBedrooms,
        budget: updatedBudget,
        hasAllParameters: hasAllParams,
        searchPerformed: false
      });
      
      // ACTING PHASE: Either ask for missing info or perform the search
      if (hasAllParams) {
        console.log("ReAct - Acting: Performing apartment search");
        // All parameters are available, let's search
        const apartments = searchApartments({
          location: updatedLocation,
          bedrooms: updatedBedrooms,
          budget: updatedBudget
        });
        
        // Generate search results message
        let responseContent = '';
        
        if (apartments.length > 0) {
          console.log(`ReAct - Acting: Found ${apartments.length} matching apartments, generating results`);
          // Prepare apartment results to include in the message to the AI
          let apartmentResults = `Based on your criteria (${updatedBedrooms === 0 ? 'Studio' : `${updatedBedrooms} bedroom`} in ${updatedLocation} with budget $${updatedBudget}), I found ${apartments.length} apartments:\n\n`;
          
          apartments.forEach((apt, index) => {
            apartmentResults += `${index + 1}. ${apt.title} - ${apt.location} - ${apt.bedrooms === 0 ? 'Studio' : `${apt.bedrooms} bedroom`} - $${apt.rent}/month - ${apt.description}\n`;
          });
          
          // Get all previous messages
          const conversationHistory = formatMessagesForOpenAI(messages);
          conversationHistory.push({
            role: 'user' as OpenAIMessageRole,
            content
          });
          
          // Add a system message with the search results for the AI to reference
          conversationHistory.push({
            role: 'system' as OpenAIMessageRole,
            content: `You are presenting apartment search results to the user. Here are the results: ${apartmentResults}\n\nPresent these results in a friendly, conversational way. Format them nicely with emojis, and ask if they'd like to modify their search criteria.`
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
          
          conversationHistory.push({
            role: 'system' as OpenAIMessageRole,
            content: `The user is looking for ${updatedBedrooms === 0 ? 'a studio' : `a ${updatedBedrooms} bedroom apartment`} in ${updatedLocation} with a budget of $${updatedBudget}, but no matching apartments were found. Inform them gently and ask if they'd like to try different criteria.`
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
          searchPerformed: true
        }));
      } else {
        console.log(`ReAct - Acting: Asking user for missing parameters: ${missingParams.join(', ')}`);
        // Some parameters are missing, ask for them
        const missingParamsText = missingParams.join(', ');
        
        // Build context for the AI about what we already know and what's missing
        let contextForAI = `The user is looking for an apartment. `;
        
        if (updatedLocation) {
          contextForAI += `They want to live in ${updatedLocation}. `;
        }
        
        if (updatedBedrooms !== undefined) {
          contextForAI += `They need ${updatedBedrooms === 0 ? 'a studio' : `${updatedBedrooms} bedroom${updatedBedrooms !== 1 ? 's' : ''}`}. `;
        }
        
        if (updatedBudget !== undefined) {
          contextForAI += `Their budget is $${updatedBudget}. `;
        }
        
        contextForAI += `I still need to ask for their ${missingParamsText}. Be conversational and friendly.`;
        
        // Get all previous messages for context
        const conversationHistory = formatMessagesForOpenAI(messages);
        conversationHistory.push({
          role: 'user' as OpenAIMessageRole,
          content
        });
        
        // Add system message with context about what's missing
        conversationHistory.push({
          role: 'system' as OpenAIMessageRole,
          content: contextForAI
        });
        
        // Generate AI response asking for missing information
        const responseContent = await generateAIResponse(conversationHistory);
        
        // Add AI response to chat
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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="p-4 bg-neutral-100 dark:bg-neutral-800 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">JetRent - Apartment Finder</h1>
      </div>
      
      <div className="flex h-[calc(100vh-132px)]">
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <Card className="p-3 bg-neutral-100 dark:bg-neutral-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Parameters panel */}
        <div className="w-80 border-l p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-4">Search Parameters</h2>
          <ParameterDisplay 
            params={extractedParams} 
            title="Latest Extracted Parameters"
            visible={showParameters}
          />
          
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Current Search Criteria</h3>
            <ParameterDisplay 
              params={{
                location: searchState.location,
                bedrooms: searchState.bedrooms,
                budget: searchState.budget,
                missingParameters: !searchState.hasAllParameters ? 
                  [
                    !searchState.location ? 'location' : null,
                    searchState.bedrooms === undefined ? 'bedrooms' : null,
                    searchState.budget === undefined ? 'budget' : null
                  ].filter(Boolean) as string[] : []
              }}
              title=""
              visible={true}
            />
          </div>
          
          {searchState.searchPerformed && (
            <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-800 text-sm">
              <p className="text-green-700 dark:text-green-300">
                <span className="font-semibold">✓ Search completed</span> with all required parameters.
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Debug Log</h3>
            <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded h-40 overflow-y-auto">
              <div className="text-gray-500 dark:text-gray-400">
                {/* We'll keep this empty for now but could add real-time logs */}
                <p>ReAct Agent initialized</p>
                {extractedParams.location && <p>→ Extracted location: {extractedParams.location}</p>}
                {extractedParams.bedrooms !== undefined && <p>→ Extracted bedrooms: {extractedParams.bedrooms}</p>}
                {extractedParams.budget !== undefined && <p>→ Extracted budget: ${extractedParams.budget}</p>}
                {extractedParams.isGreeting && <p>→ Detected greeting</p>}
                {searchState.hasAllParameters ? 
                  <p>→ All parameters collected</p> : 
                  <p>→ Missing parameters: {
                    [
                      !searchState.location ? 'location' : null,
                      searchState.bedrooms === undefined ? 'bedrooms' : null,
                      searchState.budget === undefined ? 'budget' : null
                    ].filter(Boolean).join(', ')
                  }</p>
                }
                {searchState.searchPerformed && <p>→ Search performed</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
} 