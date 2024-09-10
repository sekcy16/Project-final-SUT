import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from "../config/firebase.config";
import * as ImagePicker from 'expo-image-picker';

const CreateBlogScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('health');
  const [photo, setPhoto] = useState(null);

  const db = getFirestore(app);
  const auth = getAuth(app);

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

      const blogData = {
        title: title.trim(),
        content: content.trim(),
        author: user.displayName || user.email,
        userId: user.uid,
        createdAt: new Date(),
        category,
        photo: photo ? photo.uri : null,
      };

      await addDoc(collection(db, 'blogs'), blogData);
      Alert.alert('Success', 'Blog created successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating blog:', error);
      Alert.alert('Error', 'Failed to create blog. Please try again.');
    }
  };

  const handleChoosePhoto = async () => {
    // Request permission to access the media library
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create New Blog</Text>
      <TextInput
        style={styles.input}
        placeholder="Blog Title"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />
      <TextInput
        style={[styles.input, styles.contentInput]}
        placeholder="Blog Content"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <Text style={styles.label}>Category:</Text>
      <View style={styles.categoryContainer}>
        {['health', 'recipe'].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.category, category === cat && styles.selectedCategory]}
            onPress={() => setCategory(cat)}
          >
            <Text style={styles.categoryText}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.photoButton} onPress={handleChoosePhoto}>
        <Text style={styles.photoButtonText}>Choose Photo</Text>
      </TouchableOpacity>
      {photo && <Image source={{ uri: photo.uri }} style={styles.photoPreview} />}
      <TouchableOpacity style={styles.button} onPress={handleCreateBlog}>
        <Text style={styles.buttonText}>Create Blog</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FAFAD2',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#556B2F',
  },
  input: {
    backgroundColor: '#FFF8DC',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  contentInput: {
    height: 150,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#556B2F',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  category: {
    backgroundColor: '#FFF8DC',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  selectedCategory: {
    backgroundColor: '#8FBC8F',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  categoryText: {
    color: '#556B2F',
    fontWeight: 'bold',
  },
  photoButton: {
    backgroundColor: '#8FBC8F',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  photoButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  photoPreview: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#8FBC8F',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default CreateBlogScreen;
