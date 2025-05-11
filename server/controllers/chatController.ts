import { Request, Response } from 'express';
import prisma from '../db/connect';

// Get chat by ID
export const getChatById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: chatId } = req.params; 
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true } 
    });

    if (!appUser) {
      res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
      return;
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      res.status(404).json({ success: false, message: 'Chat not found' });
      return;
    }

    if (chat.userId !== appUser.id) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    res.status(200).json({ success: true, data: chat });
    return;
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Get chats by user ID (walletAddress)
export const getChatsByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userWalletAddress = req.user?.walletAddress;
    const { limit = '10', startingAfter, endingBefore } = req.query; 

    const numLimit = parseInt(limit as string, 10);

    if (!userWalletAddress) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true }
    });

    if (!appUser) {
      res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
      return;
    }

    let cursorOptions = {};
    if (startingAfter) {
      cursorOptions = {
        cursor: { id: startingAfter as string },
        skip: 1, 
      };
    } else if (endingBefore) {
      // Comments about endingBefore complexity from previous explanation would be here ideally,
      // but for the edit, we simplify. This part of the logic may need review later if endingBefore is critical.
    }

    const chats = await prisma.chat.findMany({
      where: { userId: appUser.id },
      take: numLimit,
      ...cursorOptions,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ success: true, data: chats });
    return;
  } catch (error) {
    console.error('Error fetching chats by user ID:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Create or update chat
export const saveChat = async (req: Request, res: Response): Promise<void> => {
  try {
    // The client-provided ID for the chat
    const { id: clientChatId, title } = req.body; 
    const userWalletAddress = req.user?.walletAddress;

    if (!clientChatId || !title) {
      res.status(400).json({
        success: false,
        message: 'Client chat ID and title are required',
      });
      return;
    }

    if (!userWalletAddress) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Find the app user by their wallet address to get their CUID (User.id)
    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true }, // Only need the user's CUID
    });

    if (!appUser) {
      // This case implies the walletAddress from token/session is not in DB
      res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
      return;
    }

    const chatData = {
      clientChatId,
      title,
      userId: appUser.id, // Link to the User's CUID
    };

    const chat = await prisma.chat.upsert({
      where: { clientChatId }, // Find by the client-provided ID
      update: {
        title,
        // userId should not change on update assuming chat ownership doesn't transfer
      },
      create: chatData,
    });

    // Check if it was a create or update by comparing createdAt and updatedAt
    const wasCreated = chat.createdAt.getTime() === chat.updatedAt.getTime();

    res.status(wasCreated ? 201 : 200).json({
      success: true,
      message: wasCreated ? 'Chat created successfully' : 'Chat updated successfully',
      data: chat,
    });
    return;
  } catch (error) {
    console.error('Error saving chat:', error);
    // Handle potential Prisma errors, e.g., unique constraint violation if clientChatId isn't unique
    // though the schema enforces it, good to be aware.
    // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const meta = 'meta' in error ? error.meta as { target?: string[] } : undefined;
      if (meta?.target?.includes('clientChatId')) {
        res.status(409).json({ success: false, message: 'Client chat ID already exists.' });
        return;
      }
    }
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Delete chat by ID
export const deleteChat = async (req: Request, res: Response): Promise<void> => {
  try {
    // clientChatId is expected in params, consistent with Mongoose's `id` from params
    const { id: clientChatId } = req.params; 
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true },
    });

    if (!appUser) {
      res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
      return;
    }

    // Find the chat by clientChatId to get its actual CUID and check ownership
    const chat = await prisma.chat.findUnique({
      where: { clientChatId },
      select: { id: true, userId: true } // Select CUID and userId for auth check
    });

    if (!chat) {
      res.status(404).json({ success: false, message: 'Chat not found' });
      return;
    }

    if (chat.userId !== appUser.id) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Perform deletions in a transaction
    // First delete messages, then the chat
    await prisma.$transaction(async (tx: any) => {
      await tx.message.deleteMany({
        where: { chatId: chat.id }, // Use the chat's CUID
      });
      await tx.chat.delete({
        where: { id: chat.id }, // Use the chat's CUID
      });
    });

    res.status(200).json({
      success: true,
      message: 'Chat and associated messages deleted successfully',
    });
    return;
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Bulk delete multiple chats
export const bulkDeleteChats = async (req: Request, res: Response): Promise<void> => {
  try {
    // These are clientChatIds
    const { chatIds: clientChatIds } = req.body; 
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!clientChatIds || !Array.isArray(clientChatIds) || clientChatIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Client chat IDs array is required',
      });
      return;
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true },
    });

    if (!appUser) {
      res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
      return;
    }

    // Find chats that match the clientChatIds and belong to the user
    // to get their actual CUIDs for deletion.
    const chatsToDelete = await prisma.chat.findMany({
      where: {
        clientChatId: { in: clientChatIds as string[] },
        userId: appUser.id,
      },
      select: {
        id: true, // Get the CUID of the chat
        clientChatId: true // To return which client IDs were deleted
      },
    });

    if (chatsToDelete.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No matching chats found for the user',
      });
      return;
    }

    const actualChatCUIDs = chatsToDelete.map((chat: { id: string; clientChatId: string }) => chat.id);
    const deletedClientChatIds = chatsToDelete.map((chat: { id: string; clientChatId: string }) => chat.clientChatId);

    // Perform deletions in a transaction
    const result = await prisma.$transaction(async (tx: any) => { // tx as any for now
      const messageDeleteResult = await tx.message.deleteMany({
        where: { chatId: { in: actualChatCUIDs } },
      });
      const chatDeleteResult = await tx.chat.deleteMany({
        where: { id: { in: actualChatCUIDs } },
      });
      return { chatDeleteResult, messageDeleteResult };
    });

    res.status(200).json({
      success: true,
      message: `${result.chatDeleteResult.count} chats and their associated messages deleted successfully`,
      deletedChats: deletedClientChatIds, // Return the clientChatIds that were processed
      deletedCount: result.chatDeleteResult.count,
    });
    return;
  } catch (error) {
    console.error('Error bulk deleting chats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Delete all chats for a user
export const deleteAllChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const appUser = await prisma.user.findUnique({
      where: { walletAddress: userWalletAddress },
      select: { id: true }, // Get the User CUID
    });

    if (!appUser) {
      res.status(403).json({ success: false, message: 'User not found or invalid authentication' });
      return;
    }

    // Find all CUIDs of chats belonging to the user
    const userChats = await prisma.chat.findMany({
      where: { userId: appUser.id },
      select: { id: true }, // Only need the CUIDs of the chats
    });

    if (userChats.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No chats found to delete',
        deletedCount: 0,
      });
      return;
    }

    const chatCUIDsToDelete = userChats.map((chat: {id: string}) => chat.id);

    // Perform deletions in a transaction
    const result = await prisma.$transaction(async (tx: any) => { // tx as any for now
      // First delete all messages associated with these chats
      await tx.message.deleteMany({
        where: { chatId: { in: chatCUIDsToDelete } },
      });
      // Then delete all chats belonging to the user
      const chatDeleteResult = await tx.chat.deleteMany({
        where: { userId: appUser.id },
      });
      return chatDeleteResult; // Contains count of deleted chats
    });

    res.status(200).json({
      success: true,
      message: `${result.count} chats and their associated messages deleted successfully`,
      deletedCount: result.count,
    });
    return;
  } catch (error) {
    console.error('Error deleting all chats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
}; 