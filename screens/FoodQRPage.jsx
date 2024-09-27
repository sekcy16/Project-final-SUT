import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import FoodQRScan from '../components/FoodQRScan';
import { useFocusEffect } from '@react-navigation/native';

const FoodQRPage = ({ navigation }) => {
  const [key, setKey] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      // Reset the camera when the screen comes into focus
      setKey(prevKey => prevKey + 1);

      // Hide the tab bar
      navigation.setOptions({
        tabBarStyle: { display: 'none' }
      });

      // Show the tab bar again when leaving this screen
      return () => {
        navigation.setOptions({
          tabBarStyle: undefined
        });
      };
    }, [navigation])
  );

  return (
    <View style={{ flex: 1 }}>
      <FoodQRScan key={key} />
    </View>
  );
};

export default FoodQRPage;