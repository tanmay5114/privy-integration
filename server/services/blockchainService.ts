import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import dotenv from 'dotenv';
import { TokenMetadataService } from './tokenMetadataService';

dotenv.config();

const RPC_URL = process.env.RPC_URL;
const JUPITER_API_URL_GET_ORDER = process.env.JUPITER_API_URL_GET_ORDER;
const JUPITER_API_URL_EXECUTE = process.env.JUPITER_API_URL_EXECUTE_ORDER;
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
      const { blockhash } = await connection.getLatestBlockhash('confirmed');

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
          },
          recentBlockhash: blockhash,
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
          },
          recentBlockhash: blockhash,
        };
      }
    } catch (error) {
      throw new Error(`Failed to get transfer instructions: ${error}`);
    }
  }

  // Submit a signed transaction
  static async submitSignedTransaction(signedTransaction: string) {
    try {
      // const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64')); // Old: Deserialize
      // const signature = await connection.sendRawTransaction(transaction.serialize());   // Old: Re-serialize and send
      
      // New: Send the raw wire transaction received from the client directly
      const wireTransaction = Buffer.from(signedTransaction, 'base64');
      const signature = await connection.sendRawTransaction(wireTransaction, {
        skipPreflight: true, // Can be useful if preflight is causing issues with an already signed tx
      });

      await connection.confirmTransaction(signature);
      
      console.log(`Transaction submitted successfully. Signature: ${signature}`);

      return {
        signature,
        status: 'success',
        message: 'Transaction confirmed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to submit transaction: ${error}`);
    }
  }

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
  static async getTopTokens(sortBy?: string, limit: number = 100) {
    try {
      if (!BIRDEYE_API_KEY) {
        throw new Error('BIRDEYE_API_KEY is not defined in environment variables');
      }

      // Initialize params with limit, as it has a default
      const queryParams: Record<string, string> = {
        limit: limit.toString(),
      };

      // Only add sort_by if it's provided
      if (sortBy) {
        queryParams.sort_by = sortBy;
      }
      
      const params = new URLSearchParams(queryParams);

      const correctTrendingTokensApiBase = 'https://public-api.birdeye.so';
      const fullUrl = `${correctTrendingTokensApiBase}/defi/token_trending?${params.toString()}`;
      console.log('[BlockchainService.getTopTokens] Requesting GET from Birdeye API:', fullUrl);

      const response = await fetchWithRetry(
        fullUrl,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': BIRDEYE_API_KEY,
            // Birdeye API for trending tokens might not require x-chain, 
            // but if it does for filtering by chain, it would be added here.
            // 'x-chain': 'solana' 
          }
        }
      );

      if (!response.ok) {
        const responseBodyText = await response.text();
        console.error('[BlockchainService.getTopTokens] Birdeye API error response details:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          body: responseBodyText,
        });
        let errorData;
        try {
            errorData = JSON.parse(responseBodyText);
        } catch (e) {
            errorData = { message: `Failed to parse error response from Birdeye: ${responseBodyText}` };
        }
        throw new Error(
          `Failed to get top tokens from Birdeye API: ${response.statusText} (${response.status})${
            errorData ? ` - ${errorData.message || JSON.stringify(errorData)}` : ''
          }`
        );
      }

      const data = await response.json();
      console.log('[BlockchainService.getTopTokens] Successfully received data from Birdeye API:', data);

      if (!data || !data.success || !data.data || !Array.isArray(data.data.tokens)) {
        console.error('[BlockchainService.getTopTokens] Invalid or incomplete data from Birdeye API:', data);
        throw new Error('Invalid or incomplete data received from Birdeye API for top tokens.');
      }

      // Assuming the API returns a list of tokens directly in data.tokens
      // Adjust the mapping if the structure is different
      return data.data.tokens.map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        logoURI: token.logoURI,
        // Add other relevant fields from the Birdeye response
        // e.g., volume, priceChange, marketCap, etc.
        volume: token.extensions?.v24hUSD, // Example, adjust based on actual API response structure
        price: token.price,
        priceChange24h: token.extensions?.priceChange24hPercent, // Example
      }));

    } catch (error) {
      console.error('[BlockchainService.getTopTokens] Error:', error);
      if (error instanceof Error && error.message.startsWith('Failed to get top tokens from Birdeye API')) {
        throw error;
      }
      throw new Error(`Failed to process getTopTokens in BlockchainService: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get newly listed tokens using Birdeye API
  static async getNewListings(limit: number = 50, chain: string = 'solana') {
    try {
      if (!BIRDEYE_API_KEY) {
        throw new Error('BIRDEYE_API_KEY is not defined in environment variables');
      }

      const queryParams: Record<string, string> = {
        limit: limit.toString(),
        // The new_listing endpoint might support other params like sort_by or offset
        // but they are not detailed in the provided doc snippet.
        // For now, only limit is explicitly handled as a query param.
      };

      const params = new URLSearchParams(queryParams);
      const correctNewListingsApiBase = 'https://public-api.birdeye.so'; // Base URL for this specific endpoint
      const fullUrl = `${correctNewListingsApiBase}/defi/v2/tokens/new_listing?${params.toString()}`;

      console.log('[BlockchainService.getNewListings] Requesting GET from Birdeye API:', fullUrl);

      const headers: Record<string, string> = {
        'accept': 'application/json',
        'x-api-key': BIRDEYE_API_KEY,
      };

      if (chain) {
        headers['x-chain'] = chain;
      }

      const response = await fetchWithRetry(
        fullUrl,
        {
          method: 'GET',
          headers: headers,
        }
      );

      if (!response.ok) {
        const responseBodyText = await response.text();
        console.error('[BlockchainService.getNewListings] Birdeye API error response details:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          body: responseBodyText,
        });
        let errorData;
        try {
            errorData = JSON.parse(responseBodyText);
        } catch (e) {
            errorData = { message: `Failed to parse error response from Birdeye: ${responseBodyText}` };
        }
        throw new Error(
          `Failed to get new listings from Birdeye API: ${response.statusText} (${response.status})${
            errorData ? ` - ${errorData.message || JSON.stringify(errorData)}` : ''
          }`
        );
      }

      const data = await response.json();
      console.log('[BlockchainService.getNewListings] Successfully received data from Birdeye API:', data);

      if (!data || !data.success || !data.data || !Array.isArray(data.data.items)) {
        console.error('[BlockchainService.getNewListings] Invalid or incomplete data from Birdeye API:', data);
        throw new Error('Invalid or incomplete data received from Birdeye API for new listings.');
      }

      // Assuming the API returns a list of tokens directly in data.data.items
      // Adjust the mapping if the structure is different based on actual API response
      return data.data.items.map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        logoURI: token.logoURI,
        listedAt: token.listedAt, // Example, check actual response for timestamp field
        chain: token.chain || chain, // If per-token chain info is not present, use the requested chain
        // Add other relevant fields from the Birdeye response
      }));

    } catch (error) {
      console.error('[BlockchainService.getNewListings] Error:', error);
      if (error instanceof Error && error.message.startsWith('Failed to get new listings from Birdeye API')) {
        throw error;
      }
      throw new Error(`Failed to process getNewListings in BlockchainService: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get detailed information for a specific token using Birdeye API token_overview
  static async getTokenGeneralDetails(mintAddress: string) {
    try {
      if (!BIRDEYE_API_KEY) {
        throw new Error('BIRDEYE_API_KEY is not defined in environment variables');
      }

      try {
        new PublicKey(mintAddress); // Validate Solana mint address format
      } catch (e) {
        throw new Error('Invalid mint address format provided.');
      }

      const overviewApiBase = 'https://public-api.birdeye.so';
      // Query parameters for token_overview, assuming 'address' is the key for the token mint
      const params = new URLSearchParams({ address: mintAddress });
      const fullUrl = `${overviewApiBase}/defi/token_overview?${params.toString()}`;

      console.log('[BlockchainService.getTokenGeneralDetails] Requesting GET from Birdeye token_overview API:', fullUrl);

      const response = await fetchWithRetry(
        fullUrl,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': BIRDEYE_API_KEY,
            'x-chain': 'solana' // Specify solana, though it might default if this header isn't strictly needed for this endpoint
          }
        }
      );

      if (!response.ok) {
        const responseBodyText = await response.text();
        console.error('[BlockchainService.getTokenGeneralDetails] Birdeye token_overview API error:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          body: responseBodyText,
        });
        let errorData;
        try {
            errorData = JSON.parse(responseBodyText);
        } catch (e) {
            errorData = { message: `Failed to parse error response: ${responseBodyText}` };
        }
        throw new Error(
          `Failed to get token overview from Birdeye (status ${response.status}): ${errorData?.message || response.statusText}`
        );
      }

      const overviewResult = await response.json();
      console.log('[BlockchainService.getTokenGeneralDetails] Birdeye token_overview API Response:', JSON.stringify(overviewResult, null, 2));

      if (!overviewResult || !overviewResult.success || !overviewResult.data) {
        console.error('[BlockchainService.getTokenGeneralDetails] Invalid or incomplete data from Birdeye token_overview API. Expected .data object. Received:', overviewResult);
        throw new Error('Invalid or incomplete data from Birdeye token_overview API. Expected .data object.');
      }

      const tokenData = overviewResult.data; // Assuming the token data is directly in overviewResult.data
      const extensions = tokenData.extensions || {}; // Socials and other info often in extensions

      // Mapping fields based on common Birdeye structures and desired output
      // Some fields like circulating supply might not be directly available or under different names.
      return {
        mintAddress: tokenData.address || mintAddress, // Ensure we return the queried address
        name: tokenData.name,
        symbol: tokenData.symbol,
        logoURI: tokenData.logoURI,
        price: tokenData.price,
        marketCap: tokenData.mc, // Market Cap
        volume24h: tokenData.v24hUSD || tokenData.volume24h, // 24h Volume in USD
        twitter: extensions.twitter, // Twitter handle from extensions
        website: extensions.website, // Website URL from extensions
        telegram: extensions.telegram, // Often in extensions
        description: extensions.description, // Often in extensions
        totalSupply: tokenData.supply || tokenData.totalSupply, // Total Supply
        circulatingSupply: tokenData.circulatingSupply || extensions.circulatingSupply, // Circulating Supply (often estimated or less common)
        // Add other fields if the token_overview endpoint provides them directly or in extensions
      };

    } catch (error) {
      console.error(`[BlockchainService.getTokenGeneralDetails] Error processing token ${mintAddress} with token_overview:`, error);
      if (error instanceof Error && (error.message.startsWith('Failed to get token overview') || error.message.startsWith('Invalid mint address') || error.message.startsWith('BIRDEYE_API_KEY'))) {
        throw error;
      }
      throw new Error(`Failed to process getTokenGeneralDetails for ${mintAddress} using token_overview: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}