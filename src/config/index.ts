import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from "./env"; // or adjust path based on file location

const DEFAULT_PRIVY_APP_ID = 'cmao4yp4t00aml70npjzntz2m';
const DEFAULT_PRIVY_CLIENT_ID = 'client-WY6LJYuq5ktV4GyCTSqGrb8uuqrP5n9fDbNnQZ8EJrn7Z';

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