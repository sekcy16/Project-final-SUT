import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from "react-redux";
import Store from './context/store';
import Icon from 'react-native-vector-icons/Ionicons';

// นำเข้าหน้าจอทั้งหมด
import { LoginScreen, SignUpScreen, SpiashScreen, HealthDashboard , MealEntry , BloodSugar, ProfilePage, DiaryPage  } from './screens';

// สร้าง Stack Navigator
const Stack = createNativeStackNavigator();

// สร้าง Tab Navigator
const Tab = createBottomTabNavigator();

// สร้าง Tab Navigator สำหรับหน้าจอหลัก
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'HealthDashboard') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'MealEntry') {
          iconName = focused ? 'restaurant' : 'restaurant-outline';
        } else if (route.name === 'BloodSugar') {
          iconName = focused ? 'water' : 'water-outline';
        } else if (route.name === 'ProfilePage') {
          iconName = focused ? 'person' : 'person-outline';
        } else if (route.name === 'DiaryPage') {
          iconName = focused ? 'book' : 'book-outline';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4CAF50',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen 
      name="HealthDashboard" 
      component={HealthDashboard} 
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen 
      name="MealEntry" 
      component={MealEntry} 
      options={{ tabBarLabel: 'Meals' }}
    />
    <Tab.Screen 
      name="BloodSugar" 
      component={BloodSugar} 
      options={{ tabBarLabel: 'Blood Sugar' }}
    />
    <Tab.Screen 
      name="ProfilePage" 
      component={ProfilePage} 
      options={{ tabBarLabel: 'Profile' }}
    />
    <Tab.Screen 
      name="DiaryPage" 
      component={DiaryPage} 
      options={{ tabBarLabel: 'Diary' }}
    />
  </Tab.Navigator>
);

// สร้าง Stack Navigator สำหรับการนำทางหลัก
const App = () => {
  return (
    <NavigationContainer>
      <Provider store={Store}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SpiashScreen" component={SpiashScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
        </Stack.Navigator>
      </Provider>
    </NavigationContainer>
  );
};//ss

export default App;
