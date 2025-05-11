import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Ensure Prisma client is initialized only once
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

async function connectToDatabase() {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('Successfully connected to the database using Prisma');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    console.log('Disconnected from the database');
  } catch (error) {
    console.error('Error disconnecting from the database:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

export { prisma, connectToDatabase, disconnectFromDatabase }; 