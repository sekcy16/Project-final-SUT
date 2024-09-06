import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from "../config/firebase.config";
import { launchImageLibrary } from 'react-native-image-picker';

const CreateBlogScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('health');
  const [photo, setPhoto] = useState(null);

  const db = getFirestore(app);
  const auth = getAuth(app);

  const handleCreateBlog = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return;
      }

      const blogData = {
        title,
        content,
        author: user.displayName || user.email,
        userId: user.uid,
        createdAt: new Date(),
        category,
        photo: photo ? photo.uri : null, // Save the photo URI
      };

      const docRef = await addDoc(collection(db, 'blogs'), blogData);

      navigation.goBack(); // Return to the blog list after creating
    } catch (error) {
      console.error('Error creating blog:', error);
    }
  };

  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (!response.didCancel && !response.error && response.assets) {
        setPhoto(response.assets[0]);
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create New Blog</Text>
      <TextInput
        style={styles.input}
        placeholder="Blog Title"
        value={title}
        onChangeText={setTitle}
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
        <TouchableOpacity
          style={category === 'health' ? styles.selectedCategory : styles.category}
          onPress={() => setCategory('health')}
        >
          <Text style={styles.categoryText}>Health</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={category === 'recipe' ? styles.selectedCategory : styles.category}
          onPress={() => setCategory('recipe')}
        >
          <Text style={styles.categoryText}>Recipe</Text>
        </TouchableOpacity>
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
