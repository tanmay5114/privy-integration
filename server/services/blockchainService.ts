import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import dotenv from 'dotenv';
import { TokenMetadataService } from './tokenMetadataService';

dotenv.config();

const RPC_URL = process.env.RPC_URL;
const JUPITER_API_URL_GET_ORDER = process.env.JUPITER_API_URL_GET_ORDER;
const JUPITER_API_URL_EXECUTE = process.env.JUPITER_API_URL_EXECUTE;
const COINGECKO_API_URL = process.env.COINGECKO_API_URL;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const BIRDEYE_API_URL = process.env.BIRDEYE_API_URL || 'https://public-api.birdeye.so/v1';
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

interface BirdeyeTokenItem {
  address: string;
  decimals: number;
  balance: number;
  uiAmount: number;
  chainId: string;
  name: string;
  symbol: string;
  logoURI?: string;
  icon?: string;
  priceUsd: number;
  valueUsd: number;
}

interface BirdeyeResponse {
  success: boolean;
  data: {
    wallet: string;
    totalUsd: number;
    items: BirdeyeTokenItem[];
  };
}

if (!RPC_URL) {
  throw new Error('RPC_URL is not defined in environment variables');
}


const connection = new Connection(RPC_URL);

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle retries with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // If we get a 429, retry with exponential backoff
    if (response.status === 429 && retries > 0) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
      console.log(`Rate limited by Birdeye API. Retrying in ${delay}ms... (${retries} retries left)`);
      await wait(delay);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
      console.log(`Request failed. Retrying in ${delay}ms... (${retries} retries left)`);
      await wait(delay);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export class BlockchainService {
  // Get all assets (tokens) for a wallet
  static async getWalletAssets(walletAddress: string) {
    try {
      const pubKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(pubKey);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token program ID
      });

      // Get metadata for all tokens
      const tokenMints = tokenAccounts.value.map(account => account.account.data.parsed.info.mint);
      const tokenMetadata = await TokenMetadataService.getMultipleTokenMetadata(tokenMints);

      // Create a map of mint address to metadata for easy lookup
      const metadataMap = new Map(tokenMetadata.map(meta => [meta.mint, meta]));

      return {
        nativeBalance: balance / LAMPORTS_PER_SOL,
        tokens: tokenAccounts.value.map(account => {
          const mint = account.account.data.parsed.info.mint;
          const metadata = metadataMap.get(mint) || {
            name: 'Unknown Token',
            symbol: 'UNKNOWN',
            image: null
          };
          
          return {
            mint,
            amount: account.account.data.parsed.info.tokenAmount.uiAmount,
            decimals: account.account.data.parsed.info.tokenAmount.decimals,
            name: metadata.name,
            symbol: metadata.symbol,
            image: metadata.image
          };
        })
      };
    } catch (error) {
      throw new Error(`Failed to fetch wallet assets: ${error}`);
    }
  }

  // Get specific asset details
  static async getAssetDetails(walletAddress: string, tokenMint: string) {
    try {
      const pubKey = new PublicKey(walletAddress);
      
      if (tokenMint.toLowerCase() === 'native') {
        const balance = await connection.getBalance(pubKey);
        return {
          type: 'native',
          balance: balance / LAMPORTS_PER_SOL,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
        };
      }

      const tokenMintPubKey = new PublicKey(tokenMint);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
        mint: tokenMintPubKey,
      });

      if (tokenAccounts.value.length === 0) {
        throw new Error('Token account not found');
      }

      const tokenAccount = tokenAccounts.value[0];
      const metadata = await TokenMetadataService.getTokenMetadata(tokenMint);

      return {
        type: 'token',
        mint: tokenMint,
        balance: tokenAccount.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: tokenAccount.account.data.parsed.info.tokenAmount.decimals,
        name: metadata.name,
        symbol: metadata.symbol,
        image: metadata.image
      };
    } catch (error) {
      throw new Error(`Failed to fetch asset details: ${error}`);
    }
  }

  // Sync wallet balances
  static async syncWalletBalances(walletAddress: string) {
    try {
      const pubKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(pubKey);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      return {
        nativeBalance: balance / LAMPORTS_PER_SOL,
        tokenBalances: tokenAccounts.value.map(account => ({
          mint: account.account.data.parsed.info.mint,
          amount: account.account.data.parsed.info.tokenAmount.uiAmount,
        })),
        lastSynced: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to sync wallet balances: ${error}`);
    }
  }

  // Get wallet transactions
  static async getWalletTransactions(walletAddress: string) {
    try {
      const pubKey = new PublicKey(walletAddress);
      const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 100 });
      
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });
          return {
            signature: sig.signature,
            timestamp: sig.blockTime,
            ...tx
          };
        })
      );

      return transactions;
    } catch (error) {
      throw new Error(`Failed to fetch wallet transactions: ${error}`);
    }
  }

  // Get specific transaction details
  static async getTransactionDetails(signature: string) {
    try {
      const tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      
      if (!tx) {
        throw new Error('Transaction not found');
      }

      return tx;
    } catch (error) {
      throw new Error(`Failed to fetch transaction details: ${error}`);
    }
  }

  // Sync recent transactions
  static async syncRecentTransactions(walletAddress: string) {
    try {
      const transactions = await this.getWalletTransactions(walletAddress);
      // TODO: Store transactions in your database
      return {
        syncedTransactions: transactions.length,
        lastSynced: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to sync transactions: ${error}`);
    }
  }

  // Get transfer instructions for client-side signing
  static async getTransferInstructions(
    fromAddress: string,
    toAddress: string,
    amount: number,
    tokenMint?: string
  ) {
    try {
      const fromPubKey = new PublicKey(fromAddress);
      const toPubKey = new PublicKey(toAddress);

      if (tokenMint) {
        // Token transfer logic
        const tokenMintPubKey = new PublicKey(tokenMint);
        
        // Get source token account
        const fromTokenAccounts = await connection.getParsedTokenAccountsByOwner(fromPubKey, {
          mint: tokenMintPubKey,
        });

        if (fromTokenAccounts.value.length === 0) {
          throw new Error('Source token account not found');
        }

        const fromTokenAccount = fromTokenAccounts.value[0].pubkey;

        // Get or create associated token account for recipient
        const toTokenAccount = await getAssociatedTokenAddress(
          tokenMintPubKey,
          toPubKey
        );

        // Check if the associated token account exists
        const toTokenAccountInfo = await connection.getParsedTokenAccountsByOwner(toPubKey, {
          mint: tokenMintPubKey,
        });

        const instructions = [];

        // If token account doesn't exist, add instruction to create it
        if (toTokenAccountInfo.value.length === 0) {
          instructions.push(
            createAssociatedTokenAccountInstruction(
              fromPubKey, // payer
              toTokenAccount, // associated token account
              toPubKey, // owner
              tokenMintPubKey // mint
            )
          );
        }

        // Add transfer instruction
        const decimals = fromTokenAccounts.value[0].account.data.parsed.info.tokenAmount.decimals;
        const transferAmount = amount * Math.pow(10, decimals);

        instructions.push(
          createTransferInstruction(
            fromTokenAccount, // source
            toTokenAccount, // destination
            fromPubKey, // owner of source account
            BigInt(transferAmount) // amount
          )
        );

        return {
          instructions,
          accounts: {
            fromTokenAccount: fromTokenAccount.toBase58(),
            toTokenAccount: toTokenAccount.toBase58(),
            tokenMint: tokenMintPubKey.toBase58()
          }
        };

      } else {
        // Native SOL transfer
        const instruction = SystemProgram.transfer({
          fromPubkey: fromPubKey,
          toPubkey: toPubKey,
          lamports: amount * LAMPORTS_PER_SOL,
        });

        return {
          instructions: [instruction],
          accounts: {
            fromAddress: fromPubKey.toBase58(),
            toAddress: toPubKey.toBase58()
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to get transfer instructions: ${error}`);
    }
  }

  // Submit a signed transaction
  static async submitSignedTransaction(signedTransaction: string) {
    try {
      const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64'));
      const signature = await connection.sendRawTransaction(transaction.serialize());
      await connection.confirmTransaction(signature);
      
      return {
        signature,
        status: 'success',
        message: 'Transaction confirmed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to submit transaction: ${error}`);
    }
  }

  // Get a swap order from Jupiter
  static async getSwapOrder(
    inputMint: string,
    outputMint: string,
    amount: string | number,
    taker?: string
  ) {
    try {
      if (!JUPITER_API_URL_GET_ORDER) {
        throw new Error('JUPITER_API_URL_GET_ORDER is not defined in environment variables');
      }

      // Validate input parameters
      if (!inputMint || !outputMint || amount === undefined) {
        throw new Error('inputMint, outputMint, and amount are required');
      }

      // Ensure amount is a valid number and convert to string
      const amountStr = amount.toString();
      if (isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
        throw new Error('amount must be a positive number');
      }

      // Validate mint addresses format
      try {
        new PublicKey(inputMint);
        new PublicKey(outputMint);
      } catch (e) {
        throw new Error('Invalid mint address format');
      }

      // Validate taker address if provided
      if (taker) {
        try {
          new PublicKey(taker);
        } catch (e) {
          throw new Error('Invalid taker address format');
        }
      }

      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amountStr,
        ...(taker && { taker })
      });

      console.log('Requesting swap order with params:', {
        inputMint,
        outputMint,
        amount: amountStr,
        taker
      });

      const response = await fetch(
        `${JUPITER_API_URL_GET_ORDER}?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Jupiter API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(
          `Failed to get swap order: ${response.statusText}${
            errorData ? ` - ${JSON.stringify(errorData)}` : ''
          }`
        );
      }

      const data = await response.json();
      
      if (!data || !data.requestId) {
        console.error('Invalid Jupiter API response:', data);
        throw new Error('Invalid response from Jupiter API');
      }

      return data;
    } catch (error) {
      console.error('Jupiter swap order error:', error);
      throw new Error(`Failed to get swap order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Execute a swap order
  static async executeSwapOrder(
    signedTransaction: string,
    requestId: string
  ) {
    try {
      const response = await fetch(`${JUPITER_API_URL_EXECUTE}`, {
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

  // Get live token prices for a list of token mints
  static async getTokenPrices(tokenMints: string[]) {
    try {
      // Get token metadata to map mints to coingecko IDs
      const tokenMetadata = await TokenMetadataService.getMultipleTokenMetadata(tokenMints);
      
      // Create a map of mint addresses to coingecko IDs
      const mintToCoingeckoId = new Map(
        tokenMetadata
          .filter(meta => meta.coingeckoId) // Only include tokens with coingecko IDs
          .map(meta => [meta.mint, meta.coingeckoId])
      );

      // Get unique coingecko IDs
      const coingeckoIds = Array.from(new Set(mintToCoingeckoId.values()));

      if (coingeckoIds.length === 0) {
        return new Map(); // Return empty map if no valid coingecko IDs
      }

      // Fetch prices from CoinGecko
      const response = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=${coingeckoIds.join(',')}&vs_currencies=usd`,
        {
          headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : {}
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prices from CoinGecko: ${response.statusText}`);
      }

      const priceData = await response.json();

      // Create a map of mint addresses to prices
      const mintToPrice = new Map();
      
      for (const [mint, coingeckoId] of mintToCoingeckoId.entries()) {
        if (coingeckoId && priceData[coingeckoId]?.usd) {
          mintToPrice.set(mint, priceData[coingeckoId].usd);
        }
      }

      return mintToPrice;
    } catch (error) {
      throw new Error(`Failed to fetch token prices: ${error}`);
    }
  }

  // Get wallet assets with live prices using Birdeye API
  static async getWalletAssetsWithPrices(walletAddress: string) {
    try {
      if (!BIRDEYE_API_KEY) {
        throw new Error('BIRDEYE_API_KEY is not defined in environment variables');
      }

      const response = await fetchWithRetry(
        `${BIRDEYE_API_URL}/wallet/token_list?wallet=${walletAddress}`,
        {
          headers: {
            'accept': 'application/json',
            'x-api-key': BIRDEYE_API_KEY,
            'x-chain': 'solana'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet assets from Birdeye: ${response.statusText}`);
      }

      const data = await response.json() as BirdeyeResponse;

      if (!data.success) {
        throw new Error('Failed to fetch wallet assets from Birdeye: API returned unsuccessful response');
      }

      // Transform the response to match the existing format
      const nativeToken = data.data.items.find(
        (item: BirdeyeTokenItem) => item.address === 'So11111111111111111111111111111111111111111'
      );

      const tokens = data.data.items
        .filter((item: BirdeyeTokenItem) => item.address !== 'So11111111111111111111111111111111111111111')
        .map((item: BirdeyeTokenItem) => ({
          mint: item.address,
          amount: item.uiAmount,
          decimals: item.decimals,
          name: item.name,
          symbol: item.symbol,
          image: item.logoURI || item.icon,
          price: item.priceUsd,
          value: item.valueUsd
        }));

      return {
        nativeBalance: {
          amount: nativeToken?.uiAmount || 0,
          price: nativeToken?.priceUsd || null,
          value: nativeToken?.valueUsd || null
        },
        tokens,
        totalValue: data.data.totalUsd
      };
    } catch (error) {
      throw new Error(`Failed to fetch wallet assets with prices: ${error}`);
    }
  }
} 