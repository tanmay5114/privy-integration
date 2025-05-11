import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import COLORS from 'src/assets/colors';

const HoldingsCard: React.FC = () => (
  <View style={styles.card}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={styles.label}>Holdings Value</Text>
      <Text style={styles.tokensCount}>3 Tokens</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}>
      <Text style={styles.value}>$1,519.87</Text>
      <Text style={styles.change}>  -$91.36  -5.67%</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.darkSurface.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  label: { color: '#8A99A9', fontSize: 18, fontWeight: 'bold' },
  value: { color: COLORS.darkText.primary, fontSize: 24, fontWeight: 'bold' },
  change: { color: COLORS.status.error, fontSize: 16, marginLeft: 8 },
  tokensCount: { color: '#8A99A9', fontSize: 14 },
});

export default HoldingsCard; 