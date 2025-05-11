import dotenv from 'dotenv';

dotenv.config();

if (!process.env.RPC_URL) {
  throw new Error('RPC_URL is not defined in environment variables');
}

export const RPC_URL = process.env.RPC_URL; 