import React, {useState, useRef, useEffect} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  Platform,
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {useNavigation, ParamListBase} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';

import Icons from '../assets/svgs';
import AnimatedTabIcon from './AnimatedTabIcon';
import ChatScreen from '../screens/ChatScreen';
import ChatHistoryScreen from '../screens/ChatHistoryScreen';

const Tab = createBottomTabNavigator();
const {width} = Dimensions.get('window');

const iconStyle = {
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 10},
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
};

export default function MainTabs() {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();

  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: 'black',
        tabBarStyle: {
          paddingTop: Platform.OS === 'android' ? 5 : 10,
          backgroundColor: '#121212',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
      }}>
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({focused, size}) => (
            <AnimatedTabIcon
              focused={focused}
              size={size * 1.15}
              icon={
                Icons.HomeIcon as React.ComponentType<{
                  width: number;
                  height: number;
                }>
              }
              iconSelected={
                Icons.HomeIconSelected as React.ComponentType<{
                  width: number;
                  height: number;
                }>
              }
              style={{
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 15},
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 6,
              }}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="ChatHistory"
        component={ChatHistoryScreen}
        options={{
          tabBarIcon: ({focused, size}) => (
            <AnimatedTabIcon
              focused={focused}
              size={size * 1}
              icon={
                Icons.MagnifyingGlass as React.ComponentType<{
                  width: number;
                  height: number;
                }>
              }
              iconSelected={
                Icons.MagnifyingGlassSelected as React.ComponentType<{
                  width: number;
                  height: number;
                }>
              }
              style={iconStyle}
            />
          ),
        }}
      />
      
      
    </Tab.Navigator>
  );
}