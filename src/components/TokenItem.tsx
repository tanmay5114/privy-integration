import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import COLORS from 'src/assets/colors';

type TokenItemProps = {
  icon: React.ReactNode;
  name: string;
  value: string;
  price: string;
  change: string;
  amount: string;
  valueColor?: string;
  onPress?: () => void;
};

const TokenItem: React.FC<TokenItemProps> = ({ icon, name, value, price, change, amount, valueColor, onPress }) => (
  <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.icon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.price}>{price} <Text style={{ color: change.startsWith('-') ? '#ef4444' : '#22c55e' }}>{change}</Text></Text>
      <Text style={styles.amount}>{amount}</Text>
    </View>
    <Text style={[styles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkSurface.card,
    borderRadius: 16,
    marginVertical: 6,
    padding: 16,
    paddingHorizontal: 40,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: { marginRight: 16 },
  name: { color: '#8A99A9', fontWeight: 'bold', fontSize: 18 },
  price: { color: '#8A99A9', fontSize: 14 },
  amount: { color: '#8A99A9', fontSize: 12 },
  value: { color: '#8A99A9', fontWeight: 'bold', fontSize: 18, marginLeft: 12 },
});

export default TokenItem; 