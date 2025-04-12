import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../walletProviders/hooks/useAuth';
import { useWallet } from '../walletProviders/hooks/useWallet';
import COLORS from '../assets/colors';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { address } = useWallet();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      
      <LinearGradient
        colors={['#1A1A1A', '#121212', '#050505']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[COLORS.brandPrimary, COLORS.cyan, '#2AABB3']}
              style={styles.avatarBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {address ? address.substring(0, 2).toUpperCase() : 'P'}
                </Text>
              </View>
            </LinearGradient>
          </View>
          
          <Text style={styles.walletAddress}>
            {address 
              ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
              : 'Not connected'
            }
          </Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Wallet Balance</Text>
            <Text style={styles.infoValue}>0 SOL</Text>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={[COLORS.status.error, '#ff6347']}
              style={styles.logoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.brandPrimaryAlpha.a10,
    top: -50,
    left: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(181, 145, 255, 0.04)',
    bottom: 100,
    right: -100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkText.primary,
    textShadowColor: COLORS.brandPrimaryAlpha.a50,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  profileContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: COLORS.darkBg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.darkText.primary,
  },
  walletAddress: {
    fontSize: 16,
    color: COLORS.darkText.secondary,
    marginBottom: 30,
  },
  infoCard: {
    width: width * 0.9,
    backgroundColor: COLORS.darkSurface.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoTitle: {
    fontSize: 14,
    color: COLORS.darkText.tertiary,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkText.primary,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutButton: {
    width: width * 0.7,
    height: 56,
    marginVertical: 10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 