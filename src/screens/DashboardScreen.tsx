import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import NetWorthCard from '../components/NetWorthCard';
import HoldingsCard from '../components/HoldingsCard';
import TokenList from '../components/TokenList';
import FloatingButton from '../components/FloatingButton';
import AppHeader from '../components/AppHeader';
import WalletDrawer from '../components/WalletDrawer';
import COLORS from 'src/assets/colors';

const DashboardScreen: React.FC = () => {
  const [walletDrawerVisible, setWalletDrawerVisible] = useState(false);

  return (
    <ImageBackground source={require('../assets/images/new_dashboard_bg.png')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <AppHeader onUserPress={() => setWalletDrawerVisible(true)} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <NetWorthCard />
          <HoldingsCard />
          <View style={{ marginTop: 8 }}>
            <TokenList />
          </View>
        </ScrollView>
        <FloatingButton />
        <WalletDrawer visible={walletDrawerVisible} onClose={() => setWalletDrawerVisible(false)} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 26, 0.85)', // Optional: dark overlay for readability
  },
});

export default DashboardScreen; 