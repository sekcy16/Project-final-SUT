import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
      const blogData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlogs(blogData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blogs: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
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
      "ลบบทความ",
      "คุณแน่ใจหรือไม่ที่จะลบบทความนี้?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ตกลง",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'blogs', blogId));
              Alert.alert("สำเร็จ", "ลบบทความเรียบร้อยแล้ว");
            } catch (error) {
              console.error("เกิดข้อผิดพลาดในการลบบทความ: ", error);
              Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบบทความได้ กรุณาลองใหม่อีกครั้ง");
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
          const updatedBookmarks = bookmarks.filter(bookmark => bookmark.blogId !== blogId);
          await updateDoc(userRef, { bookmarks: updatedBookmarks });
          setBookmarkedBlogs(updatedBookmarks.map(bookmark => bookmark.blogId));
          Alert.alert('สำเร็จ', 'ยกเลิกการบันทึกบทความแล้ว');
        } else {
          const newBookmarks = [...bookmarks, { blogId, ...blogData }];
          await updateDoc(userRef, { bookmarks: newBookmarks });
          setBookmarkedBlogs([...bookmarkedBlogs, blogId]);
          Alert.alert('สำเร็จ', 'บันทึกบทความแล้ว');
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตการบันทึก:', error);
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัปเดตการบันทึกได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  const renderBlogItem = ({ item }) => {
    const isCurrentUserAuthor = auth.currentUser && auth.currentUser.uid === item.userId;
    const isBookmarked = bookmarkedBlogs.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.blogItem}
        onPress={() => navigation.navigate('BlogDetail', { blogId: item.id })}
      >
        <LinearGradient
          colors={['#ffffff', '#f0f0f0']}
          style={styles.blogGradient}
        >
          {item.photo && <Image source={{ uri: item.photo }} style={styles.blogImage} />}
          <View style={styles.blogContent}>
            <Text style={styles.blogTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.blogExcerpt} numberOfLines={2}>{item.content}</Text>
            <View style={styles.blogInfo}>
              <Text style={styles.blogAuthor}>โดย {item.author}</Text>
              <View style={[styles.categoryContainer, { backgroundColor: item.category === 'health' ? '#a8e6cf' : '#ffd3b6' }]}>
                <Text style={styles.blogCategory}>{item.category === 'health' ? 'สุขภาพ' : 'สูตรอาหาร'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleBookmark(item.id, { title: item.title, author: item.author })}
            >
              <Icon name={isBookmarked ? "bookmark" : "bookmark-outline"} size={24} color={isBookmarked ? "#4A90E2" : "#666"} />
            </TouchableOpacity>
            {isCurrentUserAuthor && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteBlog(item.id)}>
                <Icon name="trash-can-outline" size={24} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>บทความและสูตรอาหาร</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'health' && styles.activeTab]}
            onPress={() => setSelectedTab('health')}
          >
            <Text style={[styles.tabText, selectedTab === 'health' && styles.activeTabText]}>สุขภาพ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'recipe' && styles.activeTab]}
            onPress={() => setSelectedTab('recipe')}
          >
            <Text style={[styles.tabText, selectedTab === 'recipe' && styles.activeTabText]}>สูตรอาหาร</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
        ) : (
          <FlatList
            data={blogs.filter(blog => blog.category === selectedTab)}
            renderItem={renderBlogItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.blogList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateBlogScreen')}
      >
        <LinearGradient
          colors={['#4A90E2', '#50E3C2']}
          style={styles.createButtonGradient}
        >
          <Icon name="plus" size={24} color="#FFF" />
          <Text style={styles.createButtonText}>สร้างบทความใหม่</Text>
        </LinearGradient>
      </TouchableOpacity>
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
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: '#FFF',
    marginLeft: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    fontFamily: 'Kanit-Regular',
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
    fontFamily: 'Kanit-Bold',
  },
  blogList: {
    paddingHorizontal: 15,
  },
  blogItem: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  blogGradient: {
    padding: 15,
  },
  blogImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  blogContent: {
    flex: 1,
  },
  blogTitle: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    color: '#333',
    marginBottom: 5,
  },
  blogExcerpt: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#666',
    marginBottom: 10,
  },
  blogInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blogAuthor: {
    fontSize: 12,
    fontFamily: 'Kanit-Regular',
    color: '#666',
  },
  categoryContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  blogCategory: {
    fontSize: 12,
    fontFamily: 'Kanit-Regular',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  createButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    elevation: 5,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  createButtonText: {
    fontFamily: 'Kanit-Regular',
    fontSize: 16,
    color: '#FFF',
    marginLeft: 5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BlogList;