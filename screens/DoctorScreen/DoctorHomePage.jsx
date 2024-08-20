import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

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

  useEffect(() => {
    const initialBlogs = [
      { id: 1, title: 'แนวทางการออกกำลังกายสำหรับผู้ป่วยเบาหวาน', author: 'Dr.K', color: 'red', bookmarked: false },
      { id: 2, title: 'วิธีจัดการความเครียด จากการออกกำลังกาย', author: 'Dr.C', color: 'green', bookmarked: true },
      { id: 3, title: 'ไฟเบอร์คืออะไร? ทำไมทุกคนควรกินไฟเบอร์?', author: 'Dr.A', color: 'blue', bookmarked: false },
    ];
    setBlogs(initialBlogs);
    const initialBookmarkState = initialBlogs.reduce((acc, blog) => {
      acc[blog.id] = blog.bookmarked;
      return acc;
    }, {});
    setBookmarked(initialBookmarkState);
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
    // Navigate to blog detail page or any other action
    console.log('Blog ID:', id);
    // Example navigation:
    // navigation.navigate('BlogDetail', { blogId: id });
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
            color="#000"
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
                  <Icon name={task.completed ? "checkmark-circle" : "ellipse-outline"} size={24} color={task.completed ? "#4CAF50" : "#000"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                  <Icon name="close-circle-outline" size={24} color="#FF0000" />
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
          {blogs.map((blog) => (
            <TouchableOpacity
              key={blog.id}
              style={styles.blogItem}
              onPress={() => handleBlogPress(blog.id)}
            >
              <View style={styles.blogContent}>
                <Text style={styles.blogTitle}>{blog.title}</Text>
                <View style={styles.blogInfo}>
                  <View style={[styles.authorIndicator, { backgroundColor: blog.color }]} />
                  <Text style={styles.blogAuthor}>{blog.author}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleBookmark(blog.id)}>
                <Icon
                  name={bookmarked[blog.id] ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={bookmarked[blog.id] ? "#FFCC00" : "#000"}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAD2", // Light beige background
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#8FBC8F", // Dark olive green background for header
    elevation: 4, // Adding elevation for shadow effect
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileText: {
    color: "#fff", // Light beige for profile text
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  todoContainer: {
    backgroundColor: "#8FBC8F", // Cornsilk background for to-do container
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4, // Adding elevation for shadow effect
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#556B2F", // Dark olive green for section title
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FFF8DC", // Cornsilk for task cards
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
    color: "#556B2F", // Dark olive green for task title
  },
  taskCompleted: {
    color: "#8FBC8F", // Soft green for completed task title
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
    borderColor: "#EEE8AA", // Pale goldenrod for input border
    borderRadius: 5,
    padding: 10,
    marginRight: 8,
    backgroundColor: "#FFF8DC", // Cornsilk for input background
  },
  addButton: {
    backgroundColor: "#556B2F", // Dark olive green for add button
    borderRadius: 5,
    padding: 10,
  },
  blogContainer: {
    backgroundColor: "#FFF8DC", // Cornsilk for blog container
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
    borderBottomColor: "#8FBC8F", // Pale goldenrod for border
  },
  blogContent: {
    flex: 1,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#556B2F", // Dark olive green for blog title
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
});

export default DoctorHomePage;
