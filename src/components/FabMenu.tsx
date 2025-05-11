import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from 'src/assets/colors';

interface FabMenuProps {
  visible: boolean;
  onClose: () => void;
}

const actions = [
  { label: 'Send', icon: 'paper-plane-outline', onPress: () => {/* handle send */} },
  { label: 'Receive', icon: 'qr-code-outline', onPress: () => {/* handle receive */} },
  { label: 'Buy', icon: 'card-outline', onPress: () => {/* handle buy */} },
];

export default function FabMenu({ visible, onClose }: FabMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.menu}>
          {actions.map((action, idx) => (
            <View key={action.label} style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
                <Ionicons name={action.icon as any} size={32} color="#222" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={36} color={COLORS.brandPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,30,0.7)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 24,
  },
  menu: {
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  actionButton: {
    backgroundColor: '#e6f8f7',
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: COLORS.darkBg.secondary,
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
  },
}); 