import { API_BASE_URL } from '../config';

export interface WalletAsset {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number;
  price: number;
  change24h: number;
  mint?: string;
  decimals?: number;
  image?: string | null;
  type?: 'token' | 'nft';
}

export interface WalletAssets {
  nativeBalance: string;
  tokens: WalletAsset[];
  totalUsdValue: number;
}

export interface Transaction {
  hash: string;
  timestamp: string;
  type: 'send' | 'receive';
  amount: string;
  symbol: string;
  usdValue: number;
  status: 'confirmed' | 'pending' | 'failed';
  from: string;
  to: string;
}

interface ApiWalletAsset {
  mint: string;
  amount: number;
  decimals: number;
  name: string;
  symbol: string;
  image: string | null;
}

interface ApiWalletResponse {
  address: string;
  assets: {
    nativeBalance: number;
    tokens: ApiWalletAsset[];
  };
}

interface ApiWalletWithPricesResponse {
  address: string;
  assets: {
    nativeBalance: {
      amount: number;
      price: number | null;
      value: number | null;
    };
    tokens: Array<ApiWalletAsset & {
      price: number;
      value: number;
    }>;
    totalValue: number;
  };
  lastUpdated: string;
}

interface ApiAssetDetails {
  address: string;
  assetId: string;
  details: {
    type: 'token' | 'nft';
    mint: string;
    balance: number;
    decimals: number;
    name: string;
    symbol: string;
    image: string | null;
  }
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private transformWalletAsset(asset: ApiWalletAsset): WalletAsset {
    const balance = (asset.amount / Math.pow(10, asset.decimals)).toString();
    
    return {
      symbol: asset.symbol,
      name: asset.name,
      balance,
      usdValue: 0,
      price: 0,
      change24h: 0,
      mint: asset.mint,
      decimals: asset.decimals,
      image: asset.image,
      type: 'token'
    };
  }

  private transformAssetDetails(details: ApiAssetDetails['details']): WalletAsset {
    return {
      symbol: details.symbol,
      name: details.name,
      balance: details.balance.toString(),
      usdValue: 0,
      price: 0,
      change24h: 0,
      mint: details.mint,
      decimals: details.decimals,
      image: details.image,
      type: details.type
    };
  }

  transformWalletResponse(response: ApiWalletResponse): WalletAssets {
    return {
      nativeBalance: response.assets.nativeBalance.toString(),
      tokens: response.assets.tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        balance: token.amount.toString(),
        usdValue: 0,
        price: 0,
        change24h: 0,
        mint: token.mint,
        decimals: token.decimals,
        image: token.image,
        type: 'token'
      })),
      totalUsdValue: 0
    };
  }

  transformWalletWithPricesResponse(response: ApiWalletWithPricesResponse): WalletAssets {
    return {
      nativeBalance: response.assets.nativeBalance.amount.toString(),
      tokens: response.assets.tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        balance: token.amount.toString(),
        usdValue: token.value,
        price: token.price,
        change24h: 0,
        mint: token.mint,
        decimals: token.decimals,
        image: token.image,
        type: 'token'
      })),
      totalUsdValue: response.assets.totalValue
    };
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    console.log(`[API] Fetching ${endpoint}`);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`[API] Error fetching ${endpoint}:`, response.status, response.statusText);
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API] Raw response from ${endpoint}:`, JSON.stringify(data, null, 2));
    return data;
  }

  async getWalletAssets(address: string): Promise<ApiWalletResponse> {
    return this.fetchWithAuth(`/wallet/${address}/assets`);
  }

  async getWalletAssetsWithPrices(address: string): Promise<ApiWalletWithPricesResponse> {
    return this.fetchWithAuth(`/wallet/${address}/assets/prices`);
  }

  async getWalletTransactions(address: string): Promise<Transaction[]> {
    return this.fetchWithAuth(`/wallet/${address}/transactions`);
  }

  async getAssetDetails(address: string, assetId: string): Promise<WalletAsset> {
    const response = await this.fetchWithAuth(`/wallet/${address}/assets/${assetId}`);
    return this.transformAssetDetails(response.details);
  }

  async syncWalletBalances(address: string): Promise<WalletAssets> {
    return this.fetchWithAuth(`/wallet/${address}/sync`, { method: 'POST' });
  }
}

export const apiService = new ApiService(); 