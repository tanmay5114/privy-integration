import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import WalletDrawer from '../components/WalletDrawer';

const TABS = ['Top', 'New'];
const TIME_FILTER = '5m';

const TOKENS = [
  { rank: 1, name: 'SOL', age: '11mo', orgVol: '99', vol: '$1.59M', liq: '$96.5M', change: '+0.148%', icon: null, verified: true },
  { rank: 2, name: 'USDC', age: '11mo', orgVol: '100', vol: '$513K', liq: '$25.3M', change: '-0.00621%', icon: null, verified: true },
  { rank: 3, name: 'USELESS', age: '1d', orgVol: '94', vol: '$59.7K', liq: '$1.60M', change: '+4.73%', icon: null, verified: false },
  { rank: 4, name: 'ONE', age: '1h', orgVol: '86', vol: '$12.7K', liq: '$108K', change: '+17.4%', icon: null, verified: false },
  { rank: 5, name: 'USDT', age: '11mo', orgVol: '100', vol: '$60.7K', liq: '$16M', change: '-0.00789%', icon: null, verified: true },
  { rank: 6, name: 'GOD', age: '22h', orgVol: '92', vol: '$10.4K', liq: '$225K', change: '+8.08%', icon: null, verified: false },
];

const SearchScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Top');
  const [walletDrawerVisible, setWalletDrawerVisible] = useState(false);

  // Filter tokens based on active tab
  const filteredTokens = activeTab === 'New'
    ? TOKENS.filter(token => {
        // Show tokens with age containing 'd', 'h', or less than 7 days
        if (token.age.endsWith('h')) return true;
        if (token.age.endsWith('d')) {
          const days = parseInt(token.age);
          return days <= 7;
        }
        return false;
      })
    : TOKENS;

  return (
    <View style={styles.container}>
      <AppHeader onUserPress={() => setWalletDrawerVisible(true)} />
      <WalletDrawer visible={walletDrawerVisible} onClose={() => setWalletDrawerVisible(false)} />
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#8C9AA8" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tokens or CA..."
          placeholderTextColor="#8C9AA8"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.pasteButton}>
          <Text style={styles.pasteText}>Paste</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs and Time Filter */}
      <View style={styles.tabsRow}>
        <View style={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.timeButton}>
          <Text style={styles.timeButtonText}>{TIME_FILTER}</Text>
        </TouchableOpacity>
      </View>

      {/* Token List Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { flex: 0.5 }]}>#</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Token</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Org. Vol.</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Liq.</Text>
      </View>

      {/* Token List */}
      <FlatList
        data={filteredTokens}
        keyExtractor={item => item.rank.toString()}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 0.5 }]}>{item.rank}</Text>
            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
              {/* Placeholder for token icon */}
              <View style={styles.tokenIconPlaceholder} />
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.tokenName}>{item.name}</Text>
                  {item.verified && <Ionicons name="checkmark-circle" size={14} color="#8C9AA8" style={{ marginLeft: 4 }} />}
                </View>
                <Text style={styles.tokenAge}>{item.age}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.orgVol}>{item.orgVol}</Text>
              <Text style={[styles.tokenChange, { color: item.change.startsWith('-') ? '#FF6B6B' : '#4ADE80' }]}>{item.change}</Text>
            </View>
            <Text style={[styles.cell, { flex: 1 }]}>{item.liq}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
    padding: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232B36',
    borderRadius: 14,
    marginBottom: 18,
    paddingHorizontal: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  pasteButton: {
    backgroundColor: '#232B36',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  pasteText: {
    color: '#8C9AA8',
    fontWeight: '600',
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#10151A',
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  tabButtonActive: {
    backgroundColor: '#232B36',
  },
  tabText: {
    color: '#8C9AA8',
    fontWeight: '700',
    fontSize: 16,
  },
  tabTextActive: {
    color: '#D1FFB0',
  },
  timeButton: {
    marginLeft: 'auto',
    borderColor: '#8C9AA8',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  timeButtonText: {
    color: '#8C9AA8',
    fontWeight: '700',
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  headerCell: {
    color: '#8C9AA8',
    fontWeight: '700',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232B36',
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  cell: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  tokenIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#232B36',
    marginRight: 10,
  },
  tokenName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  tokenAge: {
    color: '#8C9AA8',
    fontSize: 12,
    fontWeight: '500',
  },
  orgVol: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  tokenChange: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default SearchScreen; 