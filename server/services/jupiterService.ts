import { Connection, PublicKey } from '@solana/web3.js';

const JUPITER_API_URL = 'https://aurumai-production.up.railway.app/api/swap';

export class JupiterService {
  // Get a swap order from Jupiter
  static async getSwapOrder(
    inputMint: string,
    outputMint: string,
    amount: number,
    taker?: string
  ) {
    try {
      const body: any = {
        inputMint,
        outputMint,
        amount,
      };
      if (taker) {
        body.taker = taker;
      }
      console.log('Jupiter service swap order body:',body);
      const response = await fetch(`${JUPITER_API_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JupiterService getSwapOrder error:', response.status, response.statusText, errorText);
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('JupiterService getSwapOrder caught exception:', error.message, error);
      if (error.message.startsWith('Server error:')) {
        throw error;
      }
      throw new Error(`Failed to get swap order due to: ${error.message || error}`);
    }
  }

  // Execute a swap order
  static async executeSwapOrder(
    signedTransaction: string,
    requestId: string
  ) {
    try {
      const response = await fetch(`${JUPITER_API_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedTransaction,
          requestId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JupiterService executeSwapOrder error:', response.status, response.statusText, errorText);
        throw new Error(`Server error on execute: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('JupiterService executeSwapOrder caught exception:', error.message, error);
      if (error.message.startsWith('Server error on execute:')) {
        throw error;
      }
      throw new Error(`Failed to execute swap due to: ${error.message || error}`);
    }
  }

  // Get available tokens for swapping (specific to a wallet)
  static async getAvailableTokens(walletAddress: string) {
    try {
      // Construct the specific URL directly
      const ASSET_API_URL = `https://aurumai-production.up.railway.app/api/wallet/${walletAddress}/assets`;
      const response = await fetch(ASSET_API_URL);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JupiterService getAvailableTokens error:', response.status, response.statusText, errorText);
        throw new Error(`Server error on tokens: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('JupiterService getAvailableTokens caught exception:', error.message, error);
      if (error.message.startsWith('Server error on tokens:')) {
        throw error;
      }
      throw new Error(`Failed to get available tokens due to: ${error.message || error}`);
    }
  }

  // Get token balances for an account
  static async getTokenBalances(walletAddress: string) {
    try {
      const response = await fetch(
        `${JUPITER_API_URL}/balances?wallet=${walletAddress}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JupiterService getTokenBalances error:', response.status, response.statusText, errorText);
        throw new Error(`Server error on balances: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('JupiterService getTokenBalances caught exception:', error.message, error);
      if (error.message.startsWith('Server error on balances:')) {
        throw error;
      }
      throw new Error(`Failed to get token balances due to: ${error.message || error}`);
    }
  }
}