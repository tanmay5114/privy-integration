import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, TextInput, Image, Modal, FlatList, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '@/walletProviders';
import { Transaction, VersionedTransaction } from '@solana/web3.js'; // Import for Solana Transaction
import { Buffer } from 'buffer'; // Import Buffer for base64 operations
import AppHeader from '../components/AppHeader';
import WalletDrawer from '../components/WalletDrawer';
import { JupiterService } from '../../server/services/jupiterService';
import SwapLoadingScreen from '../components/SwapLoadingScreen'; // Import the new loading screen

const SwapScreen: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [walletDrawerVisible, setWalletDrawerVisible] = useState(false);
  
  // Privy Solana Wallets
  const { wallet, connected , signTransaction , address} = useWallet();

  // State for tokens
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [inputToken, setInputToken] = useState<any>(null); // Initialize as null
  const [outputToken, setOutputToken] = useState<any>(null); // Initialize as null
  const [isTokenListLoading, setIsTokenListLoading] = useState(true);
  const [tokenListError, setTokenListError] = useState<string | null>(null);

  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tokenSelectionFor, setTokenSelectionFor] = useState<'input' | 'output' | null>(null);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false); // New state for swap execution

  useEffect(() => {
    const setupTokens = () => {
      setIsTokenListLoading(true);
      setTokenListError(null);

      // Check if the wallet address is a valid one before setting tokens
      if (!address || address.length < 32) {
        setTokenListError("Wallet address not set or invalid. Please connect your wallet or update placeholder.");
        setIsTokenListLoading(false);
        setInputToken(null);
        setOutputToken(null);
        setAvailableTokens([]);
        return;
      }

      // Define local default tokens
      const solMintAddress = 'So11111111111111111111111111111111111111112';
      const defaultSolToken = {
        name: 'Solana',
        mintAddress: solMintAddress,
        balance: '0.00 SOL', // Placeholder balance
        decimals: 9, // Solana has 9 decimals
        // TODO: Add other necessary fields like logoURI if your components use them
      };

      const defaultSendToken = {
        name: 'Send',
        mintAddress: 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa',
        balance: '0.00 SEND', // Placeholder balance
        decimals: 6, // Using 6 as per original defaultSendToken definition (line 49)
      };

      setInputToken(defaultSendToken);
      setOutputToken(defaultSolToken);

      const localTokens = [defaultSendToken, defaultSolToken];
      // Ensure unique by mintAddress, though for these two specific distinct tokens it's not strictly necessary.
      const uniqueLocalTokens = localTokens.filter((value, index, self) =>
          index === self.findIndex((t) => (t.mintAddress === value.mintAddress))
      );
      setAvailableTokens(uniqueLocalTokens);

      setIsTokenListLoading(false); // Tokens are set, loading is finished
    };

    setupTokens();
  }, [address]); // Re-run if the address changes

  // Keypad handler
  const handleKeyPress = (val: string) => {
    if (val === 'CLEAR') setAmount('');
    else if (val === 'MAX' && inputToken && inputToken.balance) setAmount(inputToken.balance.split(' ')[0]);
    else if (val === '75%' && inputToken && inputToken.balance) setAmount((parseFloat(inputToken.balance.split(' ')[0]) * 0.75).toFixed(6));
    else if (val === '50%' && inputToken && inputToken.balance) setAmount((parseFloat(inputToken.balance.split(' ')[0]) * 0.5).toFixed(6));
    else if (val === 'DEL') setAmount(amount.slice(0, -1));
    else setAmount(amount + val);
  };

  const handleGetQuote = async () => {
    if (!inputToken || !outputToken) {
      setError("Please select input and output tokens.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (inputToken.name === outputToken.name) {
      setError("Input and output tokens cannot be the same.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSwapQuote(null);
    try {
      // Use actual mint addresses from token data
      if (!inputToken.mintAddress || !outputToken.mintAddress) {
        setError("Selected tokens are missing mint addresses. Please ensure tokens have valid mint addresses.");
        setIsLoading(false);
        return;
      }
      if (!inputToken.hasOwnProperty('decimals')) { // Check if decimals property exists
        setError(`Decimals not defined for input token ${inputToken.name}.`);
        setIsLoading(false);
        return;
      }

      const inputMint = inputToken.mintAddress;
      const outputMint = outputToken.mintAddress;
      const amountInSmallestUnit = parseFloat(amount) * Math.pow(10, inputToken.decimals);
      
      const order = await JupiterService.getSwapOrder(
        inputMint,
        outputMint,
        amountInSmallestUnit, // Send amount in smallest unit
        address!
      );
      console.log('Jupiter Service Swap Order:', order);
      setSwapQuote(order);
    } catch (e: any) {
      setError(e.message || "Failed to get swap quote.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    if (!wallet || !connected) {
      setError("Wallet not connected or not ready. Please connect your wallet.");
      return;
    }

    if (!swapQuote || !swapQuote.order || !swapQuote.order.requestId || !swapQuote.order.transaction) {
      setError("No valid quote available to execute, or quote is missing transaction details.");
      return;
    }
    setIsExecutingSwap(true);
    setError(null);
    try {
      // --- Wallet Integration Point: Start ---
      const unsignedTransactionBase64 = swapQuote.order.transaction;
      let transaction: VersionedTransaction;
      try {
        const transactionBuffer = Buffer.from(unsignedTransactionBase64, 'base64');
        transaction = VersionedTransaction.deserialize(new Uint8Array(transactionBuffer));
      } catch (e: any) {
        console.error("Failed to deserialize transaction:", e);
        setError(`Failed to prepare transaction for signing: ${e.message}`);
        setIsExecutingSwap(false);
        return;
      }

      let signedTxObject: Transaction | VersionedTransaction;
      try {
        signedTxObject = await signTransaction!(transaction);
      } catch (e: any) {
        console.error("Transaction signing failed or was rejected:", e);
        setError(`Transaction signing failed: ${e.message}`);
        setIsExecutingSwap(false);
        return;
      }
      
      let signedTransactionBase64: string;
      try {
        const serializedSignedTx = signedTxObject.serialize();
        signedTransactionBase64 = Buffer.from(serializedSignedTx).toString('base64');
      } catch (e: any) {
        console.error("Failed to serialize signed transaction:", e);
        setError(`Failed to prepare signed transaction for execution: ${e.message}`);
        setIsExecutingSwap(false);
        return;
      }

      if (!signedTransactionBase64) {
        setError("Transaction signing was cancelled or failed.");
        setIsExecutingSwap(false);
        return;
      }
      
      const result = await JupiterService.executeSwapOrder(
        signedTransactionBase64,
        swapQuote.order.requestId
      );
      console.log("Swap executed:", result);
      
      // Swap successful actions:
      setAmount(''); 
      setSwapQuote(null);
      setError(null);
      Alert.alert("Success", "Swap completed successfully!");

    } catch (e: any) {
      setError(e.message || "Failed to execute swap.");
    } finally {
      setIsExecutingSwap(false);
    }
  };

  const openTokenModal = (selectionType: 'input' | 'output') => {
    setTokenSelectionFor(selectionType);
    setIsModalVisible(true);
    setError(null); // Clear previous error
  };

  const handleTokenSelect = (selectedToken: any) => {
    if (tokenSelectionFor === 'input') {
      if (outputToken.name === selectedToken.name) { // If selected input is same as current output
        setOutputToken(inputToken); // Swap them
      }
      setInputToken(selectedToken);
    } else if (tokenSelectionFor === 'output') {
      if (inputToken.name === selectedToken.name) { // If selected output is same as current input
        setInputToken(outputToken); // Swap them
      }
      setOutputToken(selectedToken);
    }
    setIsModalVisible(false);
    setTokenSelectionFor(null);
    setSwapQuote(null); // Clear previous quote as tokens changed
    setError(null); // Clear previous error
  };

  if (isExecutingSwap) {
    return <SwapLoadingScreen />;
  }

  return (
    <ImageBackground source={require('../assets/images/new_dashboard_bg.png')} style={styles.container} resizeMode="cover">
      <ScrollView style={styles.overlay} contentContainerStyle={styles.scrollContentContainer}>
        <AppHeader onUserPress={() => setWalletDrawerVisible(true)} />
        <WalletDrawer visible={walletDrawerVisible} onClose={() => setWalletDrawerVisible(false)} />
        
        {isTokenListLoading && <Text style={styles.loadingText}>Loading tokens...</Text>}
        {tokenListError && <Text style={styles.errorText}>{tokenListError}</Text>}

        {/* Top Token Card - Pressable */}
        <TouchableOpacity onPress={() => openTokenModal('input')} style={styles.tokenCard} disabled={isTokenListLoading || !availableTokens.length}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tokenNameText}>Pay with:</Text>
            {inputToken ? (
              <>
                <Text style={styles.tokenSelectText}>{inputToken.name} <Text style={{ fontSize: 18 }}>›</Text></Text>
                <Text style={styles.tokenBalanceText}>Balance: {inputToken.balance ? inputToken.balance.split(' ')[0] : 'N/A'}</Text>
              </>
            ) : (
              <Text style={styles.tokenSelectText}>Select Token <Text style={{ fontSize: 18 }}>›</Text></Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Amount Input */}
        <View style={styles.amountInputSection}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor="#4B5563"
            keyboardType="numeric"
            textAlign="center"
            maxLength={12}
          />
          <Text style={styles.amountUSD}>$0.00</Text>
        </View>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapButton} onPress={handleGetQuote} disabled={isLoading}>
          <Ionicons name="swap-vertical" size={28} color="#3ED2C3" />
        </TouchableOpacity>

        {/* Bottom Token Card - Pressable */}
        <TouchableOpacity onPress={() => openTokenModal('output')} style={styles.tokenCard} disabled={isTokenListLoading || !availableTokens.length}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tokenNameText}>Receive:</Text>
            {outputToken ? (
              <>
                <Text style={styles.tokenSelectText}>{outputToken.name} <Text style={{ fontSize: 18 }}>›</Text></Text>
                <Text style={styles.tokenBalanceText}>Balance: {outputToken.balance ? outputToken.balance.split(' ')[0] : 'N/A'}</Text>
              </>
            ) : (
              <Text style={styles.tokenSelectText}>Select Token <Text style={{ fontSize: 18 }}>›</Text></Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Display Error and Loading States */}
        {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Display Swap Quote Details (Placeholder) */}
        {swapQuote && swapQuote.order && (
          <View style={styles.quoteDetailsContainer}>
            <Text style={styles.quoteTitle}>Review Swap</Text>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>You pay:</Text>
              <Text style={styles.quoteValue}>{amount} {inputToken.name}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>You receive (approx.):</Text>
              <Text style={styles.quoteValue}>{swapQuote.order.outAmount / Math.pow(10, outputToken?.decimals || 0) } {outputToken.name}</Text>
            </View>
            {/* TODO: Inspect swapQuote.order object and add more relevant details from Jupiter API */}
            {/* e.g., Price Impact, Fees. Make sure to access them via swapQuote.order.priceImpactPct etc. */}
            <TouchableOpacity style={styles.confirmButton} onPress={handleExecuteSwap} disabled={isLoading}>
              <Text style={styles.confirmButtonText}>Confirm Swap</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Keypad */}
        <View style={styles.keypadContainer}>
          <Text style={styles.keypadLabel}>Enter amount</Text>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadAction} onPress={() => handleKeyPress('MAX')}><Text style={styles.keypadActionText}>MAX</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('1')}><Text style={styles.keypadNumText}>1</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('2')}><Text style={styles.keypadNumText}>2</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('3')}><Text style={styles.keypadNumText}>3</Text></TouchableOpacity>
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadAction} onPress={() => handleKeyPress('75%')}><Text style={styles.keypadActionText}>75%</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('4')}><Text style={styles.keypadNumText}>4</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('5')}><Text style={styles.keypadNumText}>5</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('6')}><Text style={styles.keypadNumText}>6</Text></TouchableOpacity>
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadAction} onPress={() => handleKeyPress('50%')}><Text style={styles.keypadActionText}>50%</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('7')}><Text style={styles.keypadNumText}>7</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('8')}><Text style={styles.keypadNumText}>8</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('9')}><Text style={styles.keypadNumText}>9</Text></TouchableOpacity>
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadAction} onPress={() => handleKeyPress('CLEAR')}><Text style={[styles.keypadActionText, { opacity: 0.5 }]}>CLEAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('.')}><Text style={styles.keypadNumText}>.</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('0')}><Text style={styles.keypadNumText}>0</Text></TouchableOpacity>
            <TouchableOpacity style={styles.keypadNum} onPress={() => handleKeyPress('DEL')}><Ionicons name="backspace-outline" size={22} color="#3ED2C3" /></TouchableOpacity>
          </View>
        </View>

        {/* Token Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => {
            setIsModalVisible(!isModalVisible);
            setTokenSelectionFor(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Select Token</Text>
              <FlatList
                data={availableTokens}
                keyExtractor={(item) => item.mintAddress || item.name}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalTokenItem}
                    onPress={() => handleTokenSelect(item)}
                  >
                    <Text style={styles.modalTokenName}>{item.name}</Text>
                    <Text style={styles.modalTokenBalance}>{item.balance}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setIsModalVisible(!isModalVisible);
                  setTokenSelectionFor(null);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 26, 0.85)',
  },
  scrollContentContainer: {
    padding: 16,
    paddingTop: 25,
    flexGrow: 1,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10151A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  tokenIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#232B36',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tokenEmoji: {
    fontSize: 24,
  },
  tokenName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
    // TODO: Add onPress handler to allow token selection (e.g., open a modal)
  },
  tokenNameText: { // New style for "Pay with:" / "Receive:"
    color: '#A1A1AA',
    fontSize: 12,
    marginBottom: 2,
  },
  tokenSelectText: { // New style for the selectable token name
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20, // Made larger
    marginBottom: 2,
  },
  tokenBalanceText: { // New style for balance text in card
    color: '#A1A1AA',
    fontSize: 13,
  },
  tokenBalance: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  amountInputSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  amountInput: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '600',
    width: '100%',
    backgroundColor: 'transparent',
  },
  amountUSD: {
    color: '#A1A1AA',
    fontSize: 18,
    marginTop: -8,
    marginBottom: 8,
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: '#181F29',
    borderRadius: 20,
    padding: 8,
    marginVertical: 2,
    marginBottom: 2,
    zIndex: 2,
  },
  keypadContainer: {
    backgroundColor: '#232B36',
    borderRadius: 18,
    marginTop: 36,
    padding: 12,
    alignItems: 'center',
  },
  keypadLabel: {
    color: '#A1A1AA',
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  keypadAction: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#1A2A28',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  keypadActionText: {
    color: '#3ED2C3',
    fontWeight: 'bold',
    fontSize: 16,
  },
  keypadNum: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'transparent',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  keypadNumText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
  },
  loadingText: { // Style for loading text
    color: '#3ED2C3',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
  errorText: { // Style for error text
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
  quoteDetailsContainer: { // Style for quote details
    backgroundColor: '#181F29',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  quoteTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10, // Increased margin
    textAlign: 'center', // Center title
  },
  quoteText: {
    color: '#A1A1AA',
    fontSize: 14,
    marginBottom: 3,
  },
  quoteRow: { // Style for quote detail row
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  quoteLabel: { // Style for quote detail label
    color: '#A1A1AA',
    fontSize: 14,
  },
  quoteValue: { // Style for quote detail value
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#3ED2C3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#10151A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Styles for Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '80%',
    backgroundColor: '#181F29',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  modalTokenItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#232B36',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTokenName: {
    fontSize: 18,
    color: '#fff',
  },
  modalTokenBalance: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  closeButton: {
    backgroundColor: '#3ED2C3',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: '#10151A',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default SwapScreen; 