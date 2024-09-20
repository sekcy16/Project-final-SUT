import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from "../config/firebase.config";

const BookmarkListPage = () => {
  const navigation = useNavigation();
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchBookmarkedBlogs = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const bookmarks = userDoc.data().bookmarks || [];

          // Fetch the full blog details for each bookmarked blog
          const blogPromises = bookmarks.map(async bookmark => {
            const blogRef = doc(db, 'blogs', bookmark.blogId);
            const blogDoc = await getDoc(blogRef);
            return blogDoc.exists() ? { id: blogDoc.id, ...blogDoc.data() } : null;
          });

          const blogData = await Promise.all(blogPromises);
          setBookmarkedBlogs(blogData.filter(blog => blog !== null));
        }
        setLoading(false);
      }
    };

    fetchBookmarkedBlogs();
  }, []);

  const renderBlogItem = (item) => {
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookmarked Blogs</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8FBC8F" style={styles.loader} />
      ) : (
        <ScrollView style={styles.blogList}>
          {bookmarkedBlogs.map(renderBlogItem)}
        </ScrollView>
      )}
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
});

export default BookmarkListPage;