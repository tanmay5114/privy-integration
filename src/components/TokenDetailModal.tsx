import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Linking, ActivityIndicator } from 'react-native';
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

interface ApiTokenDetails {
  mintAddress: string;
  name: string;
  symbol: string;
  logoURI: string | null;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  twitter?: string;
  website?: string;
  description?: string;
  totalSupply?: number;
  circulatingSupply?: number;
  telegram?: string; // Added telegram as it was in the service
}

const formatNumber = (num: number | undefined | null, precision: number = 1, suffixIfMillion: string = 'M', suffixIfBillion: string = 'B') => {
  if (num === undefined || num === null) return 'N/A';
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(precision)}${suffixIfBillion}`;
  }
  if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(precision)}${suffixIfMillion}`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(precision)}K`;
  }
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatSupply = (num: number | undefined | null, precision: number = 0) => {
  if (num === undefined || num === null) return 'N/A';
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(precision)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(precision)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(precision)}K`;
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const TokenDetailModal: React.FC<TokenDetailModalProps> = ({
  visible,
  onClose,
  token,
  onRefresh,
  onSend,
}) => {
  const [modalTokenDetails, setModalTokenDetails] = useState<ApiTokenDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const navigation = useAppNavigation();

  useEffect(() => {
    if (visible && token && token.mint) {
      const fetchModalTokenDetails = async () => {
        setLoadingDetails(true);
        setErrorDetails(null);
        setModalTokenDetails(null); // Clear previous details
        try {
          const response = await fetch(`https://aurumai-production.up.railway.app/api/token/${token.mint}/details`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to fetch token details (${response.status})`);
          }
          const data: ApiTokenDetails = await response.json();
          setModalTokenDetails(data);
          console.log('Fetched modalTokenDetails:', data);
        } catch (err) {
          console.error("Error fetching token details for modal:", err);
          setErrorDetails(err instanceof Error ? err.message : 'An unknown error occurred');
        }
        setLoadingDetails(false);
      };
      fetchModalTokenDetails();
    }
  }, [visible, token]);

  if (!token) return null;

  // Calculate 24h USD change if not present
  const price = typeof token.price === 'number' ? token.price : 0;
  const balance = typeof token.balance === 'string' ? parseFloat(token.balance) : 0;
  const change24h = typeof token.change24h === 'number' ? token.change24h : 0;
  const usdValue = typeof token.usdValue === 'number' ? token.usdValue : 0;
  const change24hUsd = price * balance * (change24h / 100);

  // Token Info - use modalTokenDetails if available, otherwise show placeholders or loading
  const displayMint = modalTokenDetails?.mintAddress || token.mint || 'N/A';
  const displayDescription = modalTokenDetails?.description || 'No description available.';

  const renderTokenInfo = () => {
    if (loadingDetails) {
      return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />;
    }
    if (errorDetails) {
      return <Text style={styles.errorText}>Error: {errorDetails}</Text>;
    }
    if (!modalTokenDetails) {
      return <Text style={styles.errorText}>Token information not available.</Text>; // Or more placeholders
    }

    const { 
      marketCap: apiMarketCap,
      volume24h,
      totalSupply,
      circulatingSupply,
      price
    } = modalTokenDetails;

    let displayMarketCap = apiMarketCap;
    if ((displayMarketCap === undefined || displayMarketCap === null) &&
        typeof price === 'number' && 
        typeof circulatingSupply === 'number') {
      displayMarketCap = price * circulatingSupply;
    }

    // FDV might be calculated if price and total supply are available
    let fdvDisplay = 'N/A';
    if (price && totalSupply) {
      fdvDisplay = formatNumber(price * totalSupply);
    } else if (displayMarketCap && totalSupply && circulatingSupply && circulatingSupply > 0) {
      // Estimate price from marketCap / circulatingSupply if direct price isn't on modalTokenDetails
      const estimatedPrice = displayMarketCap / circulatingSupply;
      fdvDisplay = formatNumber(estimatedPrice * totalSupply);
    } else {
      fdvDisplay = formatNumber(displayMarketCap); // Fallback to marketCap if FDV cannot be calculated
    }

    const circulatingSupplyPercent = (circulatingSupply && totalSupply && totalSupply > 0) 
      ? (circulatingSupply / totalSupply * 100).toFixed(0) + '%'
      : 'N/A';

    return (
      <View style={styles.tokenInfoGrid}>
        <View style={styles.tokenInfoBox}>
          <Text style={styles.tokenInfoLabelSmall}>Market Cap</Text>
          <Text style={styles.tokenInfoValue}>{formatNumber(displayMarketCap)}</Text>
        </View>
        <View style={styles.tokenInfoBox}>
          <Text style={styles.tokenInfoLabelSmall}>Mint</Text>
          <Text style={styles.tokenInfoValue} numberOfLines={1}>{displayMint.substring(0,4)}...{displayMint.substring(displayMint.length - 4)}</Text>
        </View>
        <View style={styles.tokenInfoBox}>
          <Text style={styles.tokenInfoLabelSmall}>Volume (24h)</Text>
          <Text style={styles.tokenInfoValue}>{formatNumber(volume24h)}</Text>
        </View>
        <View style={styles.tokenInfoBox}>
          <Text style={styles.tokenInfoLabelSmall}>FDV</Text>
          <Text style={styles.tokenInfoValue}>{fdvDisplay}</Text>
        </View>
        <View style={styles.tokenInfoBox}>
          <Text style={styles.tokenInfoLabelSmall}>Circulating Supply</Text>
          <Text style={styles.tokenInfoValue}>{formatSupply(circulatingSupply)} <Text style={styles.tokenInfoPercent}>{circulatingSupplyPercent}</Text></Text>
        </View>
        <View style={styles.tokenInfoBox}>
          <Text style={styles.tokenInfoLabelSmall}>Total Supply</Text>
          <Text style={styles.tokenInfoValue}>{formatSupply(totalSupply)}</Text>
        </View>
      </View>
    );
  };

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
          {renderTokenInfo()}
          {modalTokenDetails?.description && (
            <View style={styles.descriptionContainer}>
                <Text style={styles.tokenInfoLabelSmall}>Description</Text>
                <Text style={styles.descriptionText}>{modalTokenDetails.description}</Text>
            </View>
          )}

          {/* Social Links */}
          {(modalTokenDetails?.twitter || modalTokenDetails?.website || modalTokenDetails?.telegram) && (
            <View style={styles.socialLinksRow}>
              {modalTokenDetails?.website && (
                <TouchableOpacity style={styles.socialButton} onPress={() => Linking.openURL(modalTokenDetails.website!)}>
                  <Ionicons name="globe-outline" size={16} color={COLORS.white} style={{marginRight: 6}}/> 
                  <Text style={styles.socialButtonText}>Website</Text>
                </TouchableOpacity>
              )}
              {modalTokenDetails?.twitter && (
                <TouchableOpacity style={styles.socialButton} onPress={() => Linking.openURL(modalTokenDetails.twitter!)}>
                   <Ionicons name="logo-twitter" size={16} color={COLORS.white} style={{marginRight: 6}}/> 
                  <Text style={styles.socialButtonText}>Twitter</Text>
                </TouchableOpacity>
              )}
              {modalTokenDetails?.telegram && (
                <TouchableOpacity style={styles.socialButton} onPress={() => Linking.openURL(modalTokenDetails.telegram!)}>
                  {/* Consider using a Telegram specific icon if available or a generic link icon */}
                  <Ionicons name="paper-plane-outline" size={16} color={COLORS.white} style={{marginRight: 6}}/> 
                  <Text style={styles.socialButtonText}>Telegram</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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
    marginBottom: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  socialButton: {
    backgroundColor: COLORS.darkBg.secondary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.status.error,
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  descriptionContainer: {
    backgroundColor: COLORS.darkBg.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  descriptionText: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TokenDetailModal; 