import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from 'src/assets/colors';

const Header: React.FC = () => (
  <View style={styles.header}>
    <View style={styles.profileCircle}>
      <Ionicons name="person" size={32} color="#fff" />
    </View>
    <View style={styles.icons}>
      <View style={styles.iconBlue}>
        <Ionicons name="clipboard-outline" size={24} color="#fff" />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    marginTop: 32,
  },
  profileCircle: {
    backgroundColor: COLORS.darkBg.secondary,
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icons: { flexDirection: 'row' },
  iconBlue: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.darkBg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
});

export default Header; 