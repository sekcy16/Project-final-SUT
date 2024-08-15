import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from "react-redux";
import Store from './context/store';
import Icon from 'react-native-vector-icons/Ionicons';

import { LoginScreen, SignUpScreen, SpiashScreen, HealthDashboard, MealEntry, BloodSugar, ProfilePage, DiaryPage, FoodARPage, FoodResultPage } from './screens';
import  FoodResult from './components/FoodResult';
import Nutrition from './components/Nutrition';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
      tabBarStyle: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        elevation: 0,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        height: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        paddingHorizontal: 20,
      },
      tabBarItemStyle: {
        marginTop: 10,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        marginBottom: 5,
      },
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

const App = () => {
  return (
    <NavigationContainer>
      <Provider store={Store}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SpiashScreen" component={SpiashScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="FoodARPage" component={FoodARPage} />
          <Stack.Screen name="FoodResultPage" component={FoodResultPage} />
          <Stack.Screen name="FoodResult" component={FoodResult} />
          <Stack.Screen name="Nutrition" component={Nutrition} />

        </Stack.Navigator>
      </Provider>
    </NavigationContainer>
  );
};

export default App;
