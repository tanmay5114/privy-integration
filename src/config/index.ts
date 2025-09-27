import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from "./env"; // or adjust path based on file location

const DEFAULT_PRIVY_APP_ID = '';
const DEFAULT_PRIVY_CLIENT_ID = '';

console.log("privy app is: ", PRIVY_APP_ID);

export interface PrivyConfig {
  appId: string;
  clientId: string;
}

export interface AuthProviderConfig {
  provider: 'privy';
  loginMethods: Array<'email' | 'sms' | 'google' | 'apple'>;
  privy: PrivyConfig;
}

export const DefaultAuthConfig: AuthProviderConfig = {
  provider: 'privy',
  loginMethods: ['email', 'google', 'apple'],

  privy: {
    appId: PRIVY_APP_ID || DEFAULT_PRIVY_APP_ID,
    clientId: PRIVY_CLIENT_ID || DEFAULT_PRIVY_CLIENT_ID,
  },
};

export interface CustomizationConfig {
  auth: AuthProviderConfig;
}

export const DefaultCustomizationConfig: CustomizationConfig = {
  auth: DefaultAuthConfig,
};