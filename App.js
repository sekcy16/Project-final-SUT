import React, { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
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
  EditProfilePage,
  FoodDetail,
  AddTaskScreen,
  ProfileDoctor,
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

const CentralButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      top: -20,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#8FBC8F",
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
        backgroundColor: "#8FBC8F",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
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
          case "ProfilePage":
            iconName = focused ? "person" : "person-outline";
            break;
          default:
            iconName = "alert";
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#4CAF50",
      tabBarInactiveTintColor: "gray",
      tabBarStyle: {
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        height: 60,
        paddingBottom: 5,
      },
      tabBarItemStyle: {
        marginTop: 5,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        marginBottom: 3,
      },
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
      name="ProfilePage"
      component={ProfilePage}
      options={{ tabBarLabel: "Profile" }}
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
          case "HealthDashboard":
            iconName = focused ? "home" : "home-outline";
            break;
          case "MealEntry":
            iconName = focused ? "restaurant" : "chatbubbles-outline";
            break;
          case "ProfilePage":
            iconName = focused ? "person" : "person-outline";
            break;
          case "DiaryPage":
            iconName = focused ? "book" : "book-outline";
            break;
          default:
            iconName = "alert";
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#4CAF50",
      tabBarInactiveTintColor: "gray",
      tabBarStyle: {
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        height: 60,
        paddingBottom: 5,
      },
      tabBarItemStyle: {
        marginTop: 5,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        marginBottom: 3,
      },
    })}
  >
    <Tab.Screen
      name="HealthDashboard"
      component={HealthDashboard}
      options={{ tabBarLabel: "Home" }}
    />
    <Tab.Screen
      name="DiaryPage"
      component={DiaryPage}
      options={{ tabBarLabel: "Diary" }}
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
        tabBarLabel: () => null,
      }}
    />
    <Tab.Screen
      name="Blog"
      component={BlogList}
      options={{
        tabBarIcon: ({ focused, color, size }) => (
          <Icon
            name={focused ? "chatbubbles" : "chatbubbles-outline"}
            size={size}
            color={color}
          />
        ),
        tabBarLabel: "Blog",
      }}
    />

    <Tab.Screen
      name="ProfilePage"
      component={ProfilePage}
      options={{ tabBarLabel: "Profile" }}
    />
  </Tab.Navigator>
);

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
