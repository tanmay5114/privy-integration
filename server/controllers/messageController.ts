import { Request, Response } from 'express';
import { prisma } from '../db/connect';
import { MessageRole } from '../../generated/prisma'; // Corrected path for MessageRole

// Get messages by chat ID (clientChatId)
export const getMessagesByChatId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId: clientChatId } = req.params; 
    const userWalletAddress = req.user?.walletAddress;

    if (!clientChatId) {
      res.status(400).json({ success: false, message: 'Client Chat ID is required' });
      return;
    }
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

    const chat = await prisma.chat.findUnique({
      where: { clientChatId }, 
      select: { id: true, userId: true }, 
    });

    if (!chat) {
      res.status(404).json({ success: false, message: 'Chat not found' });
      return;
    }

    if (chat.userId !== appUser.id) {
      res.status(403).json({ success: false, message: 'Unauthorized to access this chat\'s messages' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { chatId: chat.id }, 
      orderBy: { createdAt: 'asc' }, 
    });

    res.status(200).json({ success: true, data: messages });
    return;
  } catch (error) {
    console.error('Error fetching messages by chat ID:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Get message by ID (clientMessageId)
export const getMessageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clientMessageId } = req.params; 
    const userWalletAddress = req.user?.walletAddress;

    if (!clientMessageId) {
        res.status(400).json({ success: false, message: 'Client Message ID is required' });
        return;
    }
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
    
    const message = await prisma.message.findUnique({
      where: { clientMessageId }, 
      include: { chat: { select: { userId: true, clientChatId: true } } }, 
    });

    if (!message) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    if (message.chat.userId !== appUser.id) {
      res.status(403).json({ success: false, message: 'Unauthorized to access this message' });
      return;
    }
    
    const { chat: chatInfo, ...messageData } = message; 

    res.status(200).json({ success: true, data: messageData });
    return;
  } catch (error) {
    console.error('Error fetching message by ID:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Save messages (batch upsert)
export const saveMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages: messagesToSave } = req.body; // Renamed to avoid conflict
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!messagesToSave || !Array.isArray(messagesToSave) || messagesToSave.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Messages array is required',
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

    const savedMessagesResult = [];
    const errors = [];

    for (const messageData of messagesToSave) {
      const { id: clientMessageId, chatId: clientChatId, role, parts, attachments } = messageData;

      if (!clientMessageId || !clientChatId || !role) {
        errors.push({ clientMessageId, error: 'Each message must have id (clientMessageId), chatId (clientChatId), and role' });
        continue; 
      }

      // Validate role
      if (!Object.values(MessageRole).includes(role.toUpperCase() as MessageRole)) {
        errors.push({ clientMessageId, error: `Invalid role: ${role}. Must be one of ${Object.values(MessageRole).join(', ')}` });
        continue;
      }
      const messageRoleEnum = role.toUpperCase() as MessageRole;


      // Verify chat exists and belongs to the user
      const chat = await prisma.chat.findUnique({
        where: { clientChatId }, // Find chat by its client-provided ID
        select: { id: true, userId: true }, // Get CUID for message linking and userId for auth
      });

      if (!chat) {
        errors.push({ clientMessageId, error: `Chat with clientChatId ${clientChatId} not found` });
        continue;
      }

      if (chat.userId !== appUser.id) {
        errors.push({ clientMessageId, error: `Unauthorized: Chat with clientChatId ${clientChatId} does not belong to you` });
        continue;
      }
      
      // Process parts as in original code (ensure text is not empty)
      const processedParts = Array.isArray(parts) ? parts.map((part: any) => {
        if (!part.text || String(part.text).trim() === '') {
          return { ...part, text: 'Message content unavailable' };
        }
        return part;
      }) : [];
      if (processedParts.length === 0) {
        processedParts.push({ type: 'text', text: 'Message content unavailable' });
      }


      try {
        const upsertedMessage = await prisma.message.upsert({
          where: { clientMessageId },
          update: {
            role: messageRoleEnum,
            parts: processedParts, // Prisma expects JSON
            attachments: attachments || [], // Prisma expects JSON or null
            chatId: chat.id, // Ensure chat CUID is correctly linked
          },
          create: {
            clientMessageId,
            chatId: chat.id, // Link to chat's CUID
            role: messageRoleEnum,
            parts: processedParts,
            attachments: attachments || [],
          },
        });
        savedMessagesResult.push(upsertedMessage);
      } catch (e) {
        console.error(`Error saving message ${clientMessageId}:`, e);
        errors.push({ clientMessageId, error: 'Failed to save message to database' });
      }
    }

    if (errors.length > 0 && savedMessagesResult.length === 0) {
      res.status(400).json({ success: false, message: 'Failed to save any messages.', errors });
      return;
    }
    
    if (errors.length > 0) {
         res.status(207).json({ // Multi-Status
            success: true, // Partial success
            message: 'Some messages were processed with errors.',
            data: savedMessagesResult,
            errors,
        });
        return;
    }

    res.status(201).json({
      success: true,
      message: 'Messages saved successfully',
      data: savedMessagesResult,
    });
    return;

  } catch (error) {
    console.error('Error saving messages batch:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
};

// Delete messages by chat ID after timestamp
export const deleteMessagesByChatIdAfterTimestamp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId: clientChatId } = req.params; // This is clientChatId
    const { timestamp } = req.body;
    const userWalletAddress = req.user?.walletAddress;

    if (!clientChatId || !timestamp) {
      res.status(400).json({
        success: false,
        message: 'Client Chat ID and timestamp are required',
      });
      return;
    }
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

    // Verify chat exists and belongs to the user
    const chat = await prisma.chat.findUnique({
      where: { clientChatId },
      select: { id: true, userId: true }, // Get CUID for message query and userId for auth
    });

    if (!chat) {
      res.status(404).json({ success: false, message: 'Chat not found' });
      return;
    }

    if (chat.userId !== appUser.id) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized: This chat does not belong to you',
      });
      return;
    }

    let dateFromTimestamp: Date;
    try {
      dateFromTimestamp = new Date(timestamp);
      if (isNaN(dateFromTimestamp.getTime())) {
        throw new Error('Invalid date timestamp');
      }
    } catch (e) {
      res.status(400).json({ success: false, message: 'Invalid timestamp format' });
      return;
    }
    
    const result = await prisma.message.deleteMany({
      where: {
        chatId: chat.id, // Use the chat's CUID
        createdAt: { gte: dateFromTimestamp },
      },
    });

    res.status(200).json({
      success: true,
      message: `${result.count} messages deleted successfully`,
      deletedCount: result.count,
    });
    return;
  } catch (error) {
    console.error('Error deleting messages by timestamp:', error);
    res.status(500).json({ success: false, message: 'Server error' });
    return;
  }
}; 