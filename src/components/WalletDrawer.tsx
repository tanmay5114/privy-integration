import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../walletProviders/hooks/useWallet';
import { useAuth } from '../walletProviders/hooks/useAuth';
import { useWalletData } from '../hooks/useWalletData';
import COLORS from '../assets/colors';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.80;
const CARD_HEIGHT = height * 0.75;

interface WalletDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const actions = [
  { label: 'Add Wallet', icon: 'wallet-outline', onPress: () => {} },
  { label: 'Explorer', icon: 'search-outline', onPress: () => {} },
];

const mockWallets = [
  {
    id: '1',
    name: 'Wallet 1',
    address: 'Aeu7...mfiX',
    balance: '$2,375.55',
    icon: 'W1',
    active: true,
    color: COLORS.brandPrimary,
    iconBg: '#6EE7E7',
  },
  {
    id: '2',
    name: 'Wallet 2',
    address: 'EGHB...4R5i',
    balance: '$0.00',
    icon: 'puzzle',
    active: false,
    color: '#FFD600',
    iconBg: '#232833',
  },
];

const WalletDrawer: React.FC<WalletDrawerProps> = ({ visible, onClose }) => {
  const { address, publicKey } = useWallet();
  const { logout } = useAuth();
  const { assets, loading: walletDataLoading, error: walletDataError } = useWalletData();
  const walletAddress = address || publicKey?.toString();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addWalletModal, setAddWalletModal] = useState(false);
  const [walletsModal, setWalletsModal] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const handleDisconnect = async () => {
    await logout();
    onClose();
  };

  const copyAddress = () => {
    if (walletAddress) {
      Clipboard.setStringAsync(walletAddress);
    }
  };

  const initials = walletAddress ? walletAddress.substring(0, 2).toUpperCase() : 'W1';
  const walletName = 'Wallet 1';

  const netWorth = useMemo(() => {
    if (walletDataLoading) return 'Loading...';
    if (walletDataError) return 'N/A';
    if (assets?.totalUsdValue === undefined || assets?.totalUsdValue === null) return '$0.00';
    return `$${assets.totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [assets, walletDataLoading, walletDataError]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backdropAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.cardInner}>
          {/* Profile Circle and Menu */}
          <View style={styles.headerRow}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitials}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.menuButton} onPress={() => setWalletsModal(true)}>
              <Ionicons name="ellipsis-horizontal" size={28} color={COLORS.brandPrimary} />
            </TouchableOpacity>
          </View>

          {/* Wallet Name, Balance, Address */}
          <Text style={styles.walletName}>{walletName}</Text>
          <Text style={styles.netWorthLabel}>Net Worth</Text>
          <Text style={styles.walletBalance}>{netWorth}</Text>
          <View style={styles.addressRow}>
            <Text style={styles.walletAddress} numberOfLines={1} ellipsizeMode="middle">
              {walletAddress ? `${walletAddress.substring(0, 4)}...${walletAddress.slice(-4)}` : 'Aeu7...mfiX'}
            </Text>
            <TouchableOpacity onPress={copyAddress} style={styles.copyButton}>
              <Ionicons name="copy-outline" size={18} color={COLORS.brandPrimary} />
            </TouchableOpacity>
          </View>

          {/* Actions List */}
          <View style={styles.actionList}>
            {actions.map((action, idx) => (
              <TouchableOpacity key={action.label} style={styles.actionRow} onPress={
                action.label === 'Add Wallet' ? () => setAddWalletModal(true) : 
                action.label === 'Explorer' ? () => {
                  if (walletAddress) {
                    Linking.openURL(`https://explorer.solana.com/address/${walletAddress}`);
                  }
                } : action.onPress
              }>
                <Ionicons name={action.icon as any} size={22} color={COLORS.darkText.primary} style={styles.actionIcon} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.actionRow} onPress={() => setSettingsOpen(v => !v)}>
              <Ionicons name="settings-outline" size={22} color={COLORS.darkText.primary} style={styles.actionIcon} />
              <Text style={styles.actionLabel}>App Settings</Text>
              <Ionicons name={settingsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.brandPrimary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {settingsOpen && (
              <View style={styles.dropdownContainer}>
                <TouchableOpacity style={styles.dropdownItem}>
                  <Text style={styles.dropdownText}>Security & Privacy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem}>
                  <Text style={styles.dropdownText}>About AurumAI</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bottom Row */}
          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.bottomButton}>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Wallets Modal */}
      <Modal
        visible={walletsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setWalletsModal(false)}
      >
        <TouchableOpacity
          style={styles.walletsOverlay}
          activeOpacity={1}
          onPress={() => setWalletsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.walletsCard}
            onPress={e => e.stopPropagation()}
          >
            <Text style={styles.walletsTitle}>Wallets</Text>
            <TouchableOpacity style={styles.walletsAddBtn}>
              <Ionicons name="add" size={28} color={COLORS.brandPrimary} />
            </TouchableOpacity>
            {mockWallets.map((w, idx) => (
              <View
                key={w.id}
                style={[styles.walletItem, w.active && styles.walletItemActive]}
              >
                <View style={[styles.walletIcon, { backgroundColor: w.iconBg }] }>
                  {w.icon === 'puzzle' ? (
                    <Ionicons name="extension-puzzle-outline" size={28} color={w.color} />
                  ) : (
                    <Text style={[styles.walletIconText, { color: w.color }]}>{w.icon}</Text>
                  )}
                </View>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletNameList}>{w.name}</Text>
                  <Text style={styles.walletAddressList}>{w.address}</Text>
                </View>
                <Text style={styles.walletBalanceList}>{w.balance}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.walletsClose} onPress={() => setWalletsModal(false)}>
              <Ionicons name="close" size={32} color={COLORS.darkText.secondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add Wallet Modal */}
      <Modal
        visible={addWalletModal}
        transparent
        animationType="fade"
        onRequestClose={() => setAddWalletModal(false)}
      >
        <View style={styles.addWalletOverlay}>
          <View style={styles.addWalletCard}>
            <Text style={styles.addWalletTitle}>Add Wallet</Text>
            <TouchableOpacity style={styles.addWalletBtn}>
              <Ionicons name="add" size={28} color={COLORS.brandPrimary} style={styles.addWalletBtnIcon} />
              <Text style={styles.addWalletBtnText}>Create Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addWalletBtn}>
              <Ionicons name="download-outline" size={28} color={COLORS.brandPrimary} style={styles.addWalletBtnIcon} />
              <Text style={styles.addWalletBtnText}>Import Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addWalletBtn}>
              <Ionicons name="scan-outline" size={28} color={COLORS.brandPrimary} style={styles.addWalletBtnIcon} />
              <Text style={styles.addWalletBtnText}>Connect Ledger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addWalletClose} onPress={() => setAddWalletModal(false)}>
              <Ionicons name="close" size={32} color={COLORS.darkText.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 20, 26, 0.85)', // match dashboard overlay
    zIndex: 1,
  },
  backdropTouchable: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    top: height * 0.12,
    alignSelf: 'center',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 28,
    backgroundColor: COLORS.darkBg.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 2,
  },
  cardInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 20,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.darkBg.tertiary,
  },
  walletName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.brandPrimary,
    marginTop: 8,
  },
  netWorthLabel: {
    fontSize: 16,
    color: COLORS.darkText.secondary,
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: 20,
    color: COLORS.brandPrimary,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  walletAddress: {
    color: COLORS.darkText.secondary,
    fontSize: 15,
    fontWeight: '500',
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: COLORS.darkBg.tertiary,
  },
  actionList: {
    marginTop: 8,
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 12,
    marginBottom: 2,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionLabel: {
    color: COLORS.darkText.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  voteLabel: {
    color: COLORS.brandPrimary,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 10,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkBg.tertiary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  getHelpButton: {
    backgroundColor: COLORS.brandPrimaryAlpha.a10,
  },
  bottomButtonText: {
    color: COLORS.darkText.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  socialIcon: {
    marginHorizontal: 10,
    backgroundColor: COLORS.brandPrimaryAlpha.a10,
    borderRadius: 20,
    padding: 8,
  },
  dropdownContainer: {
    backgroundColor: COLORS.darkBg.tertiary,
    borderRadius: 10,
    marginLeft: 40,
    marginTop: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBg.primary,
  },
  dropdownText: {
    color: COLORS.darkText.primary,
    fontSize: 16,
  },
  addWalletOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 26, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWalletCard: {
    width: '88%',
    backgroundColor: COLORS.darkBg.secondary,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  addWalletTitle: {
    color: COLORS.darkText.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  addWalletBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkBg.tertiary,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  addWalletBtnIcon: {
    marginRight: 18,
  },
  addWalletBtnText: {
    color: COLORS.darkText.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  addWalletClose: {
    position: 'absolute',
    top: 18,
    right: 18,
    padding: 8,
  },
  walletsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 26, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletsCard: {
    width: '92%',
    backgroundColor: COLORS.darkBg.secondary,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
  },
  walletsTitle: {
    color: COLORS.darkText.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  walletsAddBtn: {
    position: 'absolute',
    top: 28,
    right: 28,
    backgroundColor: COLORS.darkBg.primary,
    borderRadius: 20,
    padding: 6,
    zIndex: 2,
  },
  walletItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkBg.tertiary,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 0,
  },
  walletItemActive: {
    borderWidth: 2,
    borderColor: COLORS.brandPrimary,
    backgroundColor: COLORS.darkBg.primary,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  walletIconText: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  walletInfo: {
    flex: 1,
  },
  walletNameList: {
    color: COLORS.darkText.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  walletAddressList: {
    color: COLORS.brandPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  walletBalanceList: {
    color: COLORS.darkText.primary,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  walletsClose: {
    position: 'absolute',
    top: 18,
    right: 18,
    padding: 8,
  },
});

export default WalletDrawer; 