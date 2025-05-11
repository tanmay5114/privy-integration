import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const AppHeader: React.FC<{ onUserPress?: () => void; onClipboardPress?: () => void }> = ({ onUserPress, onClipboardPress }) => {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.iconCircle} onPress={onUserPress} activeOpacity={0.7}>
          <Ionicons name="person" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle} onPress={onClipboardPress} activeOpacity={0.7}>
          <Ionicons name="clipboard-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent', // or your header bg color
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
    marginTop: 0,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(140, 154, 168, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppHeader; 