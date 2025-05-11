import express from 'express';
import { 
  createOrUpdateUser, 
  getUserByWalletAddress, 
  getCurrentUser,
  getUserProfile,
  linkWalletToUser,
  listUserWallets,
  deleteWallet 
} from '../controllers/userController';
import { verifyWalletAddress } from '../middleware/auth';

const router = express.Router();

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log('User Routes - Incoming request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  next();
});

// User routes
router.post('/user', createOrUpdateUser);
router.get('/user/:walletAddress', getUserByWalletAddress);

// Wallet routes with explicit path logging
router.post('/wallets', (req, res, next) => {
  console.log('POST /wallets route hit');
  verifyWalletAddress(req, res, next);
}, linkWalletToUser);

router.get('/wallets', (req, res, next) => {
  console.log('GET /wallets route hit');
  verifyWalletAddress(req, res, next);
}, listUserWallets);

router.delete('/wallets/:address', (req, res, next) => {
  console.log('DELETE /wallets/:address route hit');
  verifyWalletAddress(req, res, next);
}, deleteWallet);

router.get('/me', getCurrentUser);
router.get('/profile/:walletAddress', getUserProfile);

export default router; 