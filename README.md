# JetRent - AI Apartment Finder

JetRent is a Next.js application with a chat interface that enables users to interact with an AI agent to find apartments. The AI agent uses the ReAct (Reasoning + Acting) loop to process user queries, extract search parameters, and respond with structured results.

## Features

- **Chat Interface**: User-friendly chat UI for natural language queries
- **AI Agent with ReAct Loop**: Analysis of queries to determine if all required parameters are present
- **Parameter Extraction**: Extracting location, bedrooms, and budget from user queries
- **Mock Apartment Data**: Simulated apartment listings for demonstration purposes

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/jetrent.git
   cd jetrent
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Type a natural language query in the chat input, such as "I need a 2-bedroom apartment in Brooklyn for under $2500"
2. The AI will analyze your request and ask for any missing information (location, bedrooms, or budget)
3. Once all required information is provided, the AI will display apartment listings that match your criteria
4. You can then ask follow-up questions or modify your search criteria

## How It Works

The application implements a ReAct (Reasoning + Acting) loop:

1. **Reasoning**: The AI analyzes user queries to determine if all required parameters (location, bedrooms, budget) are present.
2. **Acting**:
   - If all parameters are present, the AI calls the `extractSearchParameters` function to parse the query into structured data
   - If any parameter is missing, the AI prompts the user to provide it

When all parameters are collected, the application uses mock data to simulate searching for apartments and displays the results to the user.

## Tech Stack

- Next.js
- React
- TypeScript
- OpenAI API
- Shadcn UI Components
- Tailwind CSS

## License

This project is licensed under the MIT License - see the LICENSE file for details.
