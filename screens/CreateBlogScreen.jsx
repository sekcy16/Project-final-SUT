import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, SafeAreaView, ScrollView } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { app } from "../config/firebase.config";
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CreateBlogScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('health');
  const [photo, setPhoto] = useState(null);

  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);

  const handleChoosePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0]);
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `blog_images/${filename}`);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleCreateBlog = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      let photoURL = null;
      if (photo) {
        photoURL = await uploadImage(photo.uri);
      }

      const blogData = {
        title: title.trim(),
        content: content.trim(),
        author: user.displayName || user.email,
        userId: user.uid,
        createdAt: new Date(),
        category,
        photo: photoURL,
      };

      await addDoc(collection(db, 'blogs'), blogData);
      Alert.alert('Success', 'Blog created successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating blog:', error);
      Alert.alert('Error', 'Failed to create blog. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สร้างบทความใหม่</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TextInput
          style={styles.input}
          placeholder="หัวข้อบทความ"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          placeholderTextColor="#999"
        />
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="เนื้อหาบทความ"
          value={content}
          onChangeText={setContent}
          multiline
          placeholderTextColor="#999"
        />
        <Text style={styles.label}>หมวดหมู่:</Text>
        <View style={styles.categoryContainer}>
          {['health', 'recipe'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.category, category === cat && styles.selectedCategory]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.selectedCategoryText]}>
                {cat === 'health' ? 'สุขภาพ' : 'สูตรอาหาร'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.photoButton} onPress={handleChoosePhoto}>
          <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.photoButtonGradient}>
            <Icon name="image-plus" size={24} color="#FFF" />
            <Text style={styles.photoButtonText}>เลือกรูปภาพ</Text>
          </LinearGradient>
        </TouchableOpacity>
        {photo && <Image source={{ uri: photo.uri }} style={styles.photoPreview} />}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateBlog}>
          <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.createButtonGradient}>
            <Text style={styles.createButtonText}>สร้างบทความ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    fontFamily: 'Kanit-Bold',
  },
  scrollContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
    elevation: 2,
  },
  contentInput: {
    height: 150,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    fontFamily: 'Kanit-Bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  category: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    elevation: 2,
  },
  selectedCategory: {
    backgroundColor: '#4A90E2',
  },
  categoryText: {
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'Kanit-Regular',
  },
  selectedCategoryText: {
    color: '#FFF',
  },
  photoButton: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
  },
  photoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  photoButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  createButton: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
  },
  createButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
  },
});

export default CreateBlogScreen;