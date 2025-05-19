
// import { useCallback } from 'react';
// import { useWallet } from './useWallet';
// import { useFundSolanaWallet } from '@privy-io/expo';

// export function useFundWallet() {
//   const { address } = useWallet();
//   const { fundWallet } = useFundSolanaWallet();
  
//   const handleFundWallet = useCallback(async (amount: string) => {
//     if (!address) {
//       throw new Error('No wallet address available');
//     }
//     try {
//       await fundWallet({ 
//         address,
//         amount, // Add the amount parameter here
//       });
//     } catch (error: any) {
//       console.error('Error funding wallet:', error);
//       throw new Error(error.message || 'Failed to fund wallet');
//     }
//   }, [address, fundWallet]);
  
//   return {
//     fundWallet: handleFundWallet,
//   };
// }

import { useCallback, useState } from 'react';
import { useWallet } from './useWallet';
import { useFundSolanaWallet } from '@privy-io/expo';

export function useFundWallet() {
  const { address } = useWallet();
  const { fundWallet } = useFundSolanaWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleFundWallet = useCallback(async (amount: string) => {
    if (!address) {
      throw new Error('No wallet address available');
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    setIsLoading(true);
    
    try {
      console.log('Initiating funding with Privy:', { address, amount });
      
      // This should trigger the Privy funding flow with payment method selection
      const result = await fundWallet({
        address,
        amount,
      });
      
      console.log('Funding result:', result);
      return result;
    } catch (error: any) {
      console.error('Funding error:', error);
      console.error('Error stack:', error.stack);
      
      // Handle common errors
      if (error.message?.includes('User cancelled')) {
        throw new Error('Funding was cancelled');
      }
      
      if (error.message?.includes('payment')) {
        throw new Error('Payment failed. Please check your payment method and try again.');
      }
      
      throw new Error(error.message || 'Failed to fund wallet');
    } finally {
      setIsLoading(false);
    }
  }, [address, fundWallet]);

  return {
    fundWallet: handleFundWallet,
    isLoading,
    address,
  };
}