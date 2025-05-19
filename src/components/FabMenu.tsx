// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import COLORS from 'src/assets/colors';
// import * as Clipboard from 'expo-clipboard';
// import { useFundWallet } from '../walletProviders/hooks/useFundWallet';

// interface FabMenuProps {
//   visible: boolean;
//   onClose: () => void;
//   onSend?: () => void;
//   onReceive?: () => void;
// }

// export default function FabMenu({ visible, onClose, onSend, onReceive }: FabMenuProps) {
//   const { fundWallet } = useFundWallet();

//   const handleFundWallet = async () => {
//     try {
//       await fundWallet();
//       onClose(); // Close the menu after initiating funding
//     } catch (error: any) {
//       Alert.alert('Funding Error', error.message || 'Failed to fund wallet');
//     }
//   };

//   const actions = [
//     { label: 'Send', icon: 'paper-plane-outline', onPress: onSend },
//     { label: 'Receive', icon: 'qr-code-outline', onPress: onReceive },
//     { label: 'Fund', icon: 'wallet-outline', onPress: handleFundWallet },
//   ];

//   return (
//     <Modal visible={visible} transparent animationType="fade">
//       <View style={styles.overlay}>
//         <View style={styles.menu}>
//           {actions.map((action, idx) => (
//             <View key={action.label} style={styles.actionRow}>
//               <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
//                 <Ionicons name={action.icon as any} size={32} color="#222" />
//               </TouchableOpacity>
//               <Text style={styles.actionLabel}>{action.label}</Text>
//             </View>
//           ))}
//           <TouchableOpacity style={styles.closeButton} onPress={onClose}>
//             <Ionicons name="close" size={36} color={COLORS.brandPrimary} />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(10,20,30,0.7)',
//     justifyContent: 'flex-end',
//     alignItems: 'flex-end',
//     padding: 24,
//   },
//   menu: {
//     alignItems: 'flex-end',
//   },
//   actionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 18,
//   },
//   actionButton: {
//     backgroundColor: '#e6f8f7',
//     borderRadius: 32,
//     width: 64,
//     height: 64,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     elevation: 4,
//   },
//   actionLabel: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '500',
//   },
//   closeButton: {
//     backgroundColor: COLORS.darkBg.secondary,
//     borderRadius: 32,
//     width: 64,
//     height: 64,
//     alignItems: 'center',
//     justifyContent: 'center',
//     alignSelf: 'flex-end',
//     marginTop: 8,
//   },
// }); 
// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, TextInput } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import COLORS from 'src/assets/colors';
// import * as Clipboard from 'expo-clipboard';
// import { useFundWallet } from '../walletProviders/hooks/useFundWallet';

// interface FabMenuProps {
//   visible: boolean;
//   onClose: () => void;
//   onSend?: () => void;
//   onReceive?: () => void;
// }

// export default function FabMenu({ visible, onClose, onSend, onReceive }: FabMenuProps) {
//   const { fundWallet } = useFundWallet();
//   const [showFundModal, setShowFundModal] = useState(false);
//   const [fundAmount, setFundAmount] = useState('0.01'); // Default amount
  
//   const handleFundWallet = async () => {
//     try {
//       // First show the funding modal with amount input
//       setShowFundModal(true);
//     } catch (error: any) {
//       Alert.alert('Funding Error', error.message || 'Failed to fund wallet');
//     }
//   };
  
//   const processFunding = async () => {
//     try {
//       // Close fund amount modal
//       setShowFundModal(false);
      
//       // Now call fundWallet with the amount
//       await fundWallet(fundAmount);
      
//       // Close the menu after successful funding
//       onClose();
//     } catch (error: any) {
//       Alert.alert('Funding Error', error.message || 'Failed to fund wallet');
//     }
//   };

//   const actions = [
//     { label: 'Send', icon: 'paper-plane-outline', onPress: onSend },
//     { label: 'Receive', icon: 'qr-code-outline', onPress: onReceive },
//     { label: 'Fund', icon: 'wallet-outline', onPress: handleFundWallet },
//   ];

//   return (
//     <>
//       <Modal visible={visible} transparent animationType="fade">
//         <View style={styles.overlay}>
//           <View style={styles.menu}>
//             {actions.map((action, idx) => (
//               <View key={action.label} style={styles.actionRow}>
//                 <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
//                   <Ionicons name={action.icon as any} size={32} color="#222" />
//                 </TouchableOpacity>
//                 <Text style={styles.actionLabel}>{action.label}</Text>
//               </View>
//             ))}
//             <TouchableOpacity style={styles.closeButton} onPress={onClose}>
//               <Ionicons name="close" size={36} color={COLORS.brandPrimary} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
      
//       {/* Fund Amount Modal */}
//       <Modal visible={showFundModal} transparent animationType="fade">
//         <View style={styles.overlay}>
//           <View style={styles.fundModal}>
//             <Text style={styles.fundTitle}>Fund Wallet</Text>
//             <Text style={styles.fundSubtitle}>Enter amount to fund</Text>
            
//             <TextInput
//               style={styles.amountInput}
//               value={fundAmount}
//               onChangeText={setFundAmount}
//               keyboardType="decimal-pad"
//               placeholder="Enter amount"
//               placeholderTextColor="#999"
//             />
            
//             <View style={styles.fundButtons}>
//               <TouchableOpacity 
//                 style={[styles.fundButton, styles.cancelButton]} 
//                 onPress={() => setShowFundModal(false)}
//               >
//                 <Text style={styles.buttonText}>Cancel</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity 
//                 style={[styles.fundButton, styles.confirmButton]} 
//                 onPress={processFunding}
//               >
//                 <Text style={styles.buttonText}>Confirm</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(10,20,30,0.7)',
//     justifyContent: 'flex-end',
//     alignItems: 'flex-end',
//     padding: 24,
//   },
//   menu: {
//     alignItems: 'flex-end',
//   },
//   actionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 18,
//   },
//   actionButton: {
//     backgroundColor: '#e6f8f7',
//     borderRadius: 32,
//     width: 64,
//     height: 64,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     elevation: 4,
//   },
//   actionLabel: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '500',
//   },
//   closeButton: {
//     backgroundColor: COLORS.darkBg.secondary,
//     borderRadius: 32,
//     width: 64,
//     height: 64,
//     alignItems: 'center',
//     justifyContent: 'center',
//     alignSelf: 'flex-end',
//     marginTop: 8,
//   },
//   fundModal: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 24,
//     width: '100%',
//     alignItems: 'center',
//   },
//   fundTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     color: '#222',
//   },
//   fundSubtitle: {
//     fontSize: 16,
//     color: '#666',
//     marginBottom: 24,
//   },
//   amountInput: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 12,
//     width: '100%',
//     fontSize: 18,
//     marginBottom: 24,
//   },
//   fundButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//   },
//   fundButton: {
//     padding: 16,
//     borderRadius: 8,
//     width: '48%',
//     alignItems: 'center',
//   },
//   cancelButton: {
//     backgroundColor: '#f2f2f2',
//   },
//   confirmButton: {
//     backgroundColor: COLORS.brandPrimary,
//   },
//   buttonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },
// });
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from 'src/assets/colors';
import * as Clipboard from 'expo-clipboard';
import { useFundWallet } from '../walletProviders/hooks/useFundWallet';

interface FabMenuProps {
  visible: boolean;
  onClose: () => void;
  onSend?: () => void;
  onReceive?: () => void;
}

export default function FabMenu({ visible, onClose, onSend, onReceive }: FabMenuProps) {
  const { fundWallet } = useFundWallet();
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('0.01');
  
  const handleFundWallet = async () => {
    try {
      setShowFundModal(true);
    } catch (error: any) {
      Alert.alert('Funding Error', error.message || 'Failed to fund wallet');
    }
  };
  
  const processFunding = async () => {
    try {
      setShowFundModal(false);
      
      // Just pass the amount - the payment method selection will be handled by Privy
      await fundWallet(fundAmount);
      
      onClose();
    } catch (error: any) {
      Alert.alert('Funding Error', error.message || 'Failed to fund wallet');
    }
  };

  const actions = [
    { label: 'Send', icon: 'paper-plane-outline', onPress: onSend },
    { label: 'Receive', icon: 'qr-code-outline', onPress: onReceive },
    { label: 'Fund', icon: 'wallet-outline', onPress: handleFundWallet },
  ];

  return (
    <>
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
      
      {/* Fund Amount Modal */}
      <Modal visible={showFundModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.fundModal}>
            <Text style={styles.fundTitle}>Fund Wallet</Text>
            <Text style={styles.fundSubtitle}>Enter amount to fund</Text>
            
            <TextInput
              style={styles.amountInput}
              value={fundAmount}
              onChangeText={setFundAmount}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor="#999"
            />
            
            <View style={styles.fundButtons}>
              <TouchableOpacity 
                style={[styles.fundButton, styles.cancelButton]} 
                onPress={() => setShowFundModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.fundButton, styles.confirmButton]} 
                onPress={processFunding}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
            
            {/* Payment options note */}
            <Text style={styles.paymentNote}>
              You'll be prompted to select a payment method on the next screen
            </Text>
          </View>
        </View>
      </Modal>
    </>
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
  fundModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  fundTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  fundSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    fontSize: 18,
    marginBottom: 24,
  },
  fundButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  fundButton: {
    padding: 16,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  confirmButton: {
    backgroundColor: COLORS.brandPrimary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  paymentNote: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  }
});