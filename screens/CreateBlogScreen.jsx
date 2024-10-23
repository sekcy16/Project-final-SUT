import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, SafeAreaView, ScrollView, Platform, StatusBar } from 'react-native';
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
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>สร้างบทความใหม่</Text>
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.formContainer}>
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
              <Icon name="image-plus" size={24} color="#4A90E2" />
              <Text style={styles.photoButtonText}>เลือกรูปภาพ</Text>
            </TouchableOpacity>
            {photo && <Image source={{ uri: photo.uri }} style={styles.photoPreview} />}
          </View>
        </ScrollView>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateBlog}>
          <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.createButtonGradient}>
            <Text style={styles.createButtonText}>สร้างบทความ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  formContainer: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoButtonText: {
    color: '#4A90E2',
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
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
});

export default CreateBlogScreen;