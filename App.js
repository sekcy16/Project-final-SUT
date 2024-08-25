import React, { useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native'; // Import View here
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useSelector } from "react-redux";
import Icon from 'react-native-vector-icons/Ionicons';
import Store from './context/store';

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
  PatientListScreen, 
  BloodSugar,
  NotificationListScreen,
  NotificationDetailScreen,
  PatientDetailScreen,
  AdvicePage,
  EditProfilePage
} from './screens';
import FoodResult from './components/FoodResult';
import Nutrition from './components/Nutrition';




const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CentralButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      top: -20, // elevate the central button
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#8FBC8F',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 3.5,
      elevation: 5,
    }}
    onPress={onPress}
  >
    <View
      style={{
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#8FBC8F',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2, // Add border width
        borderColor: '#fff', // Set border color (white or a lighter shade for dimension)
        shadowColor: '#000', // Deep shadow for dimensional effect
        shadowOffset: { width: 0, height: 4 }, // Adjust shadow offset
        shadowOpacity: 0.2, // Slightly reduced opacity for subtlety
        shadowRadius: 5, // Adjust shadow radius for a softer effect
      }}
    >
      {children}
    </View>
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
            case 'ProfilePage':
              iconName = focused ? 'person' : 'person-outline';
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
        elevation: 0,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        height: 60,
        shadowColor: 'transparent', // Remove shadow
        borderTopWidth: 0, // Remove top border
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
     <Tab.Screen 
      name="ProfilePage" 
      component={ProfilePage} 
      options={{ tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
);

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
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
        elevation: 0,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        height: 60,
        shadowColor: 'transparent', // Remove shadow
        borderTopWidth: 0, // Remove top border
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
          <CentralButton {...props}>
            <Icon name="camera-outline" size={25} color="#fff" />
          </CentralButton>
        ),
        tabBarLabel: () => null, // Hide label for central button
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
      <Stack.Screen name="BloodSugar" component={BloodSugar} />
      <Stack.Screen name="PatientDetailScreen" component={PatientDetailScreen}/>
      <Stack.Screen name="NotificationListScreen" component={NotificationListScreen}/>
      <Stack.Screen name="NotificationDetailScreen" component={NotificationDetailScreen}/>
      <Stack.Screen name="AdvicePage" component={ AdvicePage}/>
      <Stack.Screen name='EditProfilePage' component={ EditProfilePage}/>

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
