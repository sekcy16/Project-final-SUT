import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useSelector } from "react-redux"; // Import useSelector here
import Store from './context/store';
import Icon from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';
import { 
  LoginScreen, 
  SignUpScreen, 
  SplashScreen, 
  HealthDashboard, 
  MealEntry, 
  ProfilePage, 
  DiaryPage, 
  FoodARPage, 
  FoodResultPage, 
  DoctorHomePage, 
  BlogList, 
  PatientListScreen 
} from './screens';
import FoodResult from './components/FoodResult';
import Nutrition from './components/Nutrition';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

const DoctorTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch(route.name) {
          case 'DoctorHomePage':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'PatientListScreen':
            iconName = focused ? 'list' : 'list-outline';
            break;
          case 'BlogList':
            iconName = focused ? 'document' : 'document-outline';
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
      name="DoctorHomePage" 
      component={DoctorHomePage} 
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen 
      name="PatientListScreen" 
      component={PatientListScreen} 
      options={{ tabBarLabel: 'Patients' }}
    />
    <Tab.Screen 
      name="BlogList" 
      component={BlogList} 
      options={{ tabBarLabel: 'Blogs' }}
    />
  </Tab.Navigator>
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




const RootNavigator = () => {
  const user = useSelector((state) => state.user?.user); // Access the nested user object

  useEffect(() => {
    console.log('Current User:', user); // Log to confirm
  }, [user]);

  const NavigatorComponent = user?.role === 'Doctor' ? DoctorTabNavigator : MainTabNavigator;
  console.log('Navigator Selected:', NavigatorComponent === DoctorTabNavigator ? 'DoctorTabNavigator' : 'MainTabNavigator');

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen name="Main" component={NavigatorComponent} />
      <Stack.Screen name="FoodARPage" component={FoodARPage} />
      <Stack.Screen name="FoodResultPage" component={FoodResultPage} />
      <Stack.Screen name="FoodResult" component={FoodResult} />
      <Stack.Screen name="Nutrition" component={Nutrition} />
    </Stack.Navigator>
  );
};


const App = () => (
  <Provider store={Store}>
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  </Provider>
);

export default App;
