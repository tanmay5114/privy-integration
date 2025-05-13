import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../walletProviders/hooks/useWallet';
import { apiService, WalletAssets, Transaction } from '../services/api';
import { REFRESH_INTERVAL } from '../config';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export const useWalletData = () => {
  const { address } = useWallet();
  const [assets, setAssets] = useState<WalletAssets | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchWalletData = useCallback(async (isRetry = false) => {
    if (!address) {
      setAssets(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
      }
      setError(null);

      // Fetch basic assets first
      const basicAssets = await apiService.getWalletAssets(address);
      const basicWalletAssets = apiService.transformWalletResponse(basicAssets);

      try {
        // Then try to fetch prices
        const assetsWithPrices = await apiService.getWalletAssetsWithPrices(address);
        const walletAssetsWithPrices = apiService.transformWalletWithPricesResponse(assetsWithPrices);
        
        // Update the basic assets with price information
        basicWalletAssets.totalUsdValue = walletAssetsWithPrices.totalUsdValue;
        basicWalletAssets.tokens = basicWalletAssets.tokens.map(token => {
          const tokenWithPrice = walletAssetsWithPrices.tokens.find(t => t.mint === token.mint);
          if (tokenWithPrice) {
            return {
              ...token,
              usdValue: tokenWithPrice.usdValue,
              price: tokenWithPrice.price
            };
          }
          return token;
        });
      } catch (priceError) {
        console.warn('Failed to fetch prices:', priceError);
        // Continue with basic assets if price fetch fails
      }

      setAssets(basicWalletAssets);
      setRetryCount(0); // Reset retry count on success

      // Fetch transactions
      const transactionsData = await apiService.getWalletTransactions(address);
      setTransactions(transactionsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      
      // Check if it's a rate limit error
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setError(`Rate limited. Retrying in ${RETRY_DELAY/1000} seconds... (${retryCount + 1}/${MAX_RETRIES})`);
          setTimeout(() => fetchWalletData(true), RETRY_DELAY);
          return;
        }
        setError('Rate limit exceeded. Please try again in a few minutes.');
      } else {
        setError(errorMessage);
      }
      console.error('Error fetching wallet data:', err);
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }, [address, retryCount]);

  // Initial fetch
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Set up periodic refresh
  useEffect(() => {
    if (!address) return;

    const intervalId = setInterval(() => {
      if (retryCount === 0) { // Only refresh if we're not in a retry cycle
        fetchWalletData();
      }
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [address, fetchWalletData, retryCount]);

  const refreshData = useCallback(() => {
    setRetryCount(0); // Reset retry count on manual refresh
    return fetchWalletData();
  }, [fetchWalletData]);

  const getAssetDetails = useCallback(async (assetId: string) => {
    if (!address) throw new Error('No wallet address available');
    return apiService.getAssetDetails(address, assetId);
  }, [address]);

  return {
    assets,
    transactions,
    loading,
    error,
    refreshData,
    getAssetDetails,
    isRetrying: retryCount > 0,
  };
}; 