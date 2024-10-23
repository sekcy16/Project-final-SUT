import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from "../config/firebase.config";
import { LinearGradient } from 'expo-linear-gradient';

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

  const renderBlogItem = ({ item }) => (
    <TouchableOpacity
      style={styles.blogItem}
      onPress={() => navigation.navigate('BlogDetail', { blogId: item.id })}
    >
      <Image source={{ uri: item.photo || 'https://via.placeholder.com/120' }} style={styles.blogImage} />
      <View style={styles.blogContent}>
        <Text style={styles.blogTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.blogInfo}>
          <Text style={styles.blogAuthor}>โดย {item.author}</Text>
          <View style={styles.categoryContainer}>
            <Text style={styles.blogCategory}>{item.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#4A6D7C', '#2C3E50']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>บทความที่บันทึกไว้</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
      ) : (
        <FlatList
          data={bookmarkedBlogs}
          renderItem={renderBlogItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.blogList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="bookmarks-outline" size={64} color="#FFFFFF" />
              <Text style={styles.emptyText}>ยังไม่มีบทความที่บันทึกไว้</Text>
            </View>
          }
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 32,
    fontFamily: 'Kanit-Bold',
  },
  blogList: {
    padding: 16,
  },
  blogItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  blogImage: {
    width: 120,
    height: 120,
  },
  blogContent: {
    flex: 1,
    padding: 16,
  },
  blogTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#2C3E50',
    marginBottom: 8,
    fontFamily: 'Kanit-Bold',
  },
  blogInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blogAuthor: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Kanit-Regular',
  },
  categoryContainer: {
    backgroundColor: '#E9F2F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  blogCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A6D7C',
    fontFamily: 'Kanit-Bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
    fontFamily: 'Kanit-Regular',
  },
});

export default BookmarkListPage;