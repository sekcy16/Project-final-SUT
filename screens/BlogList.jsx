import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const BlogList = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('articles'); // 'articles' or 'recipes'
  const [bookmarked, setBookmarked] = useState({});

  const articles = [
    {
      id: 1,
      title: 'แนวทางการออกกำลังกายสำหรับผู้ป่วยเบาหวาน',
      author: 'Dr.K',
      color: 'red',
      bookmarked: false,
    },
    {
      id: 2,
      title: 'วิธีจัดการความเครียด จากการออกกำลังกาย',
      author: 'Dr.C',
      color: 'green',
      bookmarked: true,
    },
    {
      id: 3,
      title: 'ไฟเบอร์คืออะไร? ทำไมทุกคนควรกินไฟเบอร์?',
      author: 'Dr.A',
      color: 'blue',
      bookmarked: false,
    },
  ];

  const recipes = [
    {
      id: 1,
      title: 'สูตรขนมปังโฮลวีท',
      author: 'Chef.A',
      color: 'orange',
      bookmarked: false,
    },
    {
      id: 2,
      title: 'สปาเก็ตตี้ซอสครีมเห็ด',
      author: 'Chef.B',
      color: 'purple',
      bookmarked: true,
    },
    {
      id: 3,
      title: 'สลัดผักเพื่อสุขภาพ',
      author: 'Chef.C',
      color: 'green',
      bookmarked: false,
    },
  ];

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

  const getDisplayedContent = () => {
    return selectedTab === 'articles' ? articles : recipes;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
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

      <ScrollView style={styles.blogList}>
        {getDisplayedContent().map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.blogItem}
            onPress={() => handleBlogPress(item.id)}
          >
            <View style={styles.blogContent}>
              <Text style={styles.blogTitle}>{item.title}</Text>
              <View style={styles.blogInfo}>
                <View style={[styles.authorIndicator, { backgroundColor: item.color }]} />
                <Text style={styles.blogAuthor}>{item.author}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => toggleBookmark(item.id)}>
              <Icon
                name={bookmarked[item.id] ? "bookmark" : "bookmark-outline"}
                size={24}
                color={bookmarked[item.id] ? "#FFCC00" : "#000"}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inactiveTab: {
    backgroundColor: '#CCCCCC',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  tabTextInactive: {
    color: '#000',
    fontWeight: 'bold',
  },
  blogList: {
    flex: 1,
  },
  blogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
  },
  blogContent: {
    flex: 1,
  },
  blogTitle: {
    fontWeight: 'bold',
    fontSize: 16,
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
    color: '#999',
  },
});

export default BlogList;
