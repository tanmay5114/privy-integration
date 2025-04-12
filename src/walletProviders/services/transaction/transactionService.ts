import {
  Connection,
  Transaction,
  VersionedTransaction,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useAppSelector } from '../../../hooks/useReduxHooks';
import { showSuccessNotification, showErrorNotification } from '../../../state/notification/reducer';
import { store } from '../../../state/store';
import { parseTransactionError, getSuccessMessage } from '../../../utils/transactions/errorParser';

export interface StandardWallet {
  provider: 'privy';
  address: string;
  publicKey: string;
  rawWallet: any;
  getWalletInfo: () => { walletType: string; address: string | null };
  getProvider: () => Promise<any>;
}

export type AnyTransaction = Transaction | VersionedTransaction;

export interface SendTransactionOptions {
  connection: Connection;
  confirmTransaction?: boolean;
  maxRetries?: number;
  statusCallback?: (status: string) => void;
}

/**
 * Simplified transaction service that specifically handles Privy transactions
 */
export class TransactionService {
  // Enable this for detailed logging
  static DEBUG = true;
  
  // Helper for debug logging
  private static log(...args: any[]) {
    if (this.DEBUG) {
      console.log('[TransactionService]', ...args);
    }
  }

  /**
   * Display a transaction success notification
   */
  static showSuccess(signature: string, type?: 'swap' | 'transfer' | 'stake' | 'nft' | 'token'): void {
    const message = getSuccessMessage(signature, type);
    store.dispatch(showSuccessNotification({ message, signature }));
  }

  /**
   * Display a transaction error notification with parsed message
   */
  static showError(error: any): void {
    const message = parseTransactionError(error);
    store.dispatch(showErrorNotification({ message }));
  }

  /**
   * Helper to filter error messages from status updates
   * This prevents raw error messages from showing in the UI
   */
  static filterStatusUpdate(status: string, callback?: (status: string) => void): void {
    if (!callback) return;
    
    // Don't pass error messages to the UI status
    if (status.startsWith('Error:') || status.includes('failed:') || status.includes('Transaction failed')) {
      callback('Transaction failed');
    } else {
      callback(status);
    }
  }

  /**
   * Signs and sends a transaction using Privy wallet
   */
  static async signAndSendTransaction(
    transaction: AnyTransaction,
    wallet: StandardWallet,
    options: SendTransactionOptions
  ): Promise<string> {
    const { connection, confirmTransaction = true, maxRetries = 3, statusCallback } = options;

    // Create a filtered status callback that won't show raw errors
    const filteredStatusCallback = statusCallback 
      ? (status: string) => this.filterStatusUpdate(status, statusCallback)
      : undefined;

    // 1. Get the wallet provider
    let signature: string;
    try {
      filteredStatusCallback?.('Preparing transaction for signing...');
      
      // Get the wallet provider
            const provider = await wallet.getProvider();
            if (!provider) {
        throw new Error('Failed to get Privy wallet provider');
      }

      filteredStatusCallback?.('Sending transaction to wallet for signing...');
      
      // Sign and send transaction
      const result = await provider.request({
        method: 'signAndSendTransaction',
        params: {
              transaction,
              connection,
        },
      });

      if (!result || !result.signature) {
        throw new Error('No signature returned from wallet');
      }
      
      signature = result.signature;
      filteredStatusCallback?.('Transaction signed and sent!');
    } catch (error: any) {
      filteredStatusCallback?.(`Transaction signing failed: ${error.message}`);
      this.showError(error);
      throw error;
    }

    // 2. Confirm transaction if needed
    if (confirmTransaction) {
      filteredStatusCallback?.('Confirming transaction...');
      let retries = 0;
      while (retries < maxRetries) {
        try {
          await connection.confirmTransaction(signature, 'confirmed');
          filteredStatusCallback?.('Transaction confirmed!');
          this.showSuccess(signature);
          break;
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            filteredStatusCallback?.('Transaction failed');
            this.showError(new Error('Transaction confirmation failed after maximum retries.'));
            throw new Error('Transaction confirmation failed after maximum retries.');
          }
          filteredStatusCallback?.(`Retrying confirmation (${retries}/${maxRetries})...`);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } else {
      // Show success even if we don't wait for confirmation
      this.showSuccess(signature);
    }

    return signature;
  }

  /**
   * Creates and sends a transaction from instructions
   */
  static async signAndSendInstructions(
    instructions: TransactionInstruction[],
    feePayer: PublicKey,
    wallet: StandardWallet,
    connection: Connection,
    options?: Partial<SendTransactionOptions>
  ): Promise<string> {
    // Create transaction from instructions
    const transaction = new Transaction();
    transaction.add(...instructions);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = feePayer;

    return this.signAndSendTransaction(transaction, wallet, {
        connection,
      ...options,
    });
  }

  /**
   * Signs and sends a base64-encoded transaction
   */
  static async signAndSendBase64(
    base64Tx: string,
    wallet: StandardWallet,
    connection: Connection,
    options?: Partial<SendTransactionOptions>
  ): Promise<string> {
    const buffer = Buffer.from(base64Tx, 'base64');
    let transaction: AnyTransaction;
    
    try {
      // Try to deserialize as VersionedTransaction first
      transaction = VersionedTransaction.deserialize(buffer);
    } catch (error) {
      // Fall back to legacy Transaction
      transaction = Transaction.from(buffer);
    }

    return this.signAndSendTransaction(transaction, wallet, {
      connection,
      ...options,
    });
  }
}

/**
 * React hook for using the transaction service with Privy wallet
 */
export function useTransactionService() {
  // Get the current provider from Redux state (always 'privy' now)
  const walletAddress = useAppSelector(state => state.auth.address) || '';

  /**
   * Signs and sends a transaction using Privy wallet
   */
  const signAndSendTransaction = async (
    transaction: AnyTransaction,
    wallet: StandardWallet,
    options: SendTransactionOptions
  ): Promise<string> => {
    return TransactionService.signAndSendTransaction(transaction, wallet, options);
  };

  /**
   * Signs and sends a transaction created from instructions
   */
  const signAndSendInstructions = async (
    instructions: TransactionInstruction[],
    feePayer: PublicKey,
    wallet: StandardWallet,
    connection: Connection,
    options?: Partial<SendTransactionOptions>
  ): Promise<string> => {
    return TransactionService.signAndSendInstructions(
      instructions,
      feePayer,
      wallet,
      connection,
      options
    );
  };

  /**
   * Signs and sends a base64-encoded transaction
   */
  const signAndSendBase64 = async (
    base64Tx: string,
    wallet: StandardWallet,
    connection: Connection,
    options?: Partial<SendTransactionOptions>
  ): Promise<string> => {
    return TransactionService.signAndSendBase64(
      base64Tx,
      wallet, 
      connection,
      options
    );
  };

  return {
    signAndSendTransaction,
    signAndSendInstructions,
    signAndSendBase64,
    currentProvider: 'privy',
    walletAddress,
  };
} 