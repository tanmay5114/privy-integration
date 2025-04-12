# Privy SAK (Solana Agent Kit) Chat App

A React Native app for interacting with Solana blockchain through an AI assistant.

## Features

- AI-powered chat interface for Solana blockchain interactions
- MongoDB database integration for chat persistence
- File upload capabilities for attachments
- Privy wallet integration for Solana transactions
- OpenAI integration for AI responses

## Quick Start

### 1. Start the Server

```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Install server dependencies
cd server
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your MongoDB URI and OpenAI API key
# Then start the server
npm run dev
```

### 2. Start the React Native App

```bash
# In a new terminal, navigate to the project root
cd <repository-directory>

# Install app dependencies
npm install

# Create .env file for the client
# Make sure to set the SERVER_URL to your server's URL (e.g., http://localhost:3001)
# and add your OPENAI_API_KEY

# Start the app
npx expo start
```

## Server Setup Details

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials:
   - MongoDB connection string
   - OpenAI API key
   - Solana RPC URL

5. Start the development server:
   ```
   npm run dev
   ```

## React Native App Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Update the `.env` file with your configuration:
   ```
   # Server Configuration
   SERVER_URL=http://localhost:3001

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Solana
   HELIUS_STAKED_URL=your_helius_staked_url
   ```

3. Start the development server:
   ```
   npx expo start
   ```

## Project Structure

- `server/`: Backend Node.js server
  - `models/`: MongoDB models (Chat, Message, User)
  - `controllers/`: API controllers for chat, messages, files, users
  - `routes/`: API routes definitions
  - `db/`: Database connection utilities
  - `middleware/`: Authentication middleware

- `src/`: React Native app
  - `hooks/`: Custom React hooks (useChat)
  - `lib/`: Utility functions
  - `screens/`: App screens (ChatScreen, ChatHistoryScreen)
  - `components/`: Reusable components (ErrorHandler)
  - `assets/`: Images, colors, etc.
  - `walletProviders/`: Wallet integration

## API Endpoints

### Users

- `POST /api/user` - Create or update a user
- `GET /api/user/:walletAddress` - Get user by wallet address
- `GET /api/me` - Get current user

### Chats

- `GET /api/chat/:id` - Get a chat by ID
- `GET /api/chats` - Get chats by user ID (with pagination)
- `POST /api/chat` - Create or update a chat
- `DELETE /api/chat/:id` - Delete a chat

### Messages

- `GET /api/messages/:chatId` - Get messages by chat ID
- `GET /api/message/:id` - Get a message by ID
- `POST /api/messages` - Save messages
- `DELETE /api/messages/:chatId/after` - Delete messages after a timestamp

### Files

- `POST /api/files/upload` - Upload a file

## Authentication

The app uses wallet-based authentication. Include the `x-wallet-address` header with API requests.

## Troubleshooting

If you encounter a "Maximum update depth exceeded" error:
1. Make sure your useEffect dependencies are properly set
2. Avoid setting state in useEffect without proper dependency management
3. Check for circular dependencies in your component logic

If you encounter "Error fetching messages":
1. Ensure the server is running
2. Check that your wallet is connected
3. Verify the SERVER_URL in your .env file is correct
4. Check the server logs for more details

## Technologies Used

- React Native / Expo
- Node.js / Express
- MongoDB / Mongoose
- OpenAI API
- Solana Web3.js
- Privy SDK for wallet integration
