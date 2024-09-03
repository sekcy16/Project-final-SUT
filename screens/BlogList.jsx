import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { app } from "../config/firebase.config";  // Import the Firebase app instance

const BlogList = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('articles');
  const [bookmarked, setBookmarked] = useState({});
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const db = getFirestore(app);  // Initialize Firestore trd

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blogData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBlogs(blogData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blogs: ", error);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  
  const toggleBookmark = (id) => {
    setBookmarked(prevState => ({
      ...prevState,
      [id]: !prevState[id],
    }));
    // You could also update the bookmark status in Firebase here
  };

  const handleBlogPress = (id) => {
    navigation.navigate('BlogDetail', { blogId: id });
  };

  const renderBlogItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.blogItem}
      onPress={() => handleBlogPress(item.id)}
    >
      <View style={styles.blogContent}>
        <Text style={styles.blogTitle}>{item.title}</Text>
        <View style={styles.blogInfo}>
          <View style={[styles.authorIndicator, { backgroundColor: item.color || '#8FBC8F' }]} />
          <Text style={styles.blogAuthor}>{item.author}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => toggleBookmark(item.id)}>
        <Icon
          name={bookmarked[item.id] ? "bookmark" : "bookmark-outline"}
          size={24}
          color={bookmarked[item.id] ? "#FFCC00" : "#556B2F"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blogs & Recipes</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={selectedTab === 'articles' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setSelectedTab('articles')}
        >
          <Text style={selectedTab === 'articles' ? styles.tabTextActive : styles.tabTextInactive}>บทความ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={selectedTab === 'recipes' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setSelectedTab('recipes')}
        >
          <Text style={selectedTab === 'recipes' ? styles.tabTextActive : styles.tabTextInactive}>สูตรอาหาร</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8FBC8F" style={styles.loader} />
      ) : (
        <ScrollView style={styles.blogList}>
          {blogs.filter(blog => blog.type === selectedTab).map(renderBlogItem)}
        </ScrollView>
      )}

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateBlogScreen')}
      >
        <Icon name="add" size={24} color="#FFF" />
        <Text style={styles.createButtonText}>Create New Blog</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAD2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
    backgroundColor: '#8FBC8F',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  activeTab: {
    backgroundColor: '#8FBC8F',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  inactiveTab: {
    backgroundColor: '#CCCCCC',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  tabTextInactive: {
    color: '#556B2F',
    fontWeight: 'bold',
  },
  blogList: {
    flex: 1,
  },
  blogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  blogContent: {
    flex: 1,
  },
  blogTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#556B2F',
  },
  blogInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  authorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  blogAuthor: {
    fontSize: 14,
    color: '#666',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#8FBC8F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default BlogList;