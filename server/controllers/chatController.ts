import { Request, Response } from 'express';
import { prisma } from '../db/connect'; // Import Prisma client

// Get chat by ID (clientChatId)
export const getChatById = async (req: Request, res: Response) => {
  try {
    const { id: clientChatId } = req.params; // id from params is clientChatId
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true }, // Get the Prisma User CUID
    });

    if (!appUser) {
      return res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
    }

    const chat = await prisma.chat.findUnique({
      where: { clientChatId },
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (chat.userId !== appUser.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    return res.status(200).json({ success: true, data: chat });
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get chats by user ID (walletAddress)
export const getChatsByUserId = async (req: Request, res: Response) => {
  try {
    const userWalletAddress = req.user?.walletAddress;
    const { limit = '10', startingAfter, endingBefore } = req.query;
    const numLimit = parseInt(limit as string, 10);

    if (!userWalletAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true },
    });

    if (!appUser) {
      return res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
    }

    let cursorOptions = {};
    if (startingAfter) {
      cursorOptions = {
        cursor: { clientChatId: startingAfter as string }, // Assuming startingAfter is clientChatId
        skip: 1,
      };
    } else if (endingBefore) {
      // Prisma doesn't directly support endingBefore with clientChatId easily for cursor pagination without knowing sort order of clientChatId
      // If sorting by createdAt, this logic would need to fetch the createdAt of the endingBefore clientChatId
      // For simplicity, this part might need refinement based on actual pagination needs.
    }

    const chats = await prisma.chat.findMany({
      where: { userId: appUser.id },
      take: numLimit,
      ...cursorOptions,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    console.error('Error fetching chats by user ID:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create or update chat
export const saveChat = async (req: Request, res: Response) => {
  try {
    const { id: clientChatId, title } = req.body; // id from body is clientChatId
    const userWalletAddress = req.user?.walletAddress;

    if (!clientChatId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Client chat ID and title are required',
      });
    }

    if (!userWalletAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true }, 
    });

    if (!appUser) {
      return res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
    }

    const chatData = {
      clientChatId,
      title,
      userId: appUser.id, // Link to the User's CUID
    };

    const chat = await prisma.chat.upsert({
      where: { clientChatId },
      update: {
        title,
        // userId should not change if chat ownership doesn't transfer
      },
      create: chatData,
    });

    const wasCreated = chat.createdAt.getTime() === chat.updatedAt.getTime();

    return res.status(wasCreated ? 201 : 200).json({
      success: true,
      message: wasCreated ? 'Chat created successfully' : 'Chat updated successfully',
      data: chat,
    });
  } catch (error) {
    console.error('Error saving chat:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const meta = 'meta' in error ? error.meta as { target?: string[] } : undefined;
      if (meta?.target?.includes('clientChatId')) {
        return res.status(409).json({ success: false, message: 'Client chat ID already exists.' });
      }
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete chat by ID (clientChatId)
export const deleteChat = async (req: Request, res: Response) => {
  try {
    const { id: clientChatId } = req.params; // id from params is clientChatId
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true },
    });

    if (!appUser) {
      return res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
    }

    const chat = await prisma.chat.findUnique({
      where: { clientChatId },
      select: { id: true, userId: true }, // Get CUID and userId for auth check
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (chat.userId !== appUser.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({
        where: { chatId: chat.id }, // Use the chat's CUID
      });
      await tx.chat.delete({
        where: { id: chat.id }, // Use the chat's CUID
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Chat and associated messages deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Bulk delete multiple chats by their clientChatIds
export const bulkDeleteChats = async (req: Request, res: Response) => {
  try {
    const { chatIds: clientChatIds } = req.body;
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!clientChatIds || !Array.isArray(clientChatIds) || clientChatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Client chat IDs array is required',
      });
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true },
    });

    if (!appUser) {
      return res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
    }

    const chatsToDelete = await prisma.chat.findMany({
      where: {
        clientChatId: { in: clientChatIds as string[] },
        userId: appUser.id,
      },
      select: {
        id: true, // Get the CUID of the chat
        clientChatId: true, 
      },
    });

    if (chatsToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching chats found for the user to delete',
      });
    }

    const actualChatCUIDs = chatsToDelete.map((chat) => chat.id);
    const deletedClientChatIds = chatsToDelete.map((chat) => chat.clientChatId);

    const result = await prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({
        where: { chatId: { in: actualChatCUIDs } },
      });
      const chatDeleteResult = await tx.chat.deleteMany({
        where: { id: { in: actualChatCUIDs } },
      });
      return { chatDeleteResult };
    });

    return res.status(200).json({
      success: true,
      message: `${result.chatDeleteResult.count} chats and their associated messages deleted successfully`,
      deletedChats: deletedClientChatIds,
      deletedCount: result.chatDeleteResult.count,
    });
  } catch (error) {
    console.error('Error bulk deleting chats:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete all chats for a user
export const deleteAllChats = async (req: Request, res: Response) => {
  try {
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true }, 
    });

    if (!appUser) {
      return res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
    }

    const userChats = await prisma.chat.findMany({
      where: { userId: appUser.id },
      select: { id: true }, 
    });

    if (userChats.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No chats found to delete',
        deletedCount: 0,
      });
    }

    const chatCUIDsToDelete = userChats.map((chat) => chat.id);

    const result = await prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({
        where: { chatId: { in: chatCUIDsToDelete } },
      });
      const chatDeleteResult = await tx.chat.deleteMany({
        where: { userId: appUser.id }, // or id: { in: chatCUIDsToDelete }
      });
      return chatDeleteResult;
    });

    return res.status(200).json({
      success: true,
      message: `${result.count} chats and their associated messages deleted successfully`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error deleting all chats:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}; 