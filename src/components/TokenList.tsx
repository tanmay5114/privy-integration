import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import COLORS from '../assets/colors';
import { WalletAsset } from '../services/api';

interface TokenListProps {
  tokens: WalletAsset[];
  onTokenPress: (token: WalletAsset) => void;
}

const TokenList: React.FC<TokenListProps> = ({ tokens, onTokenPress }) => {
  useEffect(() => {
    console.log('[TokenList] Received tokens:', JSON.stringify(tokens, null, 2));
  }, [tokens]);

  const renderToken = ({ item: token }: { item: WalletAsset }) => {
    return (
      <TouchableOpacity style={styles.tokenItem} onPress={() => onTokenPress(token)}>
        {token.image ? (
          <Image source={{ uri: token.image }} style={styles.tokenImage} />
        ) : (
          <View style={[styles.tokenImage, { backgroundColor: COLORS.darkBg.secondary }]} />
        )}
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenName}>{token.name}</Text>
          <View style={styles.tokenPriceRow}>
            <Text style={styles.tokenPrice}>${token.price?.toFixed(4) ?? '0.0000'}</Text>
            <Text style={[styles.tokenChange, token.change24h >= 0 ? styles.positive : styles.negative]}>
              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
            </Text>
          </View>
          <Text style={styles.tokenBalance}>
            {parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} {token.symbol}
          </Text>
        </View>
        <Text style={styles.tokenValue}>${token.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tokens}
        renderItem={renderToken}
        keyExtractor={token => token.symbol}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tokens found</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkSurface.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 0,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 8,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBg.secondary,
  },
  tokenImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 14,
    backgroundColor: COLORS.darkBg.secondary,
  },
  tokenInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tokenName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tokenPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tokenPrice: {
    color: COLORS.greyLight,
    fontSize: 13,
    marginRight: 8,
  },
  tokenChange: {
    fontSize: 13,
  },
  positive: {
    color: COLORS.success,
  },
  negative: {
    color: COLORS.error,
  },
  tokenBalance: {
    color: COLORS.greyLight,
    fontSize: 13,
    marginTop: 2,
  },
  tokenValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    minWidth: 90,
    textAlign: 'right',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.greyLight,
    fontSize: 16,
  },
});

export default TokenList; 