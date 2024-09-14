import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { app, firebaseAuth } from "../../config/firebase.config";
import { onAuthStateChanged } from 'firebase/auth';

const DoctorHomePage = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('health');
  const [tasks, setTasks] = useState([
    { id: 1, time: '9:00', title: 'Johny', description: 'ตรวจวัดระดับน้ำตาลในเลือด', completed: true },
    { id: 2, time: '10:00', title: 'Jackky', description: 'ตรวจอาการทั่วไปและการออกกำลังกาย', completed: true },
    { id: 3, time: '12:00', title: 'พักผ่อน', description: 'พัก', completed: true },
  ]);
  const [blogs, setBlogs] = useState([]);
  const [displayedBlogs, setDisplayedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // State to handle refreshing

  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null); // Clear the data if no user is logged in
      }
    });

    return () => unsubscribeAuth(); // Clean up the listener on component unmount
  }, []);

  useEffect(() => {
    fetchBlogs(); // Fetch blogs on component mount
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));

    const unsubscribeBlogs = onSnapshot(q, (snapshot) => {
      const blogData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBlogs(blogData);
      setLoading(false);
      // Update the displayed blogs
      updateDisplayedBlogs(blogData);
    }, (error) => {
      console.error("Error fetching blogs: ", error);
      setLoading(false);
    });

    return () => unsubscribeBlogs(); // Clean up the listener on component unmount
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      setUserData(userDoc.data());
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };

  const fetchBlogs = async () => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const blogData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBlogs(blogData);
      updateDisplayedBlogs(blogData);
    } catch (error) {
      console.error("Error fetching blogs: ", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayedBlogs = (blogList) => {
    // Shuffle the array and take the first 3 items
    const shuffledBlogs = blogList.sort(() => 0.5 - Math.random());
    setDisplayedBlogs(shuffledBlogs.slice(0, 3));
  };

  const handleBlogPress = (blogId) => {
    navigation.navigate('BlogDetail', { blogId });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBlogs(); // Re-fetch blogs
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <Image
            source={{
              uri: userData?.profilePic || "https://via.placeholder.com/100",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{userData?.fullName || "Username"}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={() => navigation.navigate("NotificationListScreen")}
        >
          <Icon
            name="notifications-outline"
            size={24}
            color="#FFF"
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E88E5']} // Color of the refresh spinner
          />
        }
      >
        <View style={styles.todoContainer}>
          <Text style={styles.sectionTitle}>ตารางวันนี้</Text>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <Text style={styles.taskTime}>{task.time}</Text>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={[styles.taskDescription, task.completed && styles.taskCompleted]}>
                  {task.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.blogContainer}>
          <Text style={styles.sectionTitle}>บทความ</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#1E88E5" style={styles.loader} />
          ) : (
            displayedBlogs.map((blog) => (
              <TouchableOpacity
                key={blog.id}
                style={styles.blogItem}
                onPress={() => handleBlogPress(blog.id)}
              >
                {blog.photo && <Image source={{ uri: blog.photo }} style={styles.blogImage} />}
                <View style={styles.blogContent}>
                  <Text style={styles.blogTitle}>{blog.title}</Text>
                  <View style={styles.blogInfo}>
                    <View style={[styles.authorIndicator, { backgroundColor: 'blue' }]} /> 
                    <Text style={styles.blogAuthor}>{blog.author}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD", // Light blue background
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#2196F3", // Primary blue
    elevation: 4, // Adding elevation for shadow effect
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginRight: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF", // White user name text
  },
  content: {
    flex: 1,
  },
  todoContainer: {
    backgroundColor: "#E3F2FD", // Light blue for to-do container
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4, // Adding elevation for shadow effect
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E88E5", // Darker blue for section title
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FFF", // White for task cards
    borderRadius: 10,
    elevation: 2,
  },
  taskTime: {
    width: 50,
    fontSize: 14,
    color: "#555",
  },
  taskContent: {
    flex: 1,
    marginLeft: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E88E5", // Darker blue for task title
  },
  taskCompleted: {
    color: "#4CAF50", // Green for completed task title
    textDecorationLine: "line-through",
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
  },
  blogContainer: {
    backgroundColor: "#E3F2FD", // Light blue for blog container
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4, // Adding elevation for shadow effect
  },
  blogItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#B3E5FC", // Pale blue for border
  },
  blogImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 16,
  },
  blogContent: {
    flex: 1,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E88E5", // Darker blue for blog title
  },
  blogInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  authorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  blogAuthor: {
    fontSize: 14,
    color: "#999",
  },
  notificationIcon: {
    marginRight: 16, // Add margin to the right for spacing
  },
  icon: {
    width: 24,
    height: 24,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DoctorHomePage;
