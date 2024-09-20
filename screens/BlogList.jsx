import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, query, orderBy, onSnapshot, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from "../config/firebase.config";

const BlogList = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('health');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState([]); // To track bookmarked blogs
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
    // Check if the current user is the author
    const isCurrentUserAuthor = auth.currentUser && auth.currentUser.uid === item.userId;
    const isBookmarked = bookmarkedBlogs.includes(item.id); // Check if the blog is bookmarked

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.blogItem}
        onPress={() => navigation.navigate('BlogDetail', { blogId: item.id })}
      >
        {item.photo && <Image source={{ uri: item.photo }} style={styles.blogImage} />}
        <View style={styles.blogContent}>
          <Text style={styles.blogTitle}>{item.title}</Text>
          <View style={styles.blogInfo}>
            <Text style={styles.blogAuthor}>By {item.author}</Text>
            <Text style={styles.blogCategory}>{item.category}</Text>
          </View>
        </View>

        {/* Bookmark Button */}
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => handleBookmark(item.id, { title: item.title, author: item.author })}
        >
          <Icon
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isBookmarked ? "#FFD700" : "#FFD700"} // Change to full yellow if bookmarked
          />        
          </TouchableOpacity>

        {isCurrentUserAuthor && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteBlog(item.id)} // Handles blog deletion
          >
            <Icon name="trash-outline" size={24} color="#FF6347" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };


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
          style={selectedTab === 'health' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setSelectedTab('health')}
        >
          <Text style={selectedTab === 'health' ? styles.tabTextActive : styles.tabTextInactive}>Health</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={selectedTab === 'recipe' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setSelectedTab('recipe')}
        >
          <Text style={selectedTab === 'recipe' ? styles.tabTextActive : styles.tabTextInactive}>Recipe</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8FBC8F" style={styles.loader} />
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
    fontWeight: 'bold',
    fontSize: 16,
    color: '#556B2F',
  },
  blogInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  blogAuthor: {
    fontSize: 14,
    color: '#666',
  },
  blogCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8FBC8F',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#8FBC8F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    marginLeft: 8,
    color: '#FFF',
    fontWeight: 'bold',
  },
  bookmarkButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  }, deleteButton: {
    position: 'absolute',
    top: 10,
    right: 40,  // Adjust the right value to position it beside the bookmark
    padding: 5,
  },

});

export default BlogList;