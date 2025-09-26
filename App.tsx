import { ScreenContent } from 'components/ScreenContent';

import './global.css';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <>
      {/* <ScreenContent title="Home" path="App.tsx"></ScreenContent> */}
      <View>
        <Text className='bg-red-500 mt-20'>
          Hi, hello how are you
        </Text>
        <Text className='bg-yellow-500'>
          See mee
        </Text>

      </View>
    </>
  );
}
