import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing, Image } from 'react-native';

const swapLoadingImage = require('../assets/images/sendloader1.png');


const SwapLoadingScreen: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.imageCircle,
          { transform: [{ rotate: spin }] }
        ]}
      >
        <Image
          source={swapLoadingImage}
          style={styles.loadingImage}
          resizeMode="cover"
        />
      </Animated.View>
      <Text style={styles.loadingText}>Sending your tokens...</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10151A',
  },
  imageCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    overflow: 'hidden',
  },
  loadingImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'System',
    marginBottom: 20,
  },
  spinner: {},
});

export default SwapLoadingScreen; 