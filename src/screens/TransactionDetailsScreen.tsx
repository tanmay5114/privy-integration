import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../assets/colors';

// Define the expected route params
interface TransactionDetailsScreenRouteParams {
  transaction: any;
  userAddress: string;
}

type TransactionDetailsScreenRoute = RouteProp<
  Record<string, TransactionDetailsScreenRouteParams>,
  string
>;

const lamportsToSol = (lamports: number) => lamports / 1e9;

const getSolscanTxUrl = (signature: string) => `https://solscan.io/tx/${signature}`;

const TransactionDetailsScreen = () => {
  const route = useRoute<TransactionDetailsScreenRoute>();
  const { transaction, userAddress } = route.params;

  if (!transaction) {
    return (
      <View style={styles.centered}><Text style={styles.errorText}>No transaction data.</Text></View>
    );
  }

  const { signature, timestamp, meta, slot, transaction: tx } = transaction;
  const instruction = tx.message.instructions[0];
  const info = instruction?.parsed?.info || {};
  const isSender = info.source === userAddress;
  const status = meta.status.Ok ? 'Success' : 'Failed';
  const amountSol = info.lamports ? lamportsToSol(info.lamports) : null;
  const program = instruction?.program || 'Unknown';

  const handleOpenSolscan = () => {
    const url = getSolscanTxUrl(signature);
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Solscan.');
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Transaction Details</Text>
      <View style={styles.row}><Text style={styles.label}>Status:</Text><Text style={[styles.value, {color: status === 'Success' ? COLORS.status.success : COLORS.status.error}]}>{status}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Type:</Text><Text style={styles.value}>{isSender ? 'Sent' : 'Received'}</Text></View>
      {amountSol !== null && (
        <View style={styles.row}><Text style={styles.label}>Amount:</Text><Text style={styles.value}>{amountSol} SOL</Text></View>
      )}
      <View style={styles.row}><Text style={styles.label}>Sender:</Text><Text style={styles.value}>{info.source || '-'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Recipient:</Text><Text style={styles.value}>{info.destination || '-'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Date:</Text><Text style={styles.value}>{timestamp ? new Date(timestamp * 1000).toLocaleString() : '-'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Signature:</Text><Text style={styles.value}>{signature}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Fee:</Text><Text style={styles.value}>{meta.fee} lamports</Text></View>
      <View style={styles.row}><Text style={styles.label}>Block/Slot:</Text><Text style={styles.value}>{slot}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Program:</Text><Text style={styles.value}>{program}</Text></View>
      <TouchableOpacity style={styles.explorerButton} onPress={handleOpenSolscan}>
        <Ionicons name="open-outline" size={20} color={COLORS.white} style={{marginRight: 8}} />
        <Text style={styles.explorerButtonText}>Open in Solscan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkSurface.modal, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: COLORS.white },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  label: { color: COLORS.greyLight, fontSize: 16, flex: 1 },
  value: { color: COLORS.white, fontSize: 16, flex: 2, textAlign: 'right' },
  explorerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, marginTop: 28, justifyContent: 'center' },
  explorerButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.darkSurface.modal },
  errorText: { color: COLORS.status.error, fontSize: 18 },
});

export default TransactionDetailsScreen; 