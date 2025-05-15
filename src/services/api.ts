import { API_BASE_URL } from '../constant';

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
  type?: 'token' | 'nft' | 'native';
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

// Map of known mint addresses to symbols
const MINT_SYMBOLS: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'SOL',
  'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa': 'SEND',
  // Add more known tokens here as needed
};

function transformSolanaTxToTransaction(rawTx: any, userAddress: string): Transaction {
  const signature = rawTx.signature;
  const timestamp = rawTx.timestamp;
  let type: 'send' | 'receive' = 'send';
  let symbol = 'SOL';
  let amount = '0';
  let from = '';
  let to = '';
  let decimals = 9; // Default for SOL

  // SPL Token receive detection (most robust)
  if (rawTx.meta?.postTokenBalances?.length) {
    for (const post of rawTx.meta.postTokenBalances) {
      if (post.owner === userAddress) {
        const mint = post.mint;
        symbol = MINT_SYMBOLS[mint] || 'TOKEN';
        decimals = post.uiTokenAmount.decimals ?? 6;
        const pre = rawTx.meta?.preTokenBalances?.find(
          (b: any) => b.owner === userAddress && b.mint === mint
        );
        const postAmount = Number(post.uiTokenAmount.uiAmountString);
        const preAmount = pre ? Number(pre.uiTokenAmount.uiAmountString) : 0;
        const received = postAmount - preAmount;
        if (received > 0) {
          type = 'receive';
          amount = received.toString();
          from = '';
          to = userAddress;
          break;
        }
      }
    }
  }

  // If not a receive, fallback to instruction-based logic (for send or SOL)
  if (amount === '0') {
    const instructions = rawTx.transaction?.message?.instructions || [];
    let transferIx = instructions.find(
      (ix: any) =>
        (ix?.parsed?.type === 'transfer' || ix?.parsed?.type === 'transferChecked')
    );
    if (transferIx && transferIx.parsed.info.mint) {
      const info = transferIx.parsed.info;
      const mint = info.mint;
      from = info.authority || info.source || '';
      to = info.destination || info.account || '';
      decimals = info.decimals ?? 6;
      symbol = MINT_SYMBOLS[mint] || 'TOKEN';
      const parsedAmount = Number(info.amount);
      amount = !isNaN(parsedAmount) ? (parsedAmount / Math.pow(10, decimals)).toString() : '0';
      if (from === userAddress) {
        type = 'send';
      }
    } else if (transferIx && transferIx.parsed.info.lamports) {
      const info = transferIx.parsed.info;
      from = info.source;
      to = info.destination;
      const parsedLamports = Number(info.lamports);
      amount = !isNaN(parsedLamports) ? (parsedLamports / 1e9).toString() : '0';
      symbol = 'SOL';
      decimals = 9;
      if (from === userAddress) type = 'send';
      else if (to === userAddress) type = 'receive';
    }
  }

  return {
    hash: signature,
    timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : '',
    type,
    amount,
    symbol,
    usdValue: 0,
    status: rawTx.meta?.err ? 'failed' : 'confirmed',
    from,
    to,
  };
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
    const rawTxs = await this.fetchWithAuth(`/wallet/${address}/transactions`);
    return Array.isArray(rawTxs?.transactions)
      ? rawTxs.transactions.map((tx: any) => transformSolanaTxToTransaction(tx, address))
      : [];
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