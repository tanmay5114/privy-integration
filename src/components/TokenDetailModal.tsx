import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import COLORS from '../assets/colors';
import { WalletAsset } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation } from '../hooks/useAppNavigation';

interface TokenDetailModalProps {
  visible: boolean;
  onClose: () => void;
  token: WalletAsset | null;
  onRefresh: () => Promise<void>;
  onSend: (token: WalletAsset) => void;
}

const TokenDetailModal: React.FC<TokenDetailModalProps> = ({
  visible,
  onClose,
  token,
  onRefresh,
  onSend,
}) => {
  if (!token) return null;

  const navigation = useAppNavigation();

  // Calculate 24h USD change if not present
  const price = typeof token.price === 'number' ? token.price : 0;
  const balance = typeof token.balance === 'string' ? parseFloat(token.balance) : 0;
  const change24h = typeof token.change24h === 'number' ? token.change24h : 0;
  const usdValue = typeof token.usdValue === 'number' ? token.usdValue : 0;
  const change24hUsd = price * balance * (change24h / 100);

  // Token Info placeholders (replace with real data if available)
  const marketCap = 23400000; // $23.4M placeholder
  const mint = token.mint || 'SEND...pCxa';
  const volume24h = 1360000; // $1.36M placeholder
  const fdv = 23400000; // $23.4M placeholder
  const circulatingSupply = 999000000; // 999M placeholder
  const totalSupply = 999000000; // 999M placeholder
  const twitterUrl = '#'; // placeholder
  const websiteUrl = '#'; // placeholder

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.tokenHeaderLeft}>
              {token.image ? (
                <Image source={{ uri: token.image }} style={styles.tokenImage} />
              ) : (
                <View style={[styles.tokenImage, { backgroundColor: COLORS.darkBg.secondary }]} />
              )}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.tokenName}>{token.name}</Text>
                  {/* Verified badge removed (not in WalletAsset) */}
                </View>
                <Text style={styles.tokenSymbol}>{token.symbol}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={COLORS.greyLight} />
            </TouchableOpacity>
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.priceValue}>${price.toFixed(4)}</Text>
            <View style={styles.priceChangeRow}>
              <Text style={[styles.priceChangeUsd, change24hUsd >= 0 ? styles.positive : styles.negative]}>
                {change24hUsd >= 0 ? '+' : ''}${Math.abs(change24hUsd).toFixed(5)}
              </Text>
              <Text style={[styles.priceChangePercent, change24h >= 0 ? styles.positive : styles.negative]}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
              </Text>
            </View>
          </View>

          {/* Overview/Transactions/History Tabs */}
          <View style={styles.sectionTabsRow}>
            <Text style={[styles.sectionTab, styles.sectionTabActive]}>Overview</Text>
            <Text style={styles.sectionTab}>Transactions</Text>
            <Text style={styles.sectionTab}>History</Text>
          </View>

          {/* Your Holdings */}
          <Text style={styles.holdingsLabel}>Your Holdings</Text>
          <View style={styles.holdingsRow}>
            <View style={styles.holdingsBox}>
              <Text style={styles.holdingsBoxLabel}>Balance</Text>
              <Text style={styles.holdingsBoxValue}>{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {token.symbol}</Text>
            </View>
            <View style={styles.holdingsBox}>
              <Text style={styles.holdingsBoxLabel}>Value</Text>
              <Text style={styles.holdingsBoxValue}>${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          </View>

          {/* Token Info Section */}
          <Text style={styles.tokenInfoLabel}>Token Info</Text>
          <View style={styles.tokenInfoGrid}>
            <View style={styles.tokenInfoBox}>
              <Text style={styles.tokenInfoLabelSmall}>Market Cap</Text>
              <Text style={styles.tokenInfoValue}>${(marketCap / 1e6).toFixed(1)}M</Text>
            </View>
            <View style={styles.tokenInfoBox}>
              <Text style={styles.tokenInfoLabelSmall}>Mint</Text>
              <Text style={styles.tokenInfoValue} numberOfLines={1}>{mint}</Text>
            </View>
            <View style={styles.tokenInfoBox}>
              <Text style={styles.tokenInfoLabelSmall}>Volume (24)</Text>
              <Text style={styles.tokenInfoValue}>${(volume24h / 1e6).toFixed(2)}M</Text>
            </View>
            <View style={styles.tokenInfoBox}>
              <Text style={styles.tokenInfoLabelSmall}>FDV</Text>
              <Text style={styles.tokenInfoValue}>${(fdv / 1e6).toFixed(1)}M</Text>
            </View>
            <View style={styles.tokenInfoBox}>
              <Text style={styles.tokenInfoLabelSmall}>Circulating Supply</Text>
              <Text style={styles.tokenInfoValue}>{(circulatingSupply / 1e6).toFixed(0)}M <Text style={styles.tokenInfoPercent}>100%</Text></Text>
            </View>
            <View style={styles.tokenInfoBox}>
              <Text style={styles.tokenInfoLabelSmall}>Total Supply</Text>
              <Text style={styles.tokenInfoValue}>{(totalSupply / 1e6).toFixed(0)}M</Text>
            </View>
          </View>

          {/* Social Links */}
          <View style={styles.socialLinksRow}>
            <TouchableOpacity style={styles.socialButton} onPress={() => { if (twitterUrl !== '#') { Linking.openURL(twitterUrl); } }}>
              <Text style={styles.socialButtonText}>Twitter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={() => { if (websiteUrl !== '#') { Linking.openURL(websiteUrl); } }}>
              <Text style={styles.socialButtonText}>Website</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton, styles.actionSend]} onPress={() => onSend(token)}>
              <Text style={styles.actionButtonText}>↗ Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionSell]}
              onPress={() => {
                onClose();
                setTimeout(() => {
                  navigation.navigate({ name: 'SwapTab' } as any);
                }, 250); // Delay to allow modal to close smoothly
              }}
            >
              <Text style={styles.actionButtonText}>- Sell</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionBuy]}>
              <Text style={[styles.actionButtonText, styles.actionBuyText]}>+ Buy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.darkSurface.modal,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tokenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: COLORS.darkBg.secondary,
  },
  tokenName: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  tokenSymbol: {
    color: COLORS.greyLight,
    fontSize: 15,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  priceSection: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  priceValue: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  priceChangeUsd: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  priceChangePercent: {
    fontSize: 16,
    fontWeight: '600',
  },
  positive: {
    color: COLORS.status.success,
  },
  negative: {
    color: COLORS.status.error,
  },
  sectionTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTab: {
    color: COLORS.greyLight,
    fontSize: 16,
    fontWeight: '500',
    marginRight: 18,
    paddingBottom: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sectionTabActive: {
    color: COLORS.primary,
    borderBottomColor: COLORS.primary,
  },
  holdingsLabel: {
    color: COLORS.greyLight,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 8,
  },
  holdingsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  holdingsBox: {
    flex: 1,
    backgroundColor: COLORS.darkBg.secondary,
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
  },
  holdingsBoxLabel: {
    color: COLORS.greyLight,
    fontSize: 13,
    marginBottom: 4,
  },
  holdingsBoxValue: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkBg.secondary,
  },
  actionSend: {},
  actionSell: {},
  actionBuy: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  actionBuyText: {
    color: COLORS.darkBg.secondary,
  },
  tokenInfoLabel: {
    color: COLORS.greyLight,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 8,
  },
  tokenInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tokenInfoBox: {
    width: '48%',
    backgroundColor: COLORS.darkBg.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    marginRight: '2%',
  },
  tokenInfoLabelSmall: {
    color: COLORS.greyLight,
    fontSize: 13,
    marginBottom: 2,
  },
  tokenInfoValue: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  tokenInfoPercent: {
    color: COLORS.greyLight,
    fontSize: 12,
    fontWeight: '400',
  },
  socialLinksRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginTop: 2,
  },
  socialButton: {
    backgroundColor: COLORS.darkBg.secondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  socialButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default TokenDetailModal; 