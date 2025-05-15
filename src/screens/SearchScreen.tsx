import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import WalletDrawer from '../components/WalletDrawer';
import TokenDetailModal from '../components/TokenDetailModal';
import { WalletAsset } from '../services/api';

const TABS = ['Top', 'New'];
const TIME_FILTER = '5m';

interface ApiToken {
  address: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  price?: number; // Price is available for top tokens
  // Fields that might not be directly available or need transformation
  // For example, 'age', 'orgVol', 'vol', 'liq', 'change', 'verified' from the old mock
}

interface ApiNewToken extends ApiToken {
  listedAt: string; // Specific to new listings
  chain: string;
}

// Combined type for items in FlatList
type TokenListItem = ApiToken & {
  rank: number;
  listedAt?: string; // Optional, for new tokens
  // Add any other transformed or UI-specific fields here
};

const SearchScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Top');
  const [walletDrawerVisible, setWalletDrawerVisible] = useState(false);
  const [topTokensData, setTopTokensData] = useState<TokenListItem[]>([]);
  const [newTokensData, setNewTokensData] = useState<TokenListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [isTokenModalVisible, setIsTokenModalVisible] = useState(false);
  const [selectedTokenForModal, setSelectedTokenForModal] = useState<WalletAsset | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      try {
        if (activeTab === 'Top') {
          const response = await fetch('http://localhost:3001/api/wallet/top-tokens?limit=10');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: ApiToken[] = await response.json();
          setTopTokensData(data.map((token, index) => ({ ...token, rank: index + 1 })));
        } else if (activeTab === 'New') {
          const response = await fetch('http://localhost:3001/api/new-listings?limit=10');
           if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: ApiNewToken[] = await response.json();
          setNewTokensData(data.map((token, index) => ({ ...token, rank: index + 1 })));
        }
      } catch (error) {
        console.error("Failed to fetch tokens:", error);
        // Optionally, set an error state here to display to the user
        if (activeTab === 'Top') setTopTokensData([]);
        if (activeTab === 'New') setNewTokensData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [activeTab]);

  // Filter tokens based on active tab
  const filteredTokens = activeTab === 'Top' ? topTokensData : newTokensData;

  const handleTokenPress = (item: TokenListItem) => {
    const walletAsset: WalletAsset = {
      mint: item.address,
      name: item.name,
      symbol: item.symbol,
      image: item.logoURI,
      price: item.price !== undefined ? item.price : 0,
      balance: '0',
      usdValue: 0,
      change24h: 0,
      type: 'token',
      decimals: 0,
    };
    setSelectedTokenForModal(walletAsset);
    setIsTokenModalVisible(true);
  };

  const renderListHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { flex: 0.5 }]}>#</Text>
      <Text style={[styles.headerCell, { flex: 2 }]}>Token</Text>
      {activeTab === 'Top' && <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Price</Text>}
      {activeTab === 'New' && <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>Listed At</Text>}
      {/* Remove Org. Vol. and Liq. as they are not in the API response for now */}
    </View>
  );

  const renderTokenItem = ({ item, index }: { item: TokenListItem, index: number }) => {
    const formatPrice = (price?: number) => {
      if (price === undefined || price === null) return 'N/A';
      if (price < 0.0001 && price > 0) return `< $0.0001`;
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price > 1 ? 2 : 6 })}`;
    };
    
    const formatListedAt = (listedAt?: string) => {
      if (!listedAt) return 'N/A';
      try {
        const date = new Date(listedAt);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      } catch (e) {
        return listedAt; // return original string if parsing fails
      }
    };

    return (
      <TouchableOpacity onPress={() => handleTokenPress(item)}>
        <View style={styles.tableRow}>
          <Text style={[styles.cell, { flex: 0.5 }]}>{item.rank}</Text>
          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
            {item.logoURI ? (
              <Image 
                source={{ uri: item.logoURI }}
                style={styles.tokenIcon} 
                onError={(e) => {
                  console.log("Failed to load remote image:", item.logoURI, e.nativeEvent.error);
                  // In a more advanced scenario, you could set a state here
                  // to specifically re-render this item with a placeholder
                }}
              />
            ) : (
              <View style={styles.tokenIcon} /> // Render a placeholder view if no logoURI
            )}
            <View>
              <Text style={styles.tokenName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
              <Text style={styles.tokenSymbol}>{item.symbol}</Text>
            </View>
          </View>
          {activeTab === 'Top' && (
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>
              {formatPrice(item.price)}
            </Text>
          )}
          {activeTab === 'New' && (
             <Text style={[styles.cell, { flex: 1.5, textAlign: 'right' }]}>
              {formatListedAt(item.listedAt)}
            </Text>
          )}
          {/* Removed Org. Vol. and Liq. related Texts */}
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Token List Header - Replaced with a function for dynamic headers */}
      {/* <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { flex: 0.5 }]}>#</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Token</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Org. Vol.</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Liq.</Text>
      </View> */}

      {/* Token List */}
      {loading ? (
        <ActivityIndicator size="large" color="#D1FFB0" style={{ flex: 1, justifyContent: 'center' }} />
      ) : filteredTokens.length === 0 && !loading ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>No tokens found.</Text>
          <Text style={styles.emptyListSubText}>Try a different filter or check back later.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTokens}
          keyExtractor={(item) => item.address + item.rank.toString()} // Ensure unique key
          ListHeaderComponent={renderListHeader}
          renderItem={renderTokenItem}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {selectedTokenForModal && (
        <TokenDetailModal
          visible={isTokenModalVisible}
          onClose={() => setIsTokenModalVisible(false)}
          token={selectedTokenForModal}
          onRefresh={async () => { console.log('Refresh pressed in SearchScreen modal'); }}
          onSend={(tokenToSend) => { console.log('Send pressed in SearchScreen modal:', tokenToSend.symbol); }}
        />
      )}
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
    marginBottom: 8,
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
    paddingVertical: 12,
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
    backgroundColor: '#333',
    marginRight: 10,
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#303030',
  },
  tokenName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    maxWidth: 150,
  },
  tokenAge: {
    color: '#8C9AA8',
    fontSize: 12,
    fontWeight: '500',
  },
  tokenSymbol: {
    color: '#8C9AA8',
    fontSize: 13,
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
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyListSubText: {
    color: '#8C9AA8',
    fontSize: 14,
    marginTop: 8,
  },
});

export default SearchScreen; 