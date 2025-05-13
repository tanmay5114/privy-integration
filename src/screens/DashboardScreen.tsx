import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground, Modal, Text, TouchableOpacity, Share, Platform, TextInput, ActivityIndicator, FlatList } from 'react-native';
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

const DashboardScreen: React.FC = () => {
  const [walletDrawerVisible, setWalletDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [historyVisible, setHistoryVisible] = useState(false);
  const { address: walletAddress } = useWallet();
  const { assets, transactions, loading, error, refreshData, getAssetDetails } = useWalletData();

  // Send screen state
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [selectedToken, setSelectedToken] = useState<WalletAsset | null>(null);

  const [fabMenuOpen, setFabMenuOpen] = useState(false);

  const handleSend = () => {
    setActiveTab('send');
    setModalVisible(true);
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

  // Update keypad logic to use actual balance
  const handleKeypad = (val: string) => {
    if (!selectedToken) return;
    
    const balance = parseFloat(selectedToken.balance);
    if (val === 'CLEAR') setSendAmount('');
    else if (val === 'DEL') setSendAmount(sendAmount.slice(0, -1));
    else if (val === 'MAX') setSendAmount(balance.toString());
    else if (val === '75%') setSendAmount((balance * 0.75).toFixed(6));
    else if (val === '50%') setSendAmount((balance * 0.5).toFixed(6));
    else setSendAmount(sendAmount + val);
  };

  const handleTokenSend = (token: WalletAsset) => {
    setSelectedToken(token);
    setTokenModalVisible(false);
    setTimeout(() => {
      setFabMenuOpen(true);
      setTimeout(() => {
        handleSend();
        setFabMenuOpen(false);
      }, 200);
    }, 200);
  };

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

  // FlatList data: tokens array, TokenList will be rendered as part of ListHeaderComponent
  const tokens = assets?.tokens || [];

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
              <HoldingsCard assets={tokens} totalUsdValue={assets?.totalUsdValue || 0} />
              <View style={{ marginTop: 8 }}>
                <TokenList 
                  tokens={tokens} 
                  onTokenPress={token => { 
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
              {activeTab === 'send' ? (
                <>
                  <Text style={modalStyles.sendLabel}>SEND {selectedToken?.symbol}</Text>
                  <Text style={modalStyles.sendAmount}>{sendAmount || '0'}</Text>
                  <Text style={modalStyles.sendUsd}>
                    ${((parseFloat(sendAmount) || 0) * (selectedToken?.price ?? 0)).toFixed(2)}
                  </Text>
                  {/* Token Card */}
                  <View style={modalStyles.tokenCard}>
                    <View style={modalStyles.tokenIconCircle}>
                      <Text style={{ fontSize: 22 }}>🟦</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.tokenName}>
                        {selectedToken?.name} <Text style={{ fontSize: 18 }}>›</Text>
                      </Text>
                      <Text style={modalStyles.tokenBalance}>
                        {selectedToken?.balance} {selectedToken?.symbol}
                      </Text>
                    </View>
                  </View>
                  {/* Recipient Input */}
                  <View style={modalStyles.recipientRow}>
                    <Text style={modalStyles.recipientLabel}>To:</Text>
                    <TextInput
                      style={modalStyles.recipientInput}
                      placeholder="Enter address..."
                      placeholderTextColor="#aaa"
                      value={recipient}
                      onChangeText={setRecipient}
                    />
                    <TouchableOpacity style={modalStyles.pasteButton} onPress={() => Clipboard.getStringAsync().then(setRecipient)}>
                      <Text style={modalStyles.pasteText}>Paste</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={modalStyles.iconButton}><Text style={{ fontSize: 18 }}>🔗</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.iconButton}><Text style={{ fontSize: 18 }}>@</Text></TouchableOpacity>
                  </View>
                  {/* Enter Amount Button */}
                  <TouchableOpacity style={modalStyles.enterAmountButton} disabled={true}>
                    <Text style={modalStyles.enterAmountText}>Enter amount</Text>
                  </TouchableOpacity>
                  {/* Keypad */}
                  <View style={modalStyles.keypadRow}>
                    <TouchableOpacity style={modalStyles.keypadAction} onPress={() => handleKeypad('MAX')}><Text style={modalStyles.keypadActionText}>MAX</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('1')}><Text style={modalStyles.keypadNumText}>1</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('2')}><Text style={modalStyles.keypadNumText}>2</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('3')}><Text style={modalStyles.keypadNumText}>3</Text></TouchableOpacity>
                  </View>
                  <View style={modalStyles.keypadRow}>
                    <TouchableOpacity style={modalStyles.keypadAction} onPress={() => handleKeypad('75%')}><Text style={modalStyles.keypadActionText}>75%</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('4')}><Text style={modalStyles.keypadNumText}>4</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('5')}><Text style={modalStyles.keypadNumText}>5</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('6')}><Text style={modalStyles.keypadNumText}>6</Text></TouchableOpacity>
                  </View>
                  <View style={modalStyles.keypadRow}>
                    <TouchableOpacity style={modalStyles.keypadAction} onPress={() => handleKeypad('50%')}><Text style={modalStyles.keypadActionText}>50%</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('7')}><Text style={modalStyles.keypadNumText}>7</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('8')}><Text style={modalStyles.keypadNumText}>8</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('9')}><Text style={modalStyles.keypadNumText}>9</Text></TouchableOpacity>
                  </View>
                  <View style={modalStyles.keypadRow}>
                    <TouchableOpacity style={modalStyles.keypadAction} onPress={() => handleKeypad('CLEAR')}><Text style={[modalStyles.keypadActionText, { opacity: 0.5 }]}>CLEAR</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('.')}><Text style={modalStyles.keypadNumText}>.</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('0')}><Text style={modalStyles.keypadNumText}>0</Text></TouchableOpacity>
                    <TouchableOpacity style={modalStyles.keypadNum} onPress={() => handleKeypad('DEL')}><Text style={modalStyles.keypadNumText}>⌫</Text></TouchableOpacity>
                  </View>
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
              <TouchableOpacity style={modalStyles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={{fontSize: 24, color: '#fff'}}>×</Text>
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
    backgroundColor: 'rgba(16, 20, 26, 0.85)', // Optional: dark overlay for readability
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
  addressLabel: {
    marginTop: 18,
    color: '#aaa',
    fontSize: 14,
  },
  address: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
  },
  warning: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    width: '100%',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: '#232B36',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  sendLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sendAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 8,
  },
  sendUsd: {
    color: '#aaa',
    fontSize: 14,
  },
  tokenCard: {
    backgroundColor: '#181F29',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIconCircle: {
    backgroundColor: '#232B36',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recipientLabel: {
    color: '#aaa',
    fontSize: 14,
    marginRight: 8,
  },
  recipientInput: {
    flex: 1,
    padding: 12,
    backgroundColor: '#181F29',
    borderRadius: 10,
    color: '#fff',
  },
  pasteButton: {
    padding: 8,
    backgroundColor: '#232B36',
    borderRadius: 10,
    marginLeft: 8,
  },
  pasteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  iconButton: {
    padding: 8,
  },
  enterAmountButton: {
    backgroundColor: '#232B36',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  enterAmountText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  keypadAction: {
    flex: 1,
    padding: 12,
    backgroundColor: '#232B36',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  keypadActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  keypadNum: {
    flex: 1,
    padding: 12,
    backgroundColor: '#181F29',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  keypadNumText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DashboardScreen; 