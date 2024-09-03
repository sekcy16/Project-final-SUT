import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Picker } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from "../config/firebase.config";

const CreateBlogScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('articles');

  const db = getFirestore(app);
  const auth = getAuth(app);

  const handleCreateBlog = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return;
      }
      
      await addDoc(collection(db, 'blogs'), {
        title,
        content,
        author: user.displayName || user.email,
        userId: user.uid,
        createdAt: new Date(),
        type,
      });
      
      navigation.goBack(); // Return to the blog list after creating
    } catch (error) {
      console.error('Error creating blog:', error);
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
      />
      <TextInput
        style={[styles.input, styles.contentInput]}
        placeholder="Blog Content"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <Picker
        selectedValue={type}
        style={styles.picker}
        onValueChange={(itemValue) => setType(itemValue)}
      >
        <Picker.Item label="Article" value="articles" />
        <Picker.Item label="Recipe" value="recipes" />
      </Picker>
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
  picker: {
    backgroundColor: '#FFF8DC',
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