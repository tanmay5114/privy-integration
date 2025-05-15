const JUPITER_API_URL = 'http://10.0.2.2:3001/api/swap';
const DIRECT_JUPITER_ULTRA_ORDER_API_URL = 'https://lite-api.jup.ag/ultra/v1/order';

export class JupiterService {
  // Get a swap order from Jupiter by calling Jupiter Ultra API directly
  static async getSwapOrder(
    inputMint: string,
    outputMint: string,
    amount: number, // Amount in smallest unit (integer form)
    taker?: string
  ) {
    try {
      console.log('[JupiterService.getSwapOrder] Attempting direct POST call to Jupiter Ultra API with params:', { inputMint, outputMint, amount, taker });

      if (!inputMint || !outputMint || amount === undefined) {
        throw new Error('inputMint, outputMint, and amount are required');
      }
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('amount must be a positive number');
      }

      if (typeof inputMint !== 'string' || typeof outputMint !== 'string' || (taker && typeof taker !== 'string')) {
          throw new Error('Invalid mint or taker address format (must be string)');
      }

      const bodyPayload: any = {
        inputMint,
        outputMint,
        amount: numericAmount,
      };

      if (taker) {
        bodyPayload.taker = taker;
      }
      
      console.log('[JupiterService.getSwapOrder] Requesting POST to Jupiter Ultra API:', DIRECT_JUPITER_ULTRA_ORDER_API_URL, 'with body:', bodyPayload);

      const response = await fetch(DIRECT_JUPITER_ULTRA_ORDER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const responseBodyText = await response.text();
        let errorData;
        try {
            errorData = JSON.parse(responseBodyText);
        } catch (e) {
            errorData = { message: `Failed to parse error response from Jupiter: ${responseBodyText}` };
        }
        const errorMessage = `Failed to get swap order from Jupiter Ultra API: ${response.statusText} (${response.status})${
            errorData ? ` - ${errorData.message || JSON.stringify(errorData)}` : ''
          }`;
        console.error('[JupiterService.getSwapOrder] Jupiter Ultra API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const jupiterApiResponse = await response.json();
      console.log('[JupiterService.getSwapOrder] Successfully received data from Jupiter Ultra API:', jupiterApiResponse);
      
      if (!jupiterApiResponse || !jupiterApiResponse.transaction || !jupiterApiResponse.requestId) {
        if (jupiterApiResponse && jupiterApiResponse.transaction === null && !taker) {
             console.warn('[JupiterService.getSwapOrder] Jupiter response has null transaction (expected if taker was not provided, but taker was likely provided).', jupiterApiResponse);
        }
        if (!jupiterApiResponse.transaction || !jupiterApiResponse.requestId) {
             console.error('[JupiterService.getSwapOrder] Invalid or incomplete data from Jupiter Ultra API (missing transaction or requestId):', jupiterApiResponse);
             throw new Error('Invalid or incomplete data received from Jupiter Ultra API (missing transaction or requestId).');
        }
      }
      
      return { 
          order: jupiterApiResponse, 
          message: "Swap order fetched directly from Jupiter Ultra API (POST)" 
      };

    } catch (error: any) {
      console.error('[JupiterService.getSwapOrder] Caught exception during direct Jupiter call:', error.message, error);
      if (error.message.startsWith('Failed to get swap order from Jupiter Ultra API') || 
          error.message === 'inputMint, outputMint, and amount are required' ||
          error.message === 'amount must be a positive number' ||
          error.message === 'Invalid mint or taker address format (must be string)' ||
          error.message === 'Invalid or incomplete data received from Jupiter Ultra API (missing transaction or requestId).') {
        throw error;
      }
      throw new Error(`JupiterService: Failed to get swap order due to: ${error.message || String(error)}`);
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
      const ASSET_API_URL = `http://10.0.2.2:3001/api/wallet/${walletAddress}/assets`;
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