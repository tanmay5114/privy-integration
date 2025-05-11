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

export default router; 