import express, { Request, Response, RequestHandler } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { BlockchainService } from '../services/blockchainService';

const router = express.Router();
const prisma = new PrismaClient();

interface WalletAddressParams {
  address: string;
}

interface AssetParams extends WalletAddressParams {
  assetId: string;
}

interface TransactionParams extends WalletAddressParams {
  hash: string;
}

interface TransferBody {
  toAddress: string;
  amount: number;
  tokenMint?: string;
}

interface SubmitTransactionBody {
  signedTransaction: string;
}

interface SwapOrderBody {
  inputMint: string;
  outputMint: string;
  amount: string | number;
  taker?: string;
}

interface ExecuteSwapBody {
  signedTransaction: string;
  requestId: string;
}

interface TopTokenParams {
  sortBy?: string;
  limit?: string;
}

interface NewListingsParams {
  limit?: string;
  chain?: string;
}

interface TokenDetailsParams {
  mintAddress: string;
}

// Get all assets held in a wallet
const getWalletAssets: RequestHandler<WalletAddressParams> = async (req, res) => {
  try {
    const { address } = req.params;
    console.log('Received address:', address);

    if (!address) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }

    const blockchainAssets = await BlockchainService.getWalletAssets(address);

    res.status(200).json({
      address,
      assets: {
        nativeBalance: blockchainAssets.nativeBalance,
        tokens: blockchainAssets.tokens
      }
    });
  } catch (error) {
    console.error('Error in getWalletAssets:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch wallet assets' });
  }
};

// Get wallet assets with live prices
const getWalletAssetsWithPrices: RequestHandler<WalletAddressParams> = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }

    const assetsWithPrices = await BlockchainService.getWalletAssetsWithPrices(address);

    res.status(200).json({
      address,
      assets: assetsWithPrices,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getWalletAssetsWithPrices:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch wallet assets with prices' });
  }
};

// Get a specific asset's details
const getAssetDetails: RequestHandler<AssetParams> = async (req, res) => {
  try {
    const { address, assetId } = req.params;

    if (!address || !assetId) {
      res.status(400).json({ error: 'Wallet address and asset ID are required' });
      return;
    }

    const assetDetails = await BlockchainService.getAssetDetails(address, assetId);

    res.status(200).json({
      address,
      assetId,
      details: assetDetails
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch asset details' });
  }
};

// Trigger balance sync from chain
const syncWalletBalances: RequestHandler<WalletAddressParams> = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }

    const blockchainAssets = await BlockchainService.syncWalletBalances(address);

    res.status(200).json({
      address,
      message: 'Balances synced successfully',
      assets: blockchainAssets,
      lastSynced: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to sync balances' });
  }
};

// List all transactions for a wallet
const getWalletTransactions: RequestHandler<WalletAddressParams> = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }

    const transactions = await BlockchainService.getWalletTransactions(address);

    res.status(200).json({
      address,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch transactions' });
  }
};

// View a single transaction detail
const getTransactionDetails: RequestHandler<TransactionParams> = async (req, res) => {
  try {
    const { address, hash } = req.params;

    if (!address || !hash) {
      res.status(400).json({ error: 'Wallet address and transaction hash are required' });
      return;
    }

    const transaction = await BlockchainService.getTransactionDetails(hash);

    res.status(200).json({
      address,
      hash,
      transaction
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch transaction details' });
  }
};

// Fetch recent transactions from chain and store
const syncRecentTransactions: RequestHandler<WalletAddressParams> = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }

    const result = await BlockchainService.syncRecentTransactions(address);

    res.status(200).json({
      address,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to sync transactions' });
  }
};

// Get transfer instructions for client-side signing
const getTransferInstructions: RequestHandler<WalletAddressParams, any, TransferBody> = async (req, res) => {
  try {
    const { address } = req.params;
    const { toAddress, amount, tokenMint } = req.body;

    if (!address || !toAddress || !amount) {
      res.status(400).json({ error: 'Wallet address, destination address, and amount are required' });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    const result = await BlockchainService.getTransferInstructions(address, toAddress, amount, tokenMint);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get transfer instructions' });
  }
};

// Submit signed transaction
const submitTransaction: RequestHandler<{}, any, SubmitTransactionBody> = async (req, res) => {
  try {
    const { signedTransaction } = req.body;

    if (!signedTransaction) {
      res.status(400).json({ error: 'Signed transaction is required' });
      return;
    }

    const result = await BlockchainService.submitSignedTransaction(signedTransaction);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to submit transaction' });
  }
};

// Get a swap order from Jupiter
const getSwapOrder: RequestHandler<{}, any, SwapOrderBody> = async (req, res) => {
  try {
    const { inputMint, outputMint, amount, taker } = req.body;

    // Log the incoming request
    console.log('Swap order request:', {
      inputMint,
      outputMint,
      amount,
      taker
    });

    if (!inputMint || !outputMint || amount === undefined) {
      res.status(400).json({ 
        error: 'Input mint, output mint, and amount are required',
        received: { inputMint, outputMint, amount, taker }
      });
      return;
    }

    // Convert amount to string if it's a number
    const amountStr = typeof amount === 'number' ? amount.toString() : amount;

    const order = await BlockchainService.getSwapOrder(
      inputMint,
      outputMint,
      amountStr,
      taker
    );

    res.status(200).json({
      order,
      message: 'Swap order retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getSwapOrder:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get swap order',
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

// Execute a swap order
const executeSwap: RequestHandler<{}, any, ExecuteSwapBody> = async (req, res) => {
  try {
    const { signedTransaction, requestId } = req.body;

    if (!signedTransaction || !requestId) {
      res.status(400).json({ error: 'Signed transaction and request ID are required' });
      return;
    }

    const result = await BlockchainService.executeSwapOrder(signedTransaction, requestId);

    res.status(200).json({
      result,
      message: result.status === 'Success' ? 'Swap executed successfully' : 'Swap execution failed'
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to execute swap' });
  }
};

// Handler to get top tokens
const getTopTokens: RequestHandler<{}, any, any, TopTokenParams> = async (req, res) => {
  try {
    const sortBy = req.query.sortBy;
    const limitQuery = req.query.limit;
    let limit: number | undefined = undefined;

    if (limitQuery) {
      limit = parseInt(limitQuery);
      // Validate limit if provided
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ message: 'Invalid limit parameter. Must be a positive number.' });
      }
    }

    const topTokensData = await BlockchainService.getTopTokens(sortBy, limit);
    res.json(topTokensData);
  } catch (error) {
    console.error('[API Route /wallet/top-tokens] Error fetching top tokens:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message || 'Failed to fetch top tokens' });
    } else {
      res.status(500).json({ message: 'An unknown error occurred while fetching top tokens' });
    }
  }
};

// Handler to get new token listings
const getNewTokenListings: RequestHandler<{}, any, any, NewListingsParams> = async (req, res) => {
  try {
    const limitQuery = req.query.limit;
    const chainQuery = req.query.chain;

    let limit: number | undefined = undefined;
    if (limitQuery) {
      limit = parseInt(limitQuery);
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ message: 'Invalid limit parameter. Must be a positive number.' });
      }
    }

    // chainQuery can be passed directly as it's a string and optional in the service method
    const newListings = await BlockchainService.getNewListings(limit, chainQuery);
    res.json(newListings);
  } catch (error) {
    console.error('[API Route /new-listings] Error fetching new listings:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message || 'Failed to fetch new listings' });
    } else {
      res.status(500).json({ message: 'An unknown error occurred while fetching new listings' });
    }
  }
};

// Handler to get detailed information for a specific token
const getTokenDetails: RequestHandler<TokenDetailsParams> = async (req, res) => {
  try {
    const { mintAddress } = req.params;

    if (!mintAddress) {
      return res.status(400).json({ message: 'Mint address parameter is required.' });
    }

    const tokenDetails = await BlockchainService.getTokenGeneralDetails(mintAddress);
    res.status(200).json(tokenDetails);
  } catch (error) {
    console.error(`[API Route /token/:mintAddress/details] Error fetching token details for ${req.params.mintAddress}:`, error);
    if (error instanceof Error) {
      if (error.message.includes('Invalid mint address format')) {
        return res.status(400).json({ message: error.message });
      } else if (error.message.includes('Token with address') && error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      } else if (error.message.includes('BIRDEYE_API_KEY')) {
        return res.status(500).json({ message: 'Server configuration error related to API key.' });
      } else if (error.message.startsWith('Failed to get token details from Birdeye')) {
        // Catch specific Birdeye API failures from the service
        return res.status(502).json({ message: error.message }); // 502 Bad Gateway if Birdeye fails
      } else if (error.message.startsWith('Invalid or incomplete data structure')){
        return res.status(502).json({ message: "Failed to retrieve token details due to upstream data issue."});
      }
      // Generic internal server error for other cases from the service
      return res.status(500).json({ message: error.message || 'Failed to fetch token details' });
    } else {
      return res.status(500).json({ message: 'An unknown error occurred while fetching token details' });
    }
  }
};

// Register routes
router.get('/wallet/:address/assets', getWalletAssets);
router.get('/wallet/:address/assets/prices', getWalletAssetsWithPrices);
router.get('/wallet/:address/assets/:assetId', getAssetDetails);
router.post('/wallet/:address/assets/sync', syncWalletBalances);
router.get('/wallet/:address/transactions', getWalletTransactions);
router.get('/wallet/:address/transactions/:hash', getTransactionDetails);
router.post('/wallet/:address/transactions/sync', syncRecentTransactions);
router.post('/wallet/:address/transfer/instructions', getTransferInstructions);
router.post('/transaction/submit', submitTransaction);
router.post('/swap/order', getSwapOrder);
router.post('/swap/execute', executeSwap);
router.get('/wallet/top-tokens', getTopTokens);
router.get('/new-listings', getNewTokenListings);
router.get('/token/:mintAddress/details', getTokenDetails);
export default router; 