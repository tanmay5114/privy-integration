import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import COLORS from '../assets/colors';
import { Transaction } from '../services/api';

interface TransactionHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  visible,
  onClose,
  transactions,
}) => {
  const renderTransaction = ({ item: tx }: { item: Transaction }) => {
    const numericAmount = parseFloat(tx.amount);
    let displayDecimals = 2; // Default display decimals

    if (tx.decimals !== undefined && tx.decimals > 0) {
      if (tx.symbol === 'SOL') {
        displayDecimals = Math.min(tx.decimals, 9); // Max 9 for SOL
      } else {
        displayDecimals = Math.min(tx.decimals, 6); // Max 6 for other tokens
      }
    }
    // For very small non-zero amounts, ensure enough precision if decimals are known
    // otherwise toFixed might round to 0.00 too early.
    if (numericAmount !== 0 && Math.abs(numericAmount) < (1 / Math.pow(10, displayDecimals))) {
        if (tx.decimals && tx.decimals > displayDecimals) {
            displayDecimals = tx.decimals; // Use actual (or max 9/6) if amount is tiny
            if (tx.symbol === 'SOL') displayDecimals = Math.min(displayDecimals, 9);
            else displayDecimals = Math.min(displayDecimals, 6);
        }
    }

    const formattedAmount = numericAmount.toFixed(displayDecimals);

    return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionType}>
          {tx.type === 'send' ? 'Sent' : 'Received'} {tx.symbol}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </Text>
        <Text style={styles.transactionTo}>
          To: {tx.to ? tx.to.slice(0, 5) + '...' + tx.to.slice(-4) : '-'}
        </Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amount,
          tx.type === 'send' ? styles.sentAmount : styles.receivedAmount
        ]}>
          {tx.type === 'send' ? '-' : '+'}{formattedAmount} {tx.symbol}
        </Text>
        <Text style={styles.usdValue}>
          ${tx.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Transaction History</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={tx => tx.hash}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No transactions yet</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.darkSurface.modal,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 24,
  },
  list: {
    paddingBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBg.secondary,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    color: COLORS.greyLight,
    fontSize: 14,
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
  },
  sentAmount: {
    color: COLORS.status.error,
  },
  receivedAmount: {
    color: COLORS.status.success,
  },
  usdValue: {
    color: COLORS.greyLight,
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    color: COLORS.greyLight,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  transactionTo: {
    color: COLORS.greyLight,
    fontSize: 13,
    marginTop: 2,
  },
});

export default TransactionHistoryModal; 