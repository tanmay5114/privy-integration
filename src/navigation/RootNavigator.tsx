import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import MainTabs from './MainTabs';
// import { RootState } from '../state/store';
// import MainTabs from './MainTabs';
// import LoginScreen from '../screens/LoginScreen/LoginScreen';
// import ChatScreen from '@/screens/ChatScreen';
// import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';

export type RootStackParamList = {
  LoginScreen: undefined;
  MainTabs: undefined;
  Chat: { id?: string; title?: string };
  ChatHistory: undefined;
  Profile: undefined;
  TransactionDetails: { transaction: any; userAddress: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
//   const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right', // Native stack animation
      }}
    >
      <> 
      <Stack.Screen name="MainTabs" component={MainTabs} />
      </>
      {/* {isLoggedIn ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
          />
          <Stack.Screen 
            name="TransactionDetails" 
            component={TransactionDetailsScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
        </>
      )} */}
    </Stack.Navigator>
  );
}