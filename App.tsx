import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { StatusBar } from 'react-native';
import {PrivyProvider } from '@privy-io/expo';
import {PrivyElements} from '@privy-io/expo/ui';
import {DefaultCustomizationConfig} from './src/config';
import {CustomizationProvider} from './src/CustomizationProvider';
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from "./src/config/env"; // or adjust path based on file location


export default function App() {
  const config = DefaultCustomizationConfig;
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={false}
      />
      <CustomizationProvider>
        <PrivyProvider
          appId={PRIVY_APP_ID}
          clientId={PRIVY_CLIENT_ID}
          config={{
            embedded: {
              solana: {
                createOnLogin: 'users-without-wallets',
              },
            },
          }}>  
        <PrivyElements />
        </PrivyProvider>
      </CustomizationProvider>
    </SafeAreaProvider>
  );
}
