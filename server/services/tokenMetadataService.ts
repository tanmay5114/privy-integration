import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { RPC_URL } from '../config';

const connection = new Connection(RPC_URL);
const metaplex = new Metaplex(connection);

interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  image: string | null;
  coingeckoId?: string;
}

export class TokenMetadataService {
  // Get token metadata including image URL
  static async getTokenMetadata(mintAddress: string): Promise<TokenMetadata> {
    try {
      const mintPubKey = new PublicKey(mintAddress);
      
      // Get the metadata using Metaplex SDK
      const metadata = await metaplex.nfts().findByMint({ mintAddress: mintPubKey });
      
      console.log('Raw metadata for', mintAddress, ':', JSON.stringify(metadata, null, 2));
      
      if (!metadata) {
        console.log('No metadata found for', mintAddress);
        return {
          mint: mintAddress,
          name: 'Unknown Token',
          symbol: 'UNKNOWN',
          image: null
        };
      }

      let imageUrl = null;
      let coingeckoId = null;

      // Try to fetch metadata from the token's URI
      if (metadata.uri) {
        try {
          console.log('Fetching metadata from URI:', metadata.uri);
          const response = await fetch(metadata.uri);
          if (response.ok) {
            const uriMetadata = await response.json();
            console.log('URI metadata:', uriMetadata);
            imageUrl = uriMetadata.image || null;
            coingeckoId = uriMetadata.coingeckoId || null;
          }
        } catch (error) {
          console.error('Error fetching metadata from URI:', error);
        }
      }

      // If no image from URI, try token list
      if (!imageUrl) {
        try {
          const tokenListResponse = await fetch(`https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/${mintAddress}.json`);
          if (tokenListResponse.ok) {
            const tokenData = await tokenListResponse.json();
            console.log('Token list data:', tokenData);
            imageUrl = tokenData.logoURI || null;
            coingeckoId = tokenData.coingeckoId || null;
          }
        } catch (error) {
          console.error('Error fetching token list data:', error);
        }
      }

      // Special case for Wrapped SOL
      if (mintAddress === 'So11111111111111111111111111111111111111112') {
        imageUrl = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
        coingeckoId = 'solana';
      }

      return {
        mint: mintAddress,
        name: metadata.name,
        symbol: metadata.symbol,
        image: imageUrl,
        coingeckoId
      };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return {
        mint: mintAddress,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        image: null
      };
    }
  }

  // Get metadata for multiple tokens
  static async getMultipleTokenMetadata(mintAddresses: string[]) {
    try {
      const metadataPromises = mintAddresses.map(mint => this.getTokenMetadata(mint));
      const results = await Promise.all(metadataPromises);
      return results;
    } catch (error) {
      console.error('Error fetching multiple token metadata:', error);
      throw new Error(`Failed to fetch token metadata: ${error}`);
    }
  }
} 