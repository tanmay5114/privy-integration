import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import COLORS from '../assets/colors';
import { WalletAsset } from '../services/api';

interface HoldingsCardProps {
  assets: WalletAsset[];
  totalUsdValue: number;
  previousTotalUsdValue?: number; // Optional, for change display
}

const HoldingsCard: React.FC<HoldingsCardProps> = ({ assets, totalUsdValue, previousTotalUsdValue }) => {
  const safeTotalUsdValue = typeof totalUsdValue === 'number' && !isNaN(totalUsdValue) ? totalUsdValue : 0;
  const safePreviousTotalUsdValue = typeof previousTotalUsdValue === 'number' && !isNaN(previousTotalUsdValue) ? previousTotalUsdValue : 0;
  const changeUsd = safeTotalUsdValue - safePreviousTotalUsdValue;
  const tokenCount = assets.length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Holdings Value</Text>
        <Text style={styles.tokenCount}>{tokenCount} Token{tokenCount !== 1 ? 's' : ''}</Text>
      </View>
      <View style={styles.valuesRow}>
        <Text style={styles.value}>${safeTotalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={[styles.change, { color: changeUsd >= 0 ? COLORS.success : COLORS.error }]}> 
          {changeUsd >= 0 ? '+' : '-'}${Math.abs(changeUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkSurface.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: COLORS.greyLight,
    fontSize: 14,
  },
  tokenCount: {
    color: COLORS.greyLight,
    fontSize: 14,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  value: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
  },
  change: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    alignSelf: 'flex-end',
  },
});

export default HoldingsCard; 