import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import COLORS from '../assets/colors';

interface NetWorthCardProps {
  totalValue: number;
}

const NetWorthCard: React.FC<NetWorthCardProps> = ({ totalValue }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Net Worth</Text>
      <Text style={styles.value}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  label: {
    color: COLORS.greyLight,
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 8,
    textAlign: 'center',
  },
  value: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default NetWorthCard; 