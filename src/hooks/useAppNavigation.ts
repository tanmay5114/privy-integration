import {
  createNavigationContainerRef,
  useNavigation,
  CompositeNavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Feed: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function useAppNavigation() {
  return useNavigation<RootNavigationProp>();
}