# Neptune - Your Smart Crypto Sidekick

Neptune is a next-generation smart wallet designed to simplify your crypto journey. We address the common frustrations of confusing interfaces, fragmented experiences, and the fear of costly mistakes by providing an intuitive, AI-powered assistant.

## Features

*   **Conversational Interface:** Interact with your wallet like you're talking to a friend. Get insights and perform actions using natural language.
*   **Proactive Suggestions:** Neptune learns your trading, swapping, and staking habits to offer timely and relevant suggestions, helping you optimize your crypto activities.
*   **Enhanced Security:**
    *   **Sketchy Transaction Warnings:** Receive alerts for potentially suspicious transactions, adding an extra layer of protection.
    *   **Key Security:** Smart wallet functionality without compromising the security and self-custody of your keys.
*   **Simplified Asset Management:**
    *   Easily understand tokens and chains.
    *   Track assets across different wallets seamlessly.
    *   Swap and claim tokens with ease.
*   **AutoPilot Mode:** Choose your investment style (e.g., Degen, Chill, Safe), and let Neptune guide your crypto flow.
*   **AI-Powered Insights:** Understand your past activity and plan future moves with AI-driven analysis and suggestions.

## Addressing Key Crypto Challenges

*   **User Experience:** We transform complex crypto operations into simple, powerful actions, balancing ease-of-use with full control.
*   **AI Trust & Control:** Our AI provides explainable suggestions and automations, ensuring you remain in control of your funds.
*   **Integration Simplicity:** We handle the complexities of fragmented APIs, SDKs, and diverse blockchain node behaviors, so you don't have to.

## Coming Soon

*   **Copilot Chat:** Deeper conversational AI capabilities.
*   **DeFi Rituals:** Automate your common DeFi interactions.
*   **Guild Mode:** Collaborative features for squads and groups.

This isn't just a wallet. It's your crypto sidekick — finally.

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
   yarn install
   ```

3. Configure environment variables:
   - Copy `.env.local.example` to `.env.local` in root and `.env.example` to `.env` in server directories
   - Fill in the required API keys and configuration
   - Copy `app.example.json` to `app.json` and update with your app's information

4. Start the server:
   ```
   cd server
   yarn dev
   ```

5. Run the app on iOS (Client):
   ```
   npx expo run:ios
   ```

**Note:** This app cannot be run with Expo Go as some polyfills used in the project are not compatible with Expo Go. You must use the development build with `npx expo run:ios` or `npx expo run:android`.

## Environment Variables

The following environment variables are required:

- `OPENAI_API_KEY`: Your OpenAI API key for AI functionality
- `MONGODB_URI`: MongoDB connection string (local by default)
- `HELIUS_STAKED_URL`: Helius RPC URL with API key (Not necessarry staked)
- `PORT`: Server port (default: 3001)

## Project Structure

- `src/`: React Native app source code
  - `screens/`: App screens
  - `components/`: Reusable components
  - `hooks/`: Custom React hooks
  - `walletProviders/`: Privy Embedded wallet integration
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

