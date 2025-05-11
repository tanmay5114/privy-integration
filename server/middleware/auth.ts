import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../node_modules/.prisma/client'; // Adjusted path
import { PrivyClient, AuthTokenClaims } from '@privy-io/server-auth';

// Define types for Privy response
interface PrivyLinkedAccount {
  type: string;
  address: string;
  chainId?: string;
}

interface PrivyVerifiedUser extends AuthTokenClaims {
  linkedAccounts?: PrivyLinkedAccount[];
}

const prisma = new PrismaClient();
const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any; // Consider defining a more specific User type based on your Prisma model
      privyToken?: string;
    }
  }
}

// Middleware to verify Privy authentication
export const verifyPrivyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get Privy token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Privy authentication required' });
      return;
    }

    const privyToken = authHeader.split(' ')[1];
    req.privyToken = privyToken;

    // Verify the Privy token and cast to our extended type
    const verifiedUser = await privy.verifyAuthToken(privyToken) as PrivyVerifiedUser;
    
    // Get the linked wallet address from the verified user
    const linkedWallet = verifiedUser.linkedAccounts?.find(
      (account: PrivyLinkedAccount) => account.type === 'wallet'
    );

    if (!linkedWallet?.address) {
      res.status(401).json({ success: false, message: 'No linked wallet found in Privy account' });
      return;
    }

    // Find or create user by wallet address
    let user = await prisma.user.findUnique({
      where: { walletAddress: linkedWallet.address }
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          walletAddress: linkedWallet.address,
          username: null,
          profilePicUrl: null
        }
      });
    }

    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Privy authentication error:', error);
    res.status(401).json({ success: false, message: 'Invalid Privy authentication' });
    return;
  }
};

// Legacy middleware to verify wallet address (keeping for backward compatibility)
export const verifyWalletAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // First try Privy auth if token is present
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        await verifyPrivyAuth(req, res, next);
        return;
      } catch (error) {
        // If Privy auth fails, fall back to wallet address auth
        console.log('Privy auth failed, falling back to wallet address auth');
      }
    }

    // Fallback to wallet address authentication
    const walletAddress = req.headers['x-wallet-address'] as string || req.query.walletAddress as string;

    if (!walletAddress) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Find user by wallet address using Prisma
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Middleware to allow authenticated or create new user
export const allowAuthenticatedOrCreateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get wallet address from header or query param
    const walletAddress = req.headers['x-wallet-address'] as string || req.query.walletAddress as string;

    if (!walletAddress) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Find user by wallet address using Prisma
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    // If user doesn't exist, create a new one
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            walletAddress,
            username: null,       // Explicitly set to null if that's the desired default
            profilePicUrl: null,  // Explicitly set to null
          },
        });
        console.log(`Created new user with wallet address: ${walletAddress}`);
      } catch (createError: any) {
        // Check if another process created the user in the meantime (race condition)
        // Prisma specific error code for unique constraint violation
        if (createError.code === 'P2002') {
          user = await prisma.user.findUnique({ where: { walletAddress } });
          if (!user) {
            // This case should ideally not happen if P2002 was indeed due to this user
            console.error('Failed to find user after P2002 error:', createError);
            res.status(500).json({ success: false, message: 'Failed to retrieve user after creation attempt.' });
            return;
          }
        } else {
          console.error('Failed to create user:', createError);
          res.status(500).json({ success: false, message: 'Failed to create user' });
          return;
        }
      }
    }

    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
}; 