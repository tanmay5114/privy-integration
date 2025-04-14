# Privy Solana App Kit - React Native

A mobile chat application that enables interaction with Solana blockchain through natural language conversation. Built with React Native, Expo, and integrated with AI for Solana transaction capabilities.

## Features

- Embedded wallet authentication with Privy (Google, Apple, Email)
- Chat interface for natural language interaction with Solana blockchain
- Solana transaction capabilities through AI assistant
- Chat history management
- User profile management

## Prerequisites

- Node.js (v16+)
- MongoDB
- OpenAI API Key
- Helius API Key (for Solana RPC access)

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/privy-sak-react-native.git
   cd privy-sak-react-native
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in both root and server directories
   - Fill in the required API keys and configuration

4. Start the server:
   ```
   cd server
   npm run dev
   ```

5. Start the React Native app:
   ```
   npm run start
   ```

6. Use Expo Go app to scan the QR code and run the app on your device

## Environment Variables

The following environment variables are required:

- `OPENAI_API_KEY`: Your OpenAI API key for AI functionality
- `MONGODB_URI`: MongoDB connection string
- `HELIUS_STAKED_URL`: Helius RPC URL with API key
- `PORT`: Server port (default: 3001)

## Project Structure

- `src/`: React Native app source code
  - `screens/`: App screens
  - `components/`: Reusable components
  - `hooks/`: Custom React hooks
  - `walletProviders/`: Wallet integration
  - `navigation/`: Navigation setup
  - `assets/`: Images, colors, icons
  - `lib/`: Utility functions and API interactions
  - `state/`: Redux state management

- `server/`: Backend API
  - `controllers/`: API endpoint controllers
  - `models/`: MongoDB models
  - `routes/`: API routes
  - `middleware/`: Custom middleware
  - `db/`: Database connection

## License

This project is licensed under the MIT License - see the LICENSE file for details.
