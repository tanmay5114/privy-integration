import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import WalletDrawer from '../components/WalletDrawer';

const TOKEN_DATA = [
  {
    name: 'Send',
    balance: '98,989.318823 SEND',
    bg: '#3B82F6',
  },
  {
    name: 'Solana',
    balance: '3.936139534 SOL',
    bg: '#000',
  },
];

const SwapScreen: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [walletDrawerVisible, setWalletDrawerVisible] = useState(false);

  // Keypad handler
  const handleKeyPress = (val: string) => {
    if (val === 'CLEAR') setAmount('');
    else if (val === 'MAX') setAmount('98989.318823');
    else if (val === '75%') setAmount((98989.318823 * 0.75).toFixed(6));
    else if (val === '50%') setAmount((98989.318823 * 0.5).toFixed(6));
    else if (val === 'DEL') setAmount(amount.slice(0, -1));
    else setAmount(amount + val);
  };

  return (
    <ImageBackground source={require('../assets/images/new_dashboard_bg.png')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <AppHeader onUserPress={() => setWalletDrawerVisible(true)} />
        <WalletDrawer visible={walletDrawerVisible} onClose={() => setWalletDrawerVisible(false)} />
        {/* Top Token Card */}
        <View style={styles.tokenCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tokenName}>Send <Text style={{ fontSize: 18 }}>›</Text></Text>
            <Text style={styles.tokenBalance}>98,989.318823 SEND</Text>
          </View>
        </View>

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
        <TouchableOpacity style={styles.swapButton}>
          <Ionicons name="swap-vertical" size={28} color="#3ED2C3" />
        </TouchableOpacity>

        {/* Bottom Token Card */}
        <View style={styles.tokenCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tokenName}>Solana <Text style={{ fontSize: 18 }}>›</Text></Text>
            <Text style={styles.tokenBalance}>3.936139534 SOL</Text>
          </View>
        </View>

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
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    padding: 16,
    paddingTop: 25,
    backgroundColor: 'rgba(16, 20, 26, 0.85)',
    justifyContent: 'flex-start',
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
});

export default SwapScreen; 