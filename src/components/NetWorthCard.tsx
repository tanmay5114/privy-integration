import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NetWorthCard: React.FC = () => (
  <View style={styles.card}>
    <Text style={styles.label}>Net Worth</Text>
    <Text style={styles.value}>$1,552.89</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 40,
    minHeight: 180,
  },
  label: { color: '#ccc', fontSize: 20 },
  value: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
});

export default NetWorthCard; 