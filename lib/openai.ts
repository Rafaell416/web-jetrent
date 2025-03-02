"use server";

import OpenAI from 'openai';

// Initialize the OpenAI client
const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

// Extract parameters from user query
export async function extractSearchParameters(query: string): Promise<{
  location?: string;
  state?: string;
  zipcode?: string;
  bedrooms?: number;
  budget?: number;
  missingParameters?: string[];
  isGreeting?: boolean;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Extract apartment search parameters from user queries. You are an expert at understanding natural language requests for housing.
                   
                   Return a JSON object with these keys:
                   - location: The city or neighborhood where the user wants to find an apartment
                   - state: The state abbreviation (2 letters) where the location is (e.g., NY for New York, CA for California)
                   - zipcode: The ZIP code of the location. If not explicitly mentioned by the user, you MUST infer a common/central ZIP code for the location
                   - bedrooms: Number of bedrooms (use 0 for studio apartments)
                   - budget: Maximum monthly rent in USD (as a number, no dollar signs or commas)
                   - missingParameters: Array of parameters that were not found in the query (options: "location", "state", "bedrooms", "budget")
                   - isGreeting: Boolean flag indicating if the user's message is just a greeting or small talk
                   
                   IMPORTANT: If the user's message is just a greeting (hi, hello, hey) or small talk with no apartment search intent,
                   set isGreeting to true and don't set any other parameters.
                   
                   Be flexible in extracting information:
                   
                   For LOCATION:
                   - Handle city names, neighborhoods, areas, boroughs, etc.
                   - Normalize common abbreviations (NYC = New York, LA = Los Angeles)
                   - If a user refers to a specific neighborhood, extract it (SoHo, Brooklyn Heights, etc.)
                   - ALWAYS try to determine the state for the location and provide the state abbreviation
                   - If the state is not explicitly mentioned but can be inferred from a well-known city, provide it
                   - Examples: "New York" → state: "NY", "Los Angeles" → state: "CA", "Chicago" → state: "IL"
                   
                   For ZIPCODE:
                   - Extract any 5-digit number that appears to be a ZIP code
                   - If a user mentions a ZIP code like "07086" or "in the 10001 area", extract it
                   - If the user doesn't mention a ZIP code, you MUST infer a common/central ZIP code for the location
                   - ALWAYS provide a zipcode, even if you have to infer it based on the location
                   - Examples of ZIP codes for common locations:
                     * Manhattan, NY → 10001
                     * Brooklyn, NY → 11201
                     * Los Angeles, CA → 90001
                     * Chicago, IL → 60601
                     * Weehawken, NJ → 07086
                     * Boston, MA → 02108
                     * San Francisco, CA → 94103
                     * Miami, FL → 33101
                     * Seattle, WA → 98101
                     * Austin, TX → 78701
                     * Denver, CO → 80202
                   - DO NOT include zipcode in missingParameters even if you had to infer it
                   - The zipcode field is REQUIRED in your response for any valid location
                   
                   For BEDROOMS:
                   - Handle various formats: "2 bed", "2 bedroom", "2 br", "2-bedroom", etc.
                   - Understand "studio" as 0 bedrooms
                   - Convert text numbers to digits (e.g., "two bedrooms" = 2)
                   - ONLY set bedrooms if explicitly mentioned - DO NOT assume
                   
                   For BUDGET:
                   - Handle various formats: $2000, 2000, 2k, 2,000, etc.
                   - Interpret "k" notation (e.g., 2k = 2000)
                   - Understand phrases like "under $2000", "maximum $2000", "up to 2k", etc.
                   - If the user's message is just a number or number with 'k' (like "3k" or "2500"), interpret it as the budget in dollars
                   
                   If a user responds to a specific question with just a value:
                   - If they only mention a location: return just the location parameter and state if possible
                   - If they only provide a number of bedrooms: return just the bedrooms parameter
                   - If they only provide a budget: return just the budget parameter
                   - If they only provide a ZIP code: return just the zipcode parameter
                   
                   Always correctly identify which parameters are missing and include them in the missingParameters array.
                   NEVER make assumptions about parameters that aren't explicitly mentioned by the user, EXCEPT for state and zipcode which should be inferred when possible.
                   
                   CRITICAL: For any parameter that is missing (listed in missingParameters), DO NOT provide a default value - 
                   leave that parameter completely undefined in the response. Only include parameters that were explicitly mentioned by the user or can be reliably inferred (state and zipcode).`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Debug log for zipcode
    console.log(`OpenAI extracted zipcode: ${result.zipcode}`);
    
    // Ensure we don't return default values for missing parameters
    const missingParams = result.missingParameters || [];
    const output: {
      location?: string;
      state?: string;
      zipcode?: string;
      bedrooms?: number;
      budget?: number;
      missingParameters?: string[];
      isGreeting?: boolean;
    } = {
      missingParameters: missingParams,
      isGreeting: result.isGreeting
    };
    
    // Only include parameters that aren't missing
    if (!missingParams.includes('location') && result.location) {
      output.location = result.location;
    }
    
    if (!missingParams.includes('state') && result.state) {
      output.state = result.state;
    }
    
    // For zipcode, we always include it if provided by the model, even if inferred
    if (result.zipcode) {
      output.zipcode = result.zipcode;
      console.log(`Setting output zipcode: ${result.zipcode}`);
    }
    
    if (!missingParams.includes('bedrooms') && result.bedrooms !== undefined) {
      output.bedrooms = result.bedrooms;
    }
    
    if (!missingParams.includes('budget') && result.budget !== undefined) {
      output.budget = result.budget;
    }
    
    return output;
  } catch (error) {
    console.error('Error extracting search parameters:', error);
    throw error;
  }
}

// Function to generate AI responses during the conversation
export async function generateAIResponse(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>): Promise<string> { 
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful apartment-finding assistant named JetRent AI. 
                   Help users find apartments based on their criteria.
                   
                   You need three pieces of information to perform a search:
                   1. LOCATION: Where the user wants to live (city, neighborhood, etc.)
                   2. BEDROOMS: How many bedrooms they need (or if they want a studio)
                   3. BUDGET: Maximum monthly rent they can afford
                   
                   IMPORTANT CONVERSATION RULES:
                   - If the user just says "hi" or offers a greeting, respond with a friendly greeting and ask
                     what kind of apartment they're looking for. DO NOT assume they want any specific type of apartment.
                   - If any information is missing, ask for it in a friendly, conversational way.
                   - Once you have all the information, present search results clearly.
                   
                   Be helpful and enthusiastic. Make apartment hunting feel easy and enjoyable.
                   Use emoji occasionally to keep the conversation friendly. 🏙️ 🏢 🔑`
        },
        ...messages
      ],
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
} 