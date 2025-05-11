import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import COLORS from 'src/assets/colors';
import FabMenu from './FabMenu';

const FloatingButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)}>
        <Text style={styles.plus}>+</Text>
      </TouchableOpacity>
      <FabMenu visible={open} onClose={() => setOpen(false)} />
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