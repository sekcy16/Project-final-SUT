import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, query, orderBy, getDocs, where, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { app, firebaseAuth } from "../../config/firebase.config";
import { onAuthStateChanged } from 'firebase/auth';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';

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
      const currentDate = new Date().toISOString().slice(0, 10);
      const q = query(
        collection(db, `users/${userId}/TasksByDate/${currentDate}/tasks`),
        orderBy('time', 'asc')
      );
      const snapshot = await getDocs(q);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Tasks fetched:', tasksData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
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
      const currentDate = new Date().toISOString().slice(0, 10); // กำหนด currentDate
      console.log('Deleting task:', taskId);
      await deleteDoc(doc(db, `users/${userId}/TasksByDate/${currentDate}/tasks`, taskId)); // ใช้ currentDate ที่กำหนด
      fetchTasks(userId);
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  };
  

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2196F3', '#1E88E5']}
        style={styles.header}
      >
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
      </LinearGradient>

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
          ) : tasks.length > 0 ? (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <Text style={styles.taskTime}>{moment(task.time, 'HH:mm:ss').format('HH:mm')}</Text>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.task}</Text>
                  <Text style={[styles.taskDescription, task.completed && styles.taskCompleted]}>
                    {task.description || "No description provided"} 
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteTask(task.id)} style={styles.deleteButton}>
                  <Icon name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noTaskText}>คุณไม่มีงานสำหรับวันนี้</Text>
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
                    <View style={[styles.authorIndicator, { backgroundColor: '#1E88E5' }]} />
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
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
    elevation: 4,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E88E5",
    marginBottom: 16,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    elevation: 2,
  },
  taskTime: {
    width: 50,
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E88E5",
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: "#757575",
  },
  taskCompleted: {
    textDecorationLine: "line-through",
    color: "#BDBDBD",
  },
  noTaskText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  addIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 10,
    borderRadius: 25,
  },
  blogContainer: {
    margin: 16,
  },
  blogItem: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: "#FFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  blogImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  blogContent: {
    flex: 1,
    padding: 12,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  blogInfo: {
    flexDirection: "row",
    alignItems: "center",
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
  deleteButton: {
    padding: 8,
  },
});

export default DoctorHomePage;