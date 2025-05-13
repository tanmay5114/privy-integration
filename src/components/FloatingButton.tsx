import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import COLORS from 'src/assets/colors';
import FabMenu from './FabMenu';

interface FloatingButtonProps {
  onSend?: () => void;
  onReceive?: () => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onSend, onReceive, open, setOpen }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === 'boolean' && typeof setOpen === 'function';
  const actualOpen = isControlled ? open : internalOpen;
  const actualSetOpen = isControlled ? setOpen! : setInternalOpen;

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => actualSetOpen(true)}>
        <Text style={styles.plus}>+</Text>
      </TouchableOpacity>
      <FabMenu visible={actualOpen} onClose={() => actualSetOpen(false)} onSend={onSend} onReceive={onReceive} />
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.darkBg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  plus: {
    color: COLORS.brandPrimary,
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

export default FloatingButton; 