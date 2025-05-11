import { Request, Response } from 'express';
import { prisma } from '../db/connect';
import { BlockchainService } from '../services/blockchainService';

// Create or update user
export const createOrUpdateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress, username, profilePicUrl } = req.body;
    
    if (!walletAddress) {
      res.status(400).json({ success: false, message: 'Wallet address is required' });
      return;
    }
    
    const userData = {
      walletAddress,
      username: username || null,
      profilePicUrl: profilePicUrl || null,
    };
    
    // Upsert operation: update if exists, create if not
    // The `id` for the User model is a CUID, walletAddress is unique.
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {
        username: userData.username,
        profilePicUrl: userData.profilePicUrl,
        // walletAddress is not in update because it's in the where clause
      },
      create: userData,
    });
    
    res.status(user.createdAt.getTime() === user.updatedAt.getTime() ? 201 : 200).json({
      success: true,
      message: user.createdAt.getTime() === user.updatedAt.getTime() ? 'User created successfully' : 'User updated successfully',
      user,
    });
    return;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    // Consider more specific error handling for Prisma errors if needed
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Get user by wallet address
export const getUserByWalletAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      res.status(400).json({ success: false, message: 'Wallet address is required' });
      return;
    }
    
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });
    
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    res.status(200).json({ success: true, user });
    return;
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Get current user 
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure your authentication middleware correctly sets req.user or provides walletAddress
    // For this example, we'll assume walletAddress might be passed directly for now
    // or is available on an augmented req.user object.
    // The original code used req.headers['x-wallet-address'] or req.query.walletAddress
    // Let's stick to that for now if req.user is not standardized.

    let walletAddress = req.headers['x-wallet-address'] as string || req.query.walletAddress as string;
    
    // If you have auth middleware that sets req.user with walletAddress, you could use:
    // const walletAddress = req.user?.walletAddress; 

    if (!walletAddress) {
      // Changed to 400 as it's a missing identifier rather than purely an auth issue
      // if it's expected from header/query. If it must come from validated auth, 401/403 is fine.
      res.status(400).json({ success: false, message: 'Wallet address not provided' });
      return;
    }
    
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });
    
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    // Prisma returns plain objects, so the selected fields are already what you need.
    res.status(200).json({
      success: true,
      user, // The whole user object as returned by Prisma
    });
    return;
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Get comprehensive user profile information
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    const currentUserAddress = req.headers['x-wallet-address'] as string || req.query.walletAddress as string;
    
    console.log('Profile request received:', {
      requestedWalletAddress: walletAddress,
      currentUserAddress,
      headers: req.headers,
      query: req.query
    });
    
    if (!walletAddress) {
      res.status(400).json({ success: false, message: 'Wallet address is required' });
      return;
    }
    
    // Get basic user info
    let user = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    console.log('Database query result:', { user });
    
    if (!user) {
      console.log('User not found in database:', { walletAddress });
      // Try to create the user if they don't exist
      try {
        const newUser = await prisma.user.create({
          data: {
            walletAddress,
            username: null,
            profilePicUrl: null
          }
        });
        console.log('Created new user:', { newUser });
        
        // Get wallet assets with prices if available
        let assets = null;
        try {
          assets = await BlockchainService.getWalletAssetsWithPrices(walletAddress);
        } catch (error) {
          console.error('Error fetching wallet assets:', error);
        }

        res.status(201).json({
          success: true,
          profile: {
            walletAddress: newUser.walletAddress,
            username: newUser.username,
            profilePicUrl: newUser.profilePicUrl,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
            assets
          }
        });
        return;
      } catch (createError: any) {
        console.error('Error creating user:', createError);
        // If it's a unique constraint violation, try to fetch again
        if (createError?.code === 'P2002') {
          const existingUser = await prisma.user.findUnique({
            where: { walletAddress }
          });
          if (existingUser) {
            console.log('Found user after retry:', { existingUser });
            // Continue with the existing user
            user = existingUser;
          } else {
            res.status(404).json({ success: false, message: 'User not found and could not be created' });
            return;
          }
        } else {
          res.status(404).json({ success: false, message: 'User not found' });
          return;
        }
      }
    }

    // Get wallet assets with prices if available
    let assets = null;
    try {
      assets = await BlockchainService.getWalletAssetsWithPrices(walletAddress);
    } catch (error) {
      console.error('Error fetching wallet assets:', error);
      // Don't fail the whole request if assets fetch fails
    }

    res.status(200).json({
      success: true,
      profile: {
        walletAddress: user.walletAddress,
        username: user.username,
        profilePicUrl: user.profilePicUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        assets
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Link a new wallet to user account
export const linkWalletToUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address, type, blockchain } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!address || !type || !blockchain) {
      res.status(400).json({ 
        success: false, 
        message: 'Wallet address, type, and blockchain are required' 
      });
      return;
    }

    // Validate blockchain type
    const validBlockchains = ['Solana', 'Ethereum']; // Add more as needed
    if (!validBlockchains.includes(blockchain)) {
      res.status(400).json({ 
        success: false, 
        message: `Invalid blockchain. Must be one of: ${validBlockchains.join(', ')}` 
      });
      return;
    }

    // Validate wallet type
    const validTypes = ['EOA', 'SmartContract']; // Add more as needed
    if (!validTypes.includes(type)) {
      res.status(400).json({ 
        success: false, 
        message: `Invalid wallet type. Must be one of: ${validTypes.join(', ')}` 
      });
      return;
    }

    // Check if wallet already exists
    const existingWallet = await prisma.wallet.findUnique({
      where: { address }
    });

    if (existingWallet) {
      res.status(409).json({ 
        success: false, 
        message: 'Wallet address is already linked to another account' 
      });
      return;
    }

    // Create new wallet
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        address,
        type,
        blockchain,
        aiSettings: {} // Default empty settings
      }
    });

    // Get initial wallet assets
    let assets = null;
    try {
      assets = await BlockchainService.getWalletAssetsWithPrices(address);
    } catch (error) {
      console.error('Error fetching initial wallet assets:', error);
      // Continue even if asset fetch fails - we can sync later
    }

    res.status(201).json({
      success: true,
      message: 'Wallet linked successfully',
      wallet: {
        ...wallet,
        assets
      }
    });
  } catch (error) {
    console.error('Error linking wallet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to link wallet',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// List all wallets linked to the authenticated user
export const listUserWallets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Get all wallets for the user with their assets
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Get assets for each wallet
    const walletsWithAssets = await Promise.all(
      wallets.map(async (wallet) => {
        let assets = null;
        try {
          assets = await BlockchainService.getWalletAssetsWithPrices(wallet.address);
        } catch (error) {
          console.error(`Error fetching assets for wallet ${wallet.address}:`, error);
          // Continue even if asset fetch fails
        }

        return {
          ...wallet,
          assets
        };
      })
    );

    res.status(200).json({
      success: true,
      wallets: walletsWithAssets,
      total: wallets.length
    });
  } catch (error) {
    console.error('Error listing user wallets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to list wallets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete a wallet from user's account
export const deleteWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!address) {
      res.status(400).json({ 
        success: false, 
        message: 'Wallet address is required' 
      });
      return;
    }

    // Find the wallet and verify ownership
    const wallet = await prisma.wallet.findFirst({
      where: { 
        address,
        userId 
      }
    });

    if (!wallet) {
      res.status(404).json({ 
        success: false, 
        message: 'Wallet not found or does not belong to user' 
      });
      return;
    }

    // Delete the wallet
    await prisma.wallet.delete({
      where: { id: wallet.id }
    });

    res.status(200).json({
      success: true,
      message: 'Wallet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting wallet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete wallet',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 