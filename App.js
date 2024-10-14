import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Modal, Animated, Dimensions } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Provider, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/Ionicons";
import Store from "./context/store";
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
// Import your screens and components
import {
  LoginScreen,
  SignUpScreen,
  SplashScreen as CustomSplashScreen,
  HealthDashboard,
  MealEntry,
  UserProfilePage,
  DoctorProfilePage,
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
  EditProfilePage,
  FoodDetail,
  AddTaskScreen,
  ProfileDoctor,
  ScheduleScreen,
  AddFood,
  FoodQRPage,
  RelativesListScreen,
} from "./screens";

// Import other components
import FoodResult from "./components/FoodResult";
import FoodQRResult from "./components/FoodQRResult";
import Nutrition from "./components/Nutrition";
import TotalCalories from "./screens/TotalCalories";
import ExerciseEntry from "./screens/ExerciseEntry";
import WeightProgress from "./screens/WeightProgress";
import BlogDetail from "./screens/BlogDetail";
import CreateBlogScreen from "./screens/CreateBlogScreen";
import BookmarkListPage from "./screens/BookmarkListPage";
import SummaryPage from "./screens/SummaryPage";
import 'react-native-gesture-handler';
import { TransitionPresets } from '@react-navigation/stack';
import StepHistoryScreen from './screens/StepHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { height } = Dimensions.get('window');


// SearchModal Component
const SearchModal = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#333" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="ค้นหาอาหาร"
              placeholderTextColor="#999"
              autoFocus={true}
            />
          </View>
          {/* Add your search results or other content here */}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// SearchBar Component
const SearchBar = () => {
  const navigation = useNavigation();

  const handleSearchPress = () => {
    navigation.navigate('AddFood');
  };

  const handleBarcodePress = () => {
    navigation.navigate('FoodQRPage');
  };

  return (
    <View style={styles.searchBarContainer}>
      <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
        <Icon name="search" size={20} color="#fff" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>ค้นหาอาหาร</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleBarcodePress} style={styles.barcodeButton}>
        <Icon
          name="barcode-outline"
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
};

// CustomTabBar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <LinearGradient
      colors={['#4A90E2', '#50E3C2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.tabContainer}
    >
      <View style={styles.tabContent}>
        {(state.index === 0 || state.index === 1) && <SearchBar />}
        <View style={styles.tabButtonContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabButton}
              >
                <Icon
                  name={options.tabBarIcon({ focused: isFocused, color: isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.7)', size: 24 }).props.name}
                  size={24}
                  color={isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
                />
                <Text style={[styles.tabLabel, { color: isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.7)' }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </LinearGradient>
  );
};


// MainTabNavigator Component
const MainTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === "หน้าหลัก") {
          iconName = focused ? "grid" : "grid-outline";
        } else if (route.name === "ไดอารี่") {
          iconName = focused ? "book" : "book-outline";
        } else if (route.name === "บทความ") {
          iconName = focused ? "chatbubbles" : "chatbubbles-outline";
        } else if (route.name === "โปรไฟล์") {
          iconName = focused ? "person" : "person-outline";
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="หน้าหลัก" component={HealthDashboard} />
    <Tab.Screen name="ไดอารี่" component={DiaryPage} />
    <Tab.Screen name="บทความ" component={BlogList} />
    <Tab.Screen name="โปรไฟล์" component={UserProfilePage} />
  </Tab.Navigator>
);
// DoctorTabNavigator Component
const DoctorTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
          case "DoctorHomePage":
            iconName = focused ? "home" : "home-outline";
            break;
          case "PatientListScreen":
            iconName = focused ? "list" : "list-outline";
            break;
          case "BlogList":
            iconName = focused ? "document" : "document-outline";
            break;
          case "DoctorProfilePage":
            iconName = focused ? "person" : "person-outline";
            break;
          default:
            iconName = "alert";
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#007AFF",
      tabBarInactiveTintColor: "#8E8E93",
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabBarLabel,
    })}
  >
    <Tab.Screen
      name="DoctorHomePage"
      component={DoctorHomePage}
      options={{ tabBarLabel: "Home" }}
    />
    <Tab.Screen
      name="PatientListScreen"
      component={PatientListScreen}
      options={{ tabBarLabel: "Patients" }}
    />
    <Tab.Screen
      name="BlogList"
      component={BlogList}
      options={{ tabBarLabel: "Blog" }}
    />
    <Tab.Screen
      name="DoctorProfilePage"
      component={DoctorProfilePage}
      options={{ tabBarLabel: "Profile" }}
    />
  </Tab.Navigator>
);

// RootNavigator Component
const RootNavigator = () => {
  const user = useSelector((state) => state.user?.user);

  useEffect(() => {
    console.log("Current User:", user);
  }, [user]);

  const NavigatorComponent =
    user?.role === "Doctor" ? DoctorTabNavigator : MainTabNavigator;

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        ...TransitionPresets.ModalPresentationIOS, // This adds a slide-up animation
      }}
    >
      <Stack.Screen name="SplashScreen" component={CustomSplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen name="Main" component={NavigatorComponent} />
      <Stack.Screen name="MealEntry" component={MealEntry} />
      <Stack.Screen name="FoodARPage" component={FoodARPage} />
      <Stack.Screen name="TotalCalories" component={TotalCalories} />
      <Stack.Screen name="FoodResultPage" component={FoodResultPage} />
      <Stack.Screen name="FoodResult" component={FoodResult} />
      <Stack.Screen name="Nutrition" component={Nutrition} />
      <Stack.Screen name="ExerciseEntry" component={ExerciseEntry} />
      <Stack.Screen name="BloodSugar" component={BloodSugar} />
      <Stack.Screen name="WeightProgress" component={WeightProgress} />
      <Stack.Screen name="PatientDetailScreen" component={PatientDetailScreen} />
      <Stack.Screen name="NotificationListScreen" component={NotificationListScreen} />
      <Stack.Screen name="NotificationDetailScreen" component={NotificationDetailScreen} />
      <Stack.Screen name="AdvicePage" component={AdvicePage} />
      <Stack.Screen name="EditProfilePage" component={EditProfilePage} />
      <Stack.Screen name="BlogList" component={BlogList} />
      <Stack.Screen name="BlogDetail" component={BlogDetail} />
      <Stack.Screen name="CreateBlogScreen" component={CreateBlogScreen} />
      <Stack.Screen name="FoodDetail" component={FoodDetail} />
      <Stack.Screen name="AddTaskScreen" component={AddTaskScreen} />
      <Stack.Screen name="ProfileDoctor" component={ProfileDoctor} />
      <Stack.Screen name="BookmarkListPage" component={BookmarkListPage} />
      <Stack.Screen name="SummaryPage" component={SummaryPage} />
      <Stack.Screen name="UserProfilePage" component={UserProfilePage} />
      <Stack.Screen name="DoctorProfilePage" component={DoctorProfilePage} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="RelativesListScreen" component={RelativesListScreen} />
      <Stack.Screen 
        name="AddFood" 
        component={AddFood}
        options={{
          gestureEnabled: true,
          cardOverlayEnabled: true,
          ...TransitionPresets.ModalPresentationIOS,
        }}
      />
      <Stack.Screen name="FoodQRPage" component={FoodQRPage} />
      <Stack.Screen name="FoodQRResult" component={FoodQRResult} />
      <Stack.Screen name="StepHistory" component={StepHistoryScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

// App Component
const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
          'Kanit-Light' : require('./assets/fonts/Kanit-Light.ttf'),
          'Kanit-Regular': require('./assets/fonts/Kanit-Regular.ttf'),
          'Kanit-Bold': require('./assets/fonts/Kanit-Bold.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={Store}>
      <NavigationContainer onReady={onLayoutRootView}>
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
};

// Styles
const styles = StyleSheet.create({
  tabContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabContent: {
    paddingTop: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 40,
    flex: 1,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchPlaceholder: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: 'Kanit-Regular',
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#fff",
    fontFamily: 'Kanit-Regular',
  },
  barcodeIcon: {
    marginLeft: 10,
  },
  barcodeButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  tabButtonContainer: {
    flexDirection: 'row',
    height: 60,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Kanit-Regular',
  },
  tabBarLabel: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '80%', // You can adjust this value
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#333',
    fontFamily: 'Kanit-Regular',
  },
});

export default App;