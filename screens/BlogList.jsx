import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, query, orderBy, onSnapshot, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from "../config/firebase.config";
import { LinearGradient } from 'expo-linear-gradient';

const BlogList = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('health');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState([]);
  const auth = getAuth(app);
  const db = getFirestore(app);

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

  useEffect(() => {
    // Fetch user's bookmarked blogs
    const fetchBookmarkedBlogs = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const bookmarks = userDoc.data().bookmarks || [];
          setBookmarkedBlogs(bookmarks.map(bookmark => bookmark.blogId));
        }
      }
    };

    fetchBookmarkedBlogs();
  }, []);

  const handleDeleteBlog = async (blogId) => {
    Alert.alert(
      "Delete Blog",
      "Are you sure you want to delete this blog?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'blogs', blogId));
              console.log("Blog deleted successfully");
            } catch (error) {
              console.error("Error deleting blog: ", error);
              Alert.alert("Error", "Failed to delete the blog. Please try again.");
            }
          }
        }
      ]
    );
  };


  const handleBookmark = async (blogId, blogData) => {
    const user = auth.currentUser;

    if (user) {
      const userRef = doc(db, 'users', user.uid);

      try {
        const userDoc = await getDoc(userRef);
        const bookmarks = userDoc.exists() ? userDoc.data().bookmarks || [] : [];

        if (bookmarkedBlogs.includes(blogId)) {
          // Unbookmark the blog if it is already bookmarked
          const updatedBookmarks = bookmarks.filter(bookmark => bookmark.blogId !== blogId);
          await updateDoc(userRef, { bookmarks: updatedBookmarks });
          setBookmarkedBlogs(updatedBookmarks.map(bookmark => bookmark.blogId)); // Update local state
          Alert.alert('Success', 'Blog unbookmarked successfully!');
        } else {
          // Bookmark the blog if it is not already bookmarked
          const newBookmarks = [...bookmarks, { blogId, ...blogData }];
          await updateDoc(userRef, { bookmarks: newBookmarks });
          setBookmarkedBlogs([...bookmarkedBlogs, blogId]); // Add blog to local state
          Alert.alert('Success', 'Blog bookmarked successfully!');
        }
      } catch (error) {
        console.error('Error updating bookmarks:', error);
        Alert.alert('Error', 'Failed to update bookmarks. Please try again.');
      }
    }
  };

  const renderBlogItem = (item) => {
    const isCurrentUserAuthor = auth.currentUser && auth.currentUser.uid === item.userId;
    const isBookmarked = bookmarkedBlogs.includes(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.blogItem}
        onPress={() => navigation.navigate('BlogDetail', { blogId: item.id })}
      >
        <LinearGradient
          colors={['#7FDBDA', '#AED9E0']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.blogGradient}
        >
          {item.photo && <Image source={{ uri: item.photo }} style={styles.blogImage} />}
          <View style={styles.blogContent}>
            <Text style={styles.blogTitle}>{item.title}</Text>
            <View style={styles.blogInfo}>
              <Text style={styles.blogAuthor}>By {item.author}</Text>
              <Text style={styles.blogCategory}>{item.category}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={() => handleBookmark(item.id, { title: item.title, author: item.author })}
          >
            <Icon
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={28}
              color={isBookmarked ? "#5D9C59" : "#FFFFFF"}
            />        
          </TouchableOpacity>

          {isCurrentUserAuthor && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteBlog(item.id)}
            >
              <Icon name="trash-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B5EAD7', '#7FDBDA']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blogs & Recipes</Text>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'health' && styles.activeTab]}
          onPress={() => setSelectedTab('health')}
        >
          <Text style={[styles.tabText, selectedTab === 'health' && styles.activeTabText]}>Health</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'recipe' && styles.activeTab]}
          onPress={() => setSelectedTab('recipe')}
        >
          <Text style={[styles.tabText, selectedTab === 'recipe' && styles.activeTabText]}>Recipe</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7FDBDA" style={styles.loader} />
      ) : (
        <ScrollView style={styles.blogList}>
          {blogs
            .filter(blog => blog.category === selectedTab)
            .map(renderBlogItem)}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateBlogScreen')}
      >
        <LinearGradient
          colors={['#B5EAD7', '#7FDBDA']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.createButtonGradient}
        >
          <Icon name="add" size={28} color="#FFF" />
          <Text style={styles.createButtonText}>Create New Blog</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  tab: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 10,
    backgroundColor: '#E0E0E0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeTab: {
    backgroundColor: '#7FDBDA',
  },
  tabText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
  },
  activeTabText: {
    color: '#FFF',
  },
  blogList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  blogItem: {
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  blogGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  blogImage: {
    width: 90,
    height: 90,
    borderRadius: 15,
    marginRight: 16,
  },
  blogContent: {
    flex: 1,
  },
  blogTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  blogInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blogAuthor: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  blogCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D9C59',
  },
  bookmarkButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    padding: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    padding: 8,
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
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  createButtonText: {
    marginLeft: 8,
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default BlogList;