import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { app } from "../../config/firebase.config";
const DoctorHomePage = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([
    { id: 1, time: '9:00', title: 'Johny', description: 'ตรวจวัดระดับน้ำตาลในเลือด', completed: true },
    { id: 2, time: '10:00', title: 'Jackky', description: 'ตรวจอาการทั่วไปและการออกกำลังกาย', completed: true },
    { id: 3, time: '12:00', title: 'พักผ่อน', description: 'พัก', completed: true },
  ]);
  const [newTask, setNewTask] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [bookmarked, setBookmarked] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAllBlogs, setShowAllBlogs] = useState(false);
  const [totalBlogCount, setTotalBlogCount] = useState(0);

  const db = getFirestore(app);

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(3));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blogData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBlogs(blogData);
      setLoading(false);

      // Initialize bookmarked state
      const initialBookmarkState = blogData.reduce((acc, blog) => {
        acc[blog.id] = blog.bookmarked || false;
        return acc;
      }, {});
      setBookmarked(initialBookmarkState);
    }, (error) => {
      console.error("Error fetching blogs: ", error);
      setLoading(false);
    });//kkk

    // Get total blog count
    const countQuery = query(collection(db, 'blogs'));
    const countUnsubscribe = onSnapshot(countQuery, (snapshot) => {
      setTotalBlogCount(snapshot.size);
    });

    return () => {
      unsubscribe();
      countUnsubscribe();
    };
  }, []);

  const addTask = () => {
    if (newTask.trim() !== '') {
      setTasks([...tasks, { id: Date.now(), time: '12:00', title: newTask, description: '', completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleBookmark = (id) => {
    setBookmarked((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleBlogPress = (id) => {
    navigation.navigate('BlogDetail', { blogId: id });
  };

  const handleSeeMore = () => {
    setShowAllBlogs(true);
    // Fetch all blogs when "See More" is clicked
    const allBlogsQuery = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    onSnapshot(allBlogsQuery, (snapshot) => {
      const allBlogData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBlogs(allBlogData);
    }, (error) => {
      console.error("Error fetching all blogs: ", error);
    });
  };


  const renderBlogs = () => {
    const displayedBlogs = showAllBlogs ? blogs : blogs.slice(0, 3);
    return (
      <>
        {displayedBlogs.map((blog) => (
          <TouchableOpacity
            key={blog.id}
            style={styles.blogItem}
            onPress={() => handleBlogPress(blog.id)}
          >
            <View style={styles.blogContent}>
              <Text style={styles.blogTitle}>{blog.title}</Text>
              <View style={styles.blogInfo}>
                <View style={[styles.authorIndicator, { backgroundColor: blog.category === 'health' ? 'green' : 'orange' }]} />
                <Text style={styles.blogAuthor}>By {blog.author}</Text>
                <Text style={styles.blogCategory}>{blog.category}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => toggleBookmark(blog.id)}>
              <Icon
                name={bookmarked[blog.id] ? "bookmark" : "bookmark-outline"}
                size={24}
                color={bookmarked[blog.id] ? "#FFC107" : "#000"}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        {!showAllBlogs && totalBlogCount > 3 && (
          <TouchableOpacity style={styles.seeMoreButton} onPress={handleSeeMore}>
            <Text style={styles.seeMoreText}>See More</Text>
            <Icon name="chevron-down-outline" size={20} color="#2196F3" />
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <Icon name="person-circle-outline" size={40} color="#FFF" />
          <Text style={styles.profileText}>Dr.KK</Text>
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

      <ScrollView style={styles.content}>
        <View style={styles.todoContainer}>
          <Text style={styles.sectionTitle}>ตารางวันนี้</Text>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <Text style={styles.taskTime}>{task.time}</Text>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>{task.title}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
              </View>
              <View style={styles.taskActions}>
                <TouchableOpacity onPress={() => toggleTask(task.id)}>
                  <Icon name={task.completed ? "checkmark-circle" : "ellipse-outline"} size={24} color={task.completed ? "#2196F3" : "#000"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                  <Icon name="close-circle-outline" size={24} color="#FF5722" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={styles.addTaskContainer}>
            <TextInput
              style={styles.input}
              value={newTask}
              onChangeText={setNewTask}
              placeholder="เพิ่มงานใหม่"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <Icon name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.blogContainer}>
          <Text style={styles.sectionTitle}>บทความ</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
          ) : (
            renderBlogs()
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
  profileText: {
    color: "#FFF", // White profile text
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
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
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  addTaskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#B3E5FC", // Pale blue for input border
    borderRadius: 5,
    padding: 10,
    marginRight: 8,
    backgroundColor: "#FFF", // White for input background
  },
  addButton: {
    backgroundColor: "#1E88E5", // Blue for add button
    borderRadius: 5,
    padding: 10,
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
    marginTop: 20,
  },
  blogCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8FBC8F',
    marginLeft: 8,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 10,
  },
  seeMoreText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
});

export default DoctorHomePage;
