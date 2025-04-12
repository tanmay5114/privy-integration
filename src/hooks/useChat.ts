import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  appendResponseMessages,
  type CoreAssistantMessage,
  type CoreToolMessage,
  generateText,
  type Message,
} from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import { SolanaAgentKit, createVercelAITools } from "solana-agent-kit";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { 
  fetchChat, 
  fetchMessages, 
  saveChat, 
  saveMessages, 
  generateUUID, 
  deleteChat as deleteChatAPI,
  createOrUpdateUser
} from "@/lib/utils";
import { myProvider } from "@/lib/ai/providers";
import { HELIUS_STAKED_URL } from "@env";
import { useWallet } from "@/walletProviders";
import { ensureBuffer } from "@/polyfills";

// Ensure Buffer is available before executing any code
ensureBuffer();

// Improved polyfill for structuredClone
export function safeDeepClone<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  try {
    // Try the JSON method first as our reliable fallback
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.warn("Deep clone failed:", error);
    
    // Handle circular references or non-serializable objects
    if (Array.isArray(obj)) {
      return obj.map(item => safeDeepClone(item)) as unknown as T;
    } else if (typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = safeDeepClone((obj as Record<string, any>)[key]);
        }
      }
      return result as unknown as T;
    }
    
    // Fallback to returning the original if all else fails
    return obj;
  }
}

// Setup structuredClone polyfill immediately on module load
if (typeof global !== 'undefined') {
  if (!global.structuredClone) {
    (global as any).structuredClone = safeDeepClone;
  }
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

interface UseChatOptions {
  id: string;
  initialMessages?: Message[];
  selectedChatModel?: string;
}
type Status = "submitted" | "streaming" | "ready" | "error";
type Reload = UseChatHelpers["reload"];
type Stop = UseChatHelpers["stop"];

export async function generateTitleFromUserMessage({
  message,
}: {
  message: Message;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export function useChat({ id, initialMessages = [] }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");
  const [status, setStatus] = useState<Status>("ready");
  const initialFetchDone = useRef(false);
  
  // Use the wallet hook to access Privy wallet functionality
  const { connected, publicKey, address, signTransaction, signMessage, sendTransaction, signAllTransactions } = useWallet();

  // Ensure user record exists in the database when connected
  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (connected && address) {
        try {
          await createOrUpdateUser({
            walletAddress: address,
          });
          console.log("User created or verified in database");
        } catch (err) {
          console.error("Failed to create user:", err);
        }
      }
    };
    
    createUserIfNeeded();
  }, [connected, address]);

  // Only set initialMessages on first mount
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, []); // Empty dependency array ensures this only runs once

  // Fetch initial messages if any
  useEffect(() => {
    // Skip if we've already fetched or if initialMessages were provided
    if (initialFetchDone.current || initialMessages.length > 0) {
      return;
    }

    const fetchInitialMessages = async () => {
      if (!id || !connected || !address) return;
      
      try {
        // Check if chat exists first before trying to fetch messages
        const chat = await fetchChat(id, address);
        
        // Only try to fetch messages if chat exists
        if (chat) {
          initialFetchDone.current = true; // Mark as done
          const fetchedMessages = await fetchMessages(id, address);
          
          if (fetchedMessages.length > 0) {
            // Convert to Message format expected by AI SDK
            const formattedMessages = fetchedMessages.map(msg => ({
              id: msg.id,
              content: msg.parts.find((part: { type: string; text: string }) => part.type === 'text')?.text || '',
              role: msg.role as Message["role"],
              parts: msg.parts,
              experimental_attachments: msg.attachments || [],
            }));
            setMessages(formattedMessages as Message[]);
          }
        } else {
          // Chat doesn't exist yet, so we shouldn't try to fetch messages
          // Just mark as done to avoid further attempts
          initialFetchDone.current = true;
        }
      } catch (error) {
        // Don't show errors for 404s (expected for new chats)
        if (!(error instanceof Error && error.message.includes('404'))) {
          console.error("Error fetching messages:", error);
          setError("Failed to fetch messages. Please try again.");
        }
        initialFetchDone.current = true; // Mark as done even on error to prevent repeated attempts
      }
    };

    // Only fetch messages if wallet is connected AND this isn't a brand new chat
    if (connected && address) {
      fetchInitialMessages();
    } else {
      initialFetchDone.current = false; // Reset so we can try again when connected
    }
  }, [id, connected, address, initialMessages.length]);

  const solanaTools = useMemo(() => {
    if (connected && address) {
      const agent = new SolanaAgentKit(
        {
          publicKey: publicKey || new PublicKey(address),
          signTransaction: async tx => {
            return await signTransaction(tx) as any;
          },
          signMessage: async msg => {
            return await signMessage(msg);
          },
          sendTransaction: async tx => {
            const connection = new Connection(HELIUS_STAKED_URL, 'confirmed');
            return await sendTransaction(tx, connection);
          },
          signAllTransactions: async txs => {
            return await signAllTransactions(txs) as any;
          },
          signAndSendTransaction: async tx => {
            const connection = new Connection(HELIUS_STAKED_URL, 'confirmed');
            const signature = await sendTransaction(tx, connection);
            return { signature };
          },
        },
        HELIUS_STAKED_URL,
        {},
      ).use(TokenPlugin as any);
      const tools = createVercelAITools(agent, agent.actions);
      return tools;
    }
  }, [connected, address, publicKey, signTransaction, signMessage, sendTransaction, signAllTransactions]);

  const append = useCallback(
    (newMessage: Message) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      return newMessage.content;
    },
    [],
  );

  const reload: Reload = async (chatOptions) => {
    return null;
  };

  const stop: Stop = async () => {
    setStatus("ready");
    setIsLoading(false);
  };

  const sendMessage = useCallback(
    async (newMessage?: Message) => {
      setStatus("submitted");

      // Ensure wallet is connected
      if (!connected || !address) {
        setError("You must be connected to your wallet to send messages");
        setStatus("error");
        return;
      }

      setIsLoading(true);
      setError(null);

      // Update UI immediately with the new message
      if (newMessage) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }

      const lastMessage = newMessage ?? (messages[messages.length - 1] as Message);

      try {
        // Check if chat exists
        const chat = await fetchChat(id, address);

        // Always create/update the chat before proceeding
        if (!chat) {
          const title = await generateTitleFromUserMessage({
            message: lastMessage,
          });
          
          // Create chat first
          const chatResult = await saveChat({
            id,
            title,
          }, address);
          
          if (!chatResult) {
            throw new Error("Failed to create chat");
          }
        }

        if (newMessage) {
          // Prepare a clean message object with explicit text field
          // This is critical for server validation
          const formattedMessage = {
            id: lastMessage.id,
            chatId: id,
            role: lastMessage.role,
            parts: [
              {
                type: 'text',
                text: typeof lastMessage.content === 'string' ? lastMessage.content : ''
              }
            ],
            attachments: [],
            createdAt: new Date(),
          };
          
          // Save the user message with explicitly formatted parts
          const saveResult = await saveMessages([formattedMessage], address);
          
          if (saveResult === "failed") {
            throw new Error("Failed to save user message");
          }
        }
        console.log("////////////////////////////", solanaTools);
        // Generate response
        if (address) {
          const res = await generateText({
            model: myProvider.languageModel("chat-model"),
            system:
              "You're a helpful Solana assistant that helps people carry out transactions and actions on the Solana blockchain. You can only perform actions and answer questions related to Solana.",
            messages: newMessage ? [...messages, newMessage] : messages,
            maxSteps: 5,
            experimental_generateMessageId: generateUUID,
            tools: solanaTools,
          });

          try {
            const assistantId = getTrailingMessageId({
              messages: res.response.messages.filter(
                (message) => message.role === "assistant",
              ),
            });

            if (!assistantId) {
              throw new Error("No assistant message found!");
            }

            const [, assistantMessage] = appendResponseMessages({
              messages: [lastMessage],
              responseMessages: res.response.messages,
            });

            // Create a clean message object for the assistant
            const formattedAssistantMessage = {
              id: assistantId,
              chatId: id,
              role: assistantMessage.role,
              parts: [
                {
                  type: 'text',
                  text: typeof assistantMessage.content === 'string' ? assistantMessage.content : ''
                }
              ],
              attachments: [],
              createdAt: new Date(),
            };

            const saveRes = await saveMessages([formattedAssistantMessage], address);

            if (saveRes === "failed") {
              throw new Error("Failed to save chat");
            }

            // Update the UI with the assistant's response
            setMessages((currentMessages) => [
              ...currentMessages,
              {
                content: assistantMessage.content,
                id: assistantMessage.id,
                parts: assistantMessage.parts || [{ type: 'text', text: assistantMessage.content }],
                role: "assistant",
              },
            ]);

            setStatus("ready");
          } catch (e) {
            console.error("Failed to save chat:", e);
            setStatus("error");
            setError("Failed to save response. Please try again.");
          }
        }
      } catch (err) {
        setStatus("error");
        console.error("Error in chat:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while processing your request",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [id, messages, solanaTools, address, connected],
  );

  // Prevent automatic message sending on first load
  useLayoutEffect(() => {
    // Only trigger auto-send when explicitly ready and there's a user message
    const lastMessage = messages[messages.length - 1];
    const shouldAutoSend = 
      lastMessage?.role === "user" && 
      status === "ready" && 
      !isLoading && 
      // Prevent sending on initial load
      initialFetchDone.current;
      
    if (shouldAutoSend) {
      sendMessage();
    }
  }, [messages, status, isLoading, sendMessage]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      const messageContent = input;
      if (!messageContent) {
        setError("Message cannot be empty");
        return;
      }
      const newMessage: Message = {
        id: generateUUID(),
        content: messageContent,
        role: "user",
        parts: [{ type: "text" as const, text: messageContent }],
      };
      sendMessage(newMessage);
      e?.currentTarget.reset();
    },
    [sendMessage, input],
  );

  const deleteChat = useCallback(async () => {
    if (!connected || !address) {
      setError("You must be connected to your wallet to delete chats");
      return false;
    }

    try {
      const chat = await fetchChat(id, address);

      if (!chat) {
        setError("Chat not found");
        return false;
      }

      const success = await deleteChatAPI(id, address);
      return success;
    } catch (err) {
      console.error("Error deleting chat:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting the chat",
      );
      return false;
    }
  }, [id, address, connected]);

  return {
    messages,
    isLoading,
    error,
    setMessages,
    sendMessage,
    deleteChat,
    append,
    handleSubmit,
    reload,
    stop,
    input,
    setInput,
    status,
    setError,
  };
}
