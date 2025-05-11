import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL;
const JUPITER_API_URL = 'https://lite-api.jup.ag/ultra/v1/order';

if (!RPC_URL) {
  throw new Error('RPC_URL is not defined in environment variables');
}

const connection = new Connection(RPC_URL);

export class JupiterService {
  // Get a swap order from Jupiter
  static async getSwapOrder(
    inputMint: string,
    outputMint: string,
    amount: string,
    taker?: string
  ) {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount,
        ...(taker && { taker })
      });

      const response = await fetch(
        `${JUPITER_API_URL}/order?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get swap order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get swap order: ${error}`);
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
        throw new Error(`Failed to execute swap: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to execute swap: ${error}`);
    }
  }

  // Get token balances for an account
  static async getTokenBalances(walletAddress: string) {
    try {
      const response = await fetch(
        `${JUPITER_API_URL}/balances?wallet=${walletAddress}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get token balances: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get token balances: ${error}`);
    }
  }
} 