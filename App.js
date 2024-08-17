import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import Store from './context/store'; // Adjust the path to your actual store file
import Icon from 'react-native-vector-icons/Ionicons';
import HealthDashboard from './screens/HealthDashboard';
import MealEntry from './screens/MealEntry';
import ProfilePage from './screens/ProfilePage';
import DiaryPage from './screens/DiaryPage';
import FoodARPage from './screens/FoodARPage';
import SplashScreen from './screens/SplashScreen'; // Corrected the path
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import FoodResultPage from './screens/FoodResultPage';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CentralButton = ({ onPress }) => (
  <TouchableOpacity
    style={{
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    }}
    onPress={onPress}
  >
    <Icon name="add" size={30} color="#fff" />
  </TouchableOpacity>
);

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch(route.name) {
          case 'HealthDashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'MealEntry':
            iconName = focused ? 'restaurant' : 'restaurant-outline';
            break;
          case 'ProfilePage':
            iconName = focused ? 'person' : 'person-outline';
            break;
          case 'DiaryPage':
            iconName = focused ? 'book' : 'book-outline';
            break;
          default:
            iconName = 'alert'; // fallback icon
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
      name="FoodARPage"
      component={FoodARPage}
      options={{
        tabBarButton: (props) => (
          <CentralButton {...props} />
        ),
        tabBarLabel: () => null,
      }}
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

const App = () => (
  <NavigationContainer>
    <Provider store={Store}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="FoodARPage" component={FoodARPage} />
        <Stack.Screen name="FoodResultPage" component={FoodResultPage} />
      </Stack.Navigator>
    </Provider>
  </NavigationContainer>
);

export default App;
