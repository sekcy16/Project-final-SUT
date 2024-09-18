import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { app, firebaseAuth } from "../../config/firebase.config";
import { onAuthStateChanged } from 'firebase/auth';

const DoctorHomePage = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [displayedBlogs, setDisplayedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        setUserId(user.uid);
        fetchUserData(user.uid);
        fetchTasks(user.uid);
        fetchBlogs();
      } else {
        console.log('No user authenticated');
        setUserData(null);
        setUserId(null);
      }
    });
  
    return () => unsubscribeAuth();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      console.log('Fetching user data for:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        console.log('User data found:', userDoc.data());
        setUserData(userDoc.data());
      } else {
        console.log('No user data found for:', userId);
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };

  const fetchTasks = async (userId) => {
    try {
      console.log('Fetching tasks for user:', userId);
      const q = query(collection(db, `users/${userId}/tasks`), orderBy('time', 'asc'));
      const snapshot = await getDocs(q);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Tasks fetched:', tasksData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
      // More detailed error logging
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      if (error.details) console.error("Error details:", error.details);
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
    const shuffledBlogs = blogList.sort(() => 0.5 - Math.random());
    setDisplayedBlogs(shuffledBlogs.slice(0, 3));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('Refreshing data...');
    if (userId) {
      await fetchTasks(userId);
      await fetchBlogs();
    } else {
      console.error('No user ID available for refresh');
    }
    setRefreshing(false);
  };

  const handleAddTask = () => {
    navigation.navigate('AddTaskScreen');
  };

  const handleBlogPress = (blogId) => {
    navigation.navigate('BlogDetail', { blogId });
  };

  const handleDeleteTask = async (taskId) => {
    try {
      console.log('Deleting task:', taskId);
      await deleteDoc(doc(db, `users/${userData.id}/tasks`, taskId));
      fetchTasks(userData.id);
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
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
          style={styles.addIcon} 
          onPress={handleAddTask}
        >
          <Icon name="add-outline" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E88E5']}
          />
        }
      >
        {/* Task Section */}
        <View style={styles.todoContainer}>
          <Text style={styles.sectionTitle}>ตารางวันนี้</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#1E88E5" />
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <Text style={styles.taskTime}>{task.time}</Text>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={[styles.taskDescription, task.completed && styles.taskCompleted]}>
                    {task.description}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                  <Icon name="trash-outline" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Blog Section */}
        <View style={styles.blogContainer}>
          <Text style={styles.sectionTitle}>บทความ</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#1E88E5" />
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
    backgroundColor: "#E3F2FD",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#2196F3",
    elevation: 4,
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
    color: "#FFF",
  },
  content: {
    flex: 1,
  },
  todoContainer: {
    backgroundColor: "#E3F2FD",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E88E5",
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FFF",
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
    color: "#1E88E5",
  },
  taskCompleted: {
    color: "#4CAF50",
    textDecorationLine: "line-through",
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
  },
  blogContainer: {
    backgroundColor: "#E3F2FD",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
  },
  blogItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#B3E5FC",
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E88E5",
  },
  blogInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  authorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  blogAuthor: {
    fontSize: 14,
    color: "#757575",
  },
  addIcon: {
    marginRight: 16,
  },
});

export default DoctorHomePage;
