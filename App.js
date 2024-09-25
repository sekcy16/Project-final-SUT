import React, { useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Provider, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/Ionicons";
import Store from "./context/store";


// Import your screens and components
import {
  LoginScreen,
  SignUpScreen,
  SplashScreen,
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
  AddFood, // เพิ่ม import สำหรับหน้า AddFood
} from "./screens";
import FoodResult from "./components/FoodResult";
import Nutrition from "./components/Nutrition";
import TotalCalories from "./screens/TotalCalories";
import ExerciseEntry from "./screens/ExerciseEntry";
import WeightProgress from "./screens/WeightProgress";
import BlogDetail from "./screens/BlogDetail";
import CreateBlogScreen from "./screens/CreateBlogScreen";
import BookmarkListPage from "./screens/BookmarkListPage";
import SummaryPage from "./screens/SummaryPage";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


// SearchBar Component
const SearchBar = () => {
  const navigation = useNavigation();

  const handleSearchPress = () => {
    navigation.navigate('AddFood');
  };

  const handleBarcodePress = () => {
    navigation.navigate('FoodARPage');
  };

  return (
    <View style={styles.searchBarContainer}>
      <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
        <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a food"
          placeholderTextColor="#888"
          editable={false}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleBarcodePress}>
        <Icon
          name="barcode-outline"
          size={20}
          color="#888"
          style={styles.barcodeIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

// CustomTabBar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabContainer}>
      {(state.index === 0 || state.index === 1) && <SearchBar />}
      <View style={styles.tabBar}>
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
                name={options.tabBarIcon({ focused: isFocused }).props.name}
                size={24}
                color={isFocused ? '#007AFF' : '#8E8E93'}
              />
              <Text style={[styles.tabLabel, { color: isFocused ? '#007AFF' : '#8E8E93' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
        if (route.name === "Dashboard") {
          iconName = focused ? "grid" : "grid-outline";
        } else if (route.name === "Diary") {
          iconName = focused ? "book" : "book-outline";
        } else if (route.name === "Blog") {
          iconName = focused ? "chatbubbles" : "chatbubbles-outline";
        } else if (route.name === "UserProfilePage") {
          iconName = focused ? "person" : "person-outline";
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={HealthDashboard} />
    <Tab.Screen name="Diary" component={DiaryPage} />
    <Tab.Screen name="Blog" component={BlogList} />
    <Tab.Screen name="UserProfilePage" component={UserProfilePage} />
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
  console.log(
    "Navigator Selected:",
    NavigatorComponent === DoctorTabNavigator
      ? "DoctorTabNavigator"
      : "MainTabNavigator"
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
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
      <Stack.Screen
        name="PatientDetailScreen"
        component={PatientDetailScreen}
      />
      <Stack.Screen
        name="NotificationListScreen"
        component={NotificationListScreen}
      />
      <Stack.Screen
        name="NotificationDetailScreen"
        component={NotificationDetailScreen}
      />
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
      <Stack.Screen name="AddFood" component={AddFood} />
    </Stack.Navigator>
  );
};

// App Component
const App = () => (
  <Provider store={Store}>
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  </Provider>
);

// Styles
const styles = StyleSheet.create({
  tabContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  searchBarContainer: {
    backgroundColor: "#F2F2F7",
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    flex: 1,
  },
  barcodeIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#000",
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#000",
  },
  barcodeIcon: {
    marginLeft: 5,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabBarLabel: {
    fontSize: 12,
  },
});

export default App;
