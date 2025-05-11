import React from 'react';
import { View } from 'react-native';
import TokenItem from './TokenItem';

const tokens = [
  {
    icon: <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6' }} />, // Replace with real icon
    name: 'Send',
    value: '$1,115.34',
    price: '$0.0125',
    change: '-7.36%',
    amount: '88,999.32 SEND',
    valueColor: '#fff',
  },
  {
    icon: <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#a78bfa' }} />, // Replace with real icon
    name: 'Solana',
    value: '$223.07',
    price: '$145.01',
    change: '-1.19%',
    amount: '1.54 SOL',
    valueColor: '#fff',
  },
  {
    icon: <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#38bdf8' }} />, // Replace with real icon
    name: 'USD Coin',
    value: '$181.46',
    price: '$1.00',
    change: '+0.00364%',
    amount: '181.46 USDC',
    valueColor: '#fff',
  },
];

const TokenList = () => (
  <View>
    {tokens.map((token, idx) => (
      <TokenItem key={idx} {...token} />
    ))}
  </View>
);

export default TokenList; 