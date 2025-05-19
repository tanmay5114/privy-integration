import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ImageBackground, Modal, Text, TouchableOpacity, Share, Platform, TextInput, ActivityIndicator, FlatList, Image, Alert } from 'react-native';
import NetWorthCard from '../components/NetWorthCard';
import HoldingsCard from '../components/HoldingsCard';
import TokenList from '../components/TokenList';
import FloatingButton from '../components/FloatingButton';
import AppHeader from '../components/AppHeader';
import WalletDrawer from '../components/WalletDrawer';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import TokenDetailModal from '../components/TokenDetailModal';
import COLORS from 'src/assets/colors';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useWallet } from '../walletProviders/hooks/useWallet';
import { useWalletData } from '../hooks/useWalletData';
import { WalletAsset } from '../services/api';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import SwapLoadingScreen from '../components/SwapLoadingScreen';

const DashboardScreen: React.FC = () => {
  console.log('--- DASHBOARD SCREEN RENDERING --- Re-adding Send Logic State ---');
  const [walletDrawerVisible, setWalletDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [historyVisible, setHistoryVisible] = useState(false);
  const { address: walletAddress, ...privyWalletObject } = useWallet();
  const { assets, transactions, loading, error, refreshData, getAssetDetails } = useWalletData();

  // Send screen state
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [selectedToken, setSelectedToken] = useState<WalletAsset | null>(null);
  const [showTokenPickerForSend, setShowTokenPickerForSend] = useState(false);

  const [fabMenuOpen, setFabMenuOpen] = useState(false);

  // State for send process (re-added)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [transferInstructions, setTransferInstructions] = useState<any>(null); // We might not set this, but good to have if needed

  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);

  const handleSend = () => {
    console.log('[handleSend] Called. Current modalVisible state:', modalVisible);
    setActiveTab('send');
    setSendError(null); // Clear previous errors when opening modal

    // Default token selection logic
    if (!selectedToken && displayTokens.length > 0) {
      const defaultToken = displayTokens.find(t => t.mint === SOL_MINT_ADDRESS) || displayTokens[0];
      if (defaultToken) {
        setSelectedToken(defaultToken);
        // setSendAmount(''); // Don't reset amount here, might be reopening
        console.log('[handleSend] Default token set:', defaultToken.symbol);
      }
    }
    setModalVisible(true);
    console.log('[handleSend] setModalVisible(true) called. New modalVisible state should reflect soon.');
  };
  const handleReceive = () => {
    setActiveTab('receive');
    setModalVisible(true);
  };
  const handleCopy = () => {
    if (walletAddress) Clipboard.setStringAsync(walletAddress);
  };
  const handleShare = () => {
    if (walletAddress) Share.share({ message: walletAddress });
  };

  const handleKeypad = (val: string) => {
    console.log('[handleKeypad] Called with value:', val);
    if (!selectedToken) {
      console.log('[handleKeypad] No selectedToken, returning.');
      return;
    }
    
    const balance = parseFloat(selectedToken.balance);
    if (val === 'CLEAR') setSendAmount('');
    else if (val === 'DEL') setSendAmount(sendAmount.slice(0, -1));
    else if (val === 'MAX') setSendAmount(balance.toString());
    else if (val === '75%') setSendAmount((balance * 0.75).toFixed(6));
    else if (val === '50%') setSendAmount((balance * 0.5).toFixed(6));
    else setSendAmount(sendAmount + val);
  };

  const handleTokenSend = (token: WalletAsset) => {
    console.log('[handleTokenSend] Called with token:', token, 'Closing token detail modal.');
    setSelectedToken(token);
    setTokenModalVisible(false);
    console.log('[handleTokenSend] Starting first setTimeout to open FAB menu.');
    setTimeout(() => {
      console.log('[handleTokenSend] Inside first setTimeout. Setting fabMenuOpen to true.');
      setFabMenuOpen(true);
      console.log('[handleTokenSend] Starting second setTimeout to call handleSend and close FAB menu.');
      setTimeout(() => {
        console.log('[handleTokenSend] Inside second setTimeout. Calling handleSend().');
        handleSend();
        console.log('[handleTokenSend] Back from handleSend(). Setting fabMenuOpen to false.');
        setFabMenuOpen(false);
      }, 200);
    }, 200);
  };

  // Function to get transfer instructions (re-added)
  const getTransferInstructions = async () => {
    if (!walletAddress || !recipient || !sendAmount || !selectedToken) {
      setSendError('Missing required fields for transfer.');
      return null;
    }
    setSendError(null);
    setIsSubmitting(true);

    try {
      const apiBaseUrl = 'https://aurumai-production.up.railway.app';
      const apiUrl = `${apiBaseUrl}/api/wallet/${walletAddress}/transfer/instructions`;
      
      // Corrected: Use selectedToken.type to determine if it's native SOL
      const payloadTokenMint = selectedToken.type === 'native' ? undefined : selectedToken.mint;
      
      console.log('Fetching transfer instructions with:', {
        apiUrl,
        walletAddress,
        recipient,
        amount: parseFloat(sendAmount),
        tokenMint: payloadTokenMint, 
      });
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress: recipient,
          amount: parseFloat(sendAmount),
          tokenMint: payloadTokenMint,
        }),
      });

      const responseBody = await response.text(); // Get raw response body for logging
      console.log('Raw response from /transfer/instructions:', responseBody);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseBody); // Try to parse as JSON
        } catch (e) {
          errorData = { message: `Server responded with ${response.status}: ${responseBody}` };
        }
        console.error('Error fetching transfer instructions:', errorData);
        setSendError(errorData.message || `Failed to get transfer instructions. Status: ${response.status}`);
        return null;
      }
      
      const data = JSON.parse(responseBody); // Parse successful response
      // setTransferInstructions(data); // We might not need to store all instructions in state
      return data; // Return the instructions directly
    } catch (e:any) {
      console.error('Catch block: Error getting transfer instructions:', e);
      setSendError(e.message || 'Could not fetch transfer instructions due to a network or unexpected error.');
      return null;
    } finally {
      setIsSubmitting(false); // Set submitting false after attempt
    }
  };

  // Helper to wait for transaction confirmation
  async function waitForConfirmation(signature: string, connection: Connection, maxTries = 30): Promise<boolean> {
    let tries = 0;
    while (tries < maxTries) {
      const result = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
      if (result && result.value && (result.value.confirmationStatus === 'confirmed' || result.value.confirmationStatus === 'finalized')) {
        return true;
      }
      await new Promise(res => setTimeout(res, 1000)); // Wait 1 second
      tries++;
    }
    return false;
  }

  // Function to handle the send action (re-added)
  const handleSendAction = async () => {
    setSendError(null); // Clear previous error

    if (!walletAddress || !recipient || !sendAmount || !selectedToken) {
      setSendError('Please fill in all required fields and select a token.');
      return;
    }

    // Restored: Access Privy wallet instance correctly
    let privyWalletToUse = null;
    if (privyWalletObject && typeof privyWalletObject.signTransaction === 'function') {
      privyWalletToUse = privyWalletObject;
    } else if (privyWalletObject && (privyWalletObject as any).wallet && typeof (privyWalletObject as any).wallet.signTransaction === 'function') {
      privyWalletToUse = (privyWalletObject as any).wallet;
    } else if (privyWalletObject && (privyWalletObject as any).signTransaction) { // Added for cases where it might be directly on a different property
        privyWalletToUse = (privyWalletObject as any);
    }

    if (!privyWalletToUse) {
      setSendError('Wallet is not available or does not support signing. Is your wallet connected and configured?');
      console.error('Privy wallet or signTransaction method from useWallet is undefined or not ready.', privyWalletObject);
      return;
    }

    setIsSubmitting(true); 

    try {
      const instructionData = await getTransferInstructions(); 

      if (!instructionData || !instructionData.instructions || instructionData.instructions.length === 0) {
        if (!sendError) { 
          setSendError('Failed to retrieve valid transfer instructions from the server.');
        }
        setIsSubmitting(false);
        return;
      }

      const rpcUrl = process.env.REACT_APP_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(rpcUrl, 'confirmed'); 

      const mappedInstructions = instructionData.instructions.map((instr: any) => {
        if (!instr.programId || !instr.keys || !instr.data) {
          throw new Error('Invalid instruction structure from backend.');
        }
        return new TransactionInstruction({
          programId: new PublicKey(instr.programId),
          keys: instr.keys.map((keyMeta: any) => ({
            pubkey: new PublicKey(keyMeta.pubkey),
            isSigner: keyMeta.isSigner,
            isWritable: keyMeta.isWritable,
          })),
          data: Buffer.from(instr.data, 'base64'),
        });
      });

      const transaction = new Transaction();
      transaction.add(...mappedInstructions);

      if (instructionData.feePayer) {
        transaction.feePayer = new PublicKey(instructionData.feePayer);
      } else if (walletAddress) {
        transaction.feePayer = new PublicKey(walletAddress);
      } else {
        setSendError('Fee payer (wallet address) is not available.');
        setIsSubmitting(false);
        return;
      }

      if (instructionData.recentBlockhash) {
        transaction.recentBlockhash = instructionData.recentBlockhash;
      } else {
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
      }
      
      if (!transaction.recentBlockhash || !transaction.feePayer) {
        throw new Error("Transaction recentBlockhash or feePayer is missing before signing.");
      }

      // Restored: Sign transaction with Privy
      console.log('Attempting to sign transaction with Privy wallet:', privyWalletToUse);
      const signedTransaction = await privyWalletToUse.signTransaction(transaction);
      console.log('Transaction signed by Privy wallet:', signedTransaction);
      console.log('Signatures on signedTransaction object:', signedTransaction.signatures); // <--- ADD THIS LOG
      

      // Restored: Serialize and send to backend
      // Simplify serialization: if Privy returns a fully signed Transaction object,
      // a direct .serialize() should produce the wire format.
      const wireTransaction = signedTransaction.serialize();
      const serializedSignedTransaction = Buffer.from(wireTransaction).toString('base64');
      
      console.log('Serialized signed transaction (no options):', serializedSignedTransaction.substring(0, 50) + "...");

      const apiBaseUrl = 'https://aurumai-production.up.railway.app';
      const submitApiUrl = `${apiBaseUrl}/api/transaction/submit`;

      const submitResponse = await fetch(submitApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransaction: serializedSignedTransaction }),
      });

      const submitResponseBody = await submitResponse.text();
      if (!submitResponse.ok) {
        let errorData;
        try { errorData = JSON.parse(submitResponseBody); } catch (e) { errorData = { message: `Server responded with ${submitResponse.status}: ${submitResponseBody}` }; }
        setIsSubmitting(false);
        throw new Error(errorData.message || `Failed to submit transaction. Status: ${submitResponse.status}`);
      }
      
      const submitData = JSON.parse(submitResponseBody);
      setLastTxSignature(submitData.signature || null);
      // Wait for confirmation
      const confirmed = await waitForConfirmation(submitData.signature, connection);
      if (confirmed) {
        setShowSendConfirmation(true);
      }
      setIsSubmitting(false);

    } catch (e: any) {
      console.error('Error during send action:', e);
      let detailedError = e.message || 'An unexpected error occurred during the send process.';
      // Attempt to get more detailed logs if it's a SendTransactionError
      if (e.logs && Array.isArray(e.logs)) {
        const logsMessage = "\nSimulation Logs:\n" + e.logs.join('\n');
        console.error(logsMessage); // Log detailed logs to console
        detailedError += logsMessage;
      } else if (typeof e.getLogs === 'function') { // Some wallet adapters might have a getLogs method
        try {
          const logs = e.getLogs();
          if (logs && Array.isArray(logs)) {
            const logsMessage = "\nSimulation Logs:\n" + logs.join('\n');
            console.error(logsMessage);
            detailedError += logsMessage;
          }
        } catch (logError) {
          console.error('Failed to get logs from error object:', logError);
        }
      }
      setSendError(detailedError);
      setIsSubmitting(false);
    }
  };

  const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112';
  const SOL_IMAGE_URL = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'; // Example SOL image

  const displayTokens = useMemo(() => {
    if (!assets) return [];

    const splTokens = assets.tokens || [];
    let nativeSolPrice = 0;
    let nativeSolUsdValue = 0;

    // Attempt to get SOL price information if available (this part might need adjustment based on actual structure)
    // This assumes that if assets.nativePrice and assets.nativeUsdValue are available they will be used.
    // This might require a modification in useWalletData or api.ts to expose SOL's specific price.
    // For now, we look for a token with SOL's mint address in the priced tokens if the backend includes it there.
    // Or, we might need to access a specific field on the `assets` object itself if `useWalletData` is updated.

    // A more robust way would be if `assets` object itself carried `nativePrice` and `nativeUsdValue`
    // For demonstration, let's assume it might be part of the `tokens` if priced, or we use placeholders.
    const solTokenInfoFromList = splTokens.find(t => t.mint === SOL_MINT_ADDRESS);
    if (solTokenInfoFromList) {
        nativeSolPrice = solTokenInfoFromList.price;
        nativeSolUsdValue = solTokenInfoFromList.usdValue;
    } else if (assets.hasOwnProperty('nativePrice') && assets.hasOwnProperty('nativeUsdValue')) {
        // This is a hypothetical scenario where useWalletData is modified to add these
        // nativeSolPrice = (assets as any).nativePrice;
        // nativeSolUsdValue = (assets as any).nativeUsdValue;
        // console.log("Using direct nativePrice/nativeUsdValue from assets object if they existed.");
    }

    const solAsset: WalletAsset = {
      mint: SOL_MINT_ADDRESS,
      name: 'Solana',
      symbol: 'SOL',
      balance: assets.nativeBalance || '0',
      decimals: 9,
      price: nativeSolPrice, 
      usdValue: nativeSolUsdValue, 
      change24h: 0, 
      image: SOL_IMAGE_URL,
      type: 'native', // Corrected: Ensure SOL is typed as 'native'
    };

    // Filter out SOL from splTokens if it was accidentally included by backend in tokens list
    const filteredSplTokens = splTokens.filter(token => token.mint !== SOL_MINT_ADDRESS);

    return [solAsset, ...filteredSplTokens];
  }, [assets]);

  if (loading && !assets) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isSubmitting) {
    return <SwapLoadingScreen />;
  }

  if (showSendConfirmation) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10151A' }}>
        <Text style={{ color: '#fff', fontSize: 20, marginBottom: 20 }}>Transaction Submitted!</Text>
        <Text style={{ color: '#3ED2C3', fontSize: 16, marginBottom: 20 }}>
          Signature: {lastTxSignature ? lastTxSignature.substring(0, 10) + '...' : 'N/A'}
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#3ED2C3', padding: 16, borderRadius: 10 }}
          onPress={() => {
            setShowSendConfirmation(false);
            setModalVisible(false);
            refreshData();
            setSendAmount('');
            setRecipient('');
          }}
        >
          <Text style={{ color: '#10151A', fontWeight: 'bold', fontSize: 16 }}>OK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground source={require('../assets/images/new_dashboard_bg.png')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <AppHeader onUserPress={() => setWalletDrawerVisible(true)} onHistoryPress={() => setHistoryVisible(true)} />
        <FlatList
          data={[]}
          keyExtractor={() => 'dashboard-list'}
          ListHeaderComponent={
            <>
              <NetWorthCard totalValue={assets?.totalUsdValue || 0} />
              <HoldingsCard assets={displayTokens} totalUsdValue={assets?.totalUsdValue || 0} />
              <View style={{ marginTop: 8 }}>
                <TokenList 
                  tokens={displayTokens} 
                  onTokenPress={token => { 
                    console.log('[TokenList onTokenPress] Token:', token);
                    setSelectedToken(token); 
                    setTokenModalVisible(true); 
                  }} 
                />
              </View>
            </>
          }
          renderItem={null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        />
        <FloatingButton 
          open={fabMenuOpen}
          setOpen={setFabMenuOpen}
          onSend={handleSend}
          onReceive={handleReceive}
        />
        <WalletDrawer visible={walletDrawerVisible} onClose={() => setWalletDrawerVisible(false)} />
        <TransactionHistoryModal 
          visible={historyVisible} 
          onClose={() => setHistoryVisible(false)} 
          transactions={transactions}
        />
        <TokenDetailModal 
          visible={tokenModalVisible} 
          onClose={() => setTokenModalVisible(false)} 
          token={selectedToken}
          onRefresh={refreshData}
          onSend={handleTokenSend}
        />

        {/* Send/Receive Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={modalStyles.modalContainer}>
            <View style={modalStyles.modalContent}>
              {/* Tab Switcher */}
              <View style={modalStyles.tabRow}>
                <TouchableOpacity style={[modalStyles.tab, activeTab === 'send' && modalStyles.activeTab]} onPress={() => setActiveTab('send')}><Text style={modalStyles.tabText}>Send</Text></TouchableOpacity>
                <TouchableOpacity style={[modalStyles.tab, activeTab === 'receive' && modalStyles.activeTab]} onPress={() => setActiveTab('receive')}><Text style={modalStyles.tabText}>Receive</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={modalStyles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={{fontSize: 24, color: '#fff'}}>×</Text>
              </TouchableOpacity>

              {activeTab === 'send' ? (
                <>
                  <TouchableOpacity 
                    onPress={() => { 
                      console.log('[Send Modal Token Card] Pressed. Opening dedicated token picker.'); 
                      setShowTokenPickerForSend(true);
                    }}
                    style={modalStyles.tokenCard}
                  >
                    <View style={modalStyles.tokenIconCircle}>
                      {selectedToken?.image ? 
                        <Image source={{ uri: selectedToken.image }} style={{width: 22, height: 22, borderRadius: 11}} /> : 
                        <Text style={{ fontSize: 22 }}>💰</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.tokenName}>
                        {selectedToken?.name || 'Select Token'} <Text style={{ fontSize: 18 }}>›</Text>
                      </Text>
                      <Text style={modalStyles.tokenBalance}>
                        Balance: {selectedToken?.balance || '0'} {selectedToken?.symbol || ''}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={modalStyles.recipientRow}>
                    <Text style={modalStyles.recipientLabel}>To:</Text>
                    <TextInput
                      style={modalStyles.recipientInput}
                      placeholder="Enter address..."
                      placeholderTextColor="#aaa"
                      value={recipient}
                      onChangeText={setRecipient}
                    />
                    <TouchableOpacity 
                      style={modalStyles.pasteButton} 
                      onPress={() => Clipboard.getStringAsync().then(setRecipient)}
                    >
                      <Text style={modalStyles.pasteText}>Paste</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={modalStyles.iconButton}><Text style={{ fontSize: 18 }}>🔗</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.iconButton}><Text style={{ fontSize: 18 }}>@</Text></TouchableOpacity>
                  </View>

                  <View style={modalStyles.amountContainer}> 
                    <Text style={modalStyles.sendLabel}>Amount:</Text>
                    <Text style={modalStyles.sendAmount}>{sendAmount || '0'}</Text>
                    {selectedToken && typeof selectedToken.price === 'number' && ( 
                      <Text style={modalStyles.sendUsd}>
                        {'≈ $' + (parseFloat(sendAmount || '0') * selectedToken.price).toFixed(2)}
                      </Text>
                    )}
                  </View>
                  
                  <View style={modalStyles.keypadContainer}>
                    <View style={modalStyles.keypadRow}>
                      <TouchableOpacity
                        style={modalStyles.keypadAction}
                        onPress={() => handleKeypad('MAX')}
                        disabled={!selectedToken}
                      >
                        <Text style={modalStyles.keypadActionText}>MAX</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={modalStyles.keypadNum}
                        onPress={() => handleKeypad('1')}
                        disabled={!selectedToken}
                      >
                        <Text style={modalStyles.keypadNumText}>1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={modalStyles.keypadNum}
                        onPress={() => handleKeypad('2')}
                        disabled={!selectedToken}
                      >
                        <Text style={modalStyles.keypadNumText}>2</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={modalStyles.keypadNum}
                        onPress={() => handleKeypad('3')}
                        disabled={!selectedToken}
                      >
                        <Text style={modalStyles.keypadNumText}>3</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={modalStyles.keypadRow}>
                      <TouchableOpacity style={modalStyles.keypadAction} onPress={() => handleKeypad('75%')} disabled={!selectedToken}><Text style={modalStyles.keypadActionText}>75%</Text></TouchableOpacity>
                      <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('4')} disabled={!selectedToken}><Text style={modalStyles.keypadNumText}>4</Text></TouchableOpacity>
                      <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('5')} disabled={!selectedToken}><Text style={modalStyles.keypadNumText}>5</Text></TouchableOpacity>
                      <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('6')} disabled={!selectedToken}><Text style={modalStyles.keypadNumText}>6</Text></TouchableOpacity>
                    </View>
                    <View style={modalStyles.keypadRow}>
                      <TouchableOpacity style={modalStyles.keypadAction} onPress={() => handleKeypad('50%')} disabled={!selectedToken}><Text style={modalStyles.keypadActionText}>50%</Text></TouchableOpacity>
                      <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('7')} disabled={!selectedToken}><Text style={modalStyles.keypadNumText}>7</Text></TouchableOpacity>
                      <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('8')} disabled={!selectedToken}><Text style={modalStyles.keypadNumText}>8</Text></TouchableOpacity>
                      <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('9')} disabled={!selectedToken}><Text style={modalStyles.keypadNumText}>9</Text></TouchableOpacity>
                    </View>
                    <View style={modalStyles.keypadRow}>
                      <TouchableOpacity style={modalStyles.keypadAction} onPress={() => handleKeypad('CLEAR')} disabled={!selectedToken}><Text style={[modalStyles.keypadActionText, { opacity: 0.5 }]}>CLEAR</Text></TouchableOpacity>
                      <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('.')} disabled={!selectedToken}><Text style={modalStyles.keypadNumText}>.</Text></TouchableOpacity>
                      <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('0')} disabled={!selectedToken}><Text style={modalStyles.keypadNumText}>0</Text></TouchableOpacity>
                      <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('DEL')} disabled={!selectedToken}><Text style={modalStyles.keypadNumText}>⌫</Text></TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      modalStyles.sendButton,
                      (!recipient || !sendAmount || !selectedToken || isSubmitting) && modalStyles.sendButtonDisabled
                    ]}
                    onPress={handleSendAction}
                    disabled={!recipient || !sendAmount || !selectedToken || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={modalStyles.sendButtonText}>Send</Text>
                    )}
                  </TouchableOpacity>

                  {sendError && (
                    <View style={modalStyles.errorContainer}>
                      <Text style={modalStyles.errorText}>{sendError}</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  {walletAddress ? (
                    <QRCode value={walletAddress} size={180} />
                  ) : (
                    <Text style={{ color: '#fff', marginVertical: 24 }}>No wallet address</Text>
                  )}
                  <Text style={modalStyles.addressLabel}>Deposit address:</Text>
                  <Text style={modalStyles.address}>{walletAddress}</Text>
                  <Text style={modalStyles.warning}>
                    Deposit assets using the Solana blockchain only. Assets sent from other blockchains will be lost.
                  </Text>
                  <View style={modalStyles.buttonRow}>
                    <TouchableOpacity style={modalStyles.actionButton} onPress={handleShare}><Text style={modalStyles.actionButtonText}>Share</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.actionButton} onPress={handleCopy}><Text style={modalStyles.actionButtonText}>Copy</Text></TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* New Token Picker Modal for Send Screen */}
        <Modal
          visible={showTokenPickerForSend}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTokenPickerForSend(false)}
        >
          <View style={pickerModalStyles.modalContainer}>
            <View style={pickerModalStyles.modalContent}>
              <Text style={pickerModalStyles.title}>Select Token to Send</Text>
              <FlatList
                data={displayTokens}
                keyExtractor={(item, index) => item.mint ?? index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={pickerModalStyles.tokenItem}
                    onPress={() => {
                      setSelectedToken(item);
                      setSendAmount(''); // Reset amount when token changes
                      setShowTokenPickerForSend(false);
                    }}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={pickerModalStyles.tokenImage} />
                    ) : (
                      <View style={pickerModalStyles.tokenImagePlaceholder}><Text>💰</Text></View>
                    )}
                    <View style={pickerModalStyles.tokenInfo}>
                      <Text style={pickerModalStyles.tokenName}>{item.name} ({item.symbol})</Text>
                      <Text style={pickerModalStyles.tokenBalance}>Balance: {item.balance}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={pickerModalStyles.separator} />}
              />
              <TouchableOpacity onPress={() => setShowTokenPickerForSend(false)} style={pickerModalStyles.closeButton}>
                <Text style={pickerModalStyles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 26, 0.85)',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#10151A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    position: 'relative',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#181F29',
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#232B36',
  },
  tabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  addressLabel: { marginTop: 18, color: '#aaa', fontSize: 14 },
  address: { color: '#fff', fontSize: 16, textAlign: 'center', marginVertical: 8 },
  warning: { color: '#aaa', fontSize: 12, textAlign: 'center', marginVertical: 8 },
  buttonRow: { flexDirection: 'row', marginTop: 16, width: '100%', justifyContent: 'space-between' },
  actionButton: { flex: 1, marginHorizontal: 8, backgroundColor: '#232B36', borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  closeButton: { position: 'absolute', top: 12, right: 12, padding: 8 },
  
  sendLabel: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  sendAmount: { color: '#fff', fontSize: 36, fontWeight: '600', marginBottom: 8 },
  sendUsd: { color: '#aaa', fontSize: 14 },
  tokenCard: { backgroundColor: '#181F29', borderRadius: 12, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', width: '100%' },
  tokenIconCircle: { backgroundColor: '#232B36', borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  tokenName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tokenBalance: { color: '#aaa', fontSize: 14 },
  recipientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, width: '100%' },
  recipientLabel: { color: '#aaa', fontSize: 14, marginRight: 8 },
  recipientInput: { flex: 1, padding: 12, backgroundColor: '#181F29', borderRadius: 10, color: '#fff' },
  pasteButton: { padding: 8, backgroundColor: '#232B36', borderRadius: 10, marginLeft: 8 },
  pasteText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  iconButton: { padding: 8 },
  amountContainer: { alignItems: 'center', marginVertical: 16 },
  
  keypadContainer: { marginTop: 16, width: '100%' },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  keypadAction: {
    flex: 1, padding: 12, backgroundColor: '#232B36', borderRadius: 10, marginHorizontal: 4, alignItems: 'center'
  },
  keypadActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  keypadNum: {
    flex: 1, padding: 12, backgroundColor: '#181F29', borderRadius: 10, marginHorizontal: 4, alignItems: 'center'
  },
  keypadNumText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
    textAlign: 'center',
  },

  sendButton: {
    backgroundColor: COLORS.brandPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#232B36',
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
});

// Styles for the new Token Picker Modal
const pickerModalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end', // Appears from bottom
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#10151A', // Dark background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '70%', // Max height
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  tokenImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    backgroundColor: '#232B36',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenBalance: {
    color: '#aaa',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#232B36', // Separator color
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#232B36',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen; 