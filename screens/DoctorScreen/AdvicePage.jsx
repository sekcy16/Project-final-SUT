import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, ScrollView } from 'react-native';

const AdvicePage = ({ route, navigation }) => {
  const { patientName = 'Unknown', patientAge = 'Unknown', patientLevel = 'Unknown' } = route.params || {};

  const [eatingAdvice, setEatingAdvice] = useState('');
  const [exerciseAdvice, setExerciseAdvice] = useState('');
  const [additionalAdvice, setAdditionalAdvice] = useState('');

  const handleConfirm = () => {
    console.log('Eating Advice:', eatingAdvice);
    console.log('Exercise Advice:', exerciseAdvice);
    console.log('Additional Advice:', additionalAdvice);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.name}>{patientName}</Text>
          <Text style={styles.details}>Age: {patientAge} | Diabetes Level: {patientLevel}</Text>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.adviceSection}>
            <Text style={styles.sectionTitle}>Eating Advice</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              onChangeText={setEatingAdvice}
              value={eatingAdvice}
              placeholder="Provide advice on eating"
            />
          </View>

          <View style={styles.adviceSection}>
            <Text style={styles.sectionTitle}>Exercise Advice</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              onChangeText={setExerciseAdvice}
              value={exerciseAdvice}
              placeholder="Provide advice on exercise"
            />
          </View>

          <View style={styles.adviceSection}>
            <Text style={styles.sectionTitle}>Additional Advice</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              onChangeText={setAdditionalAdvice}
              value={additionalAdvice}
              placeholder="Provide additional advice"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F0F2', // Light blue background
  },
  header: {
    backgroundColor: '#007BFF', // Primary blue
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  details: {
    fontSize: 16,
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  adviceSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007BFF', // Blue title
  },
  input: {
    borderWidth: 1,
    borderColor: '#B0BEC5', // Light blue-gray border
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  backButton: {
    backgroundColor: '#FF6F61', // Coral for back button
    borderRadius: 5,
    padding: 15,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#007BFF', // Blue for confirm button
    borderRadius: 5,
    padding: 15,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdvicePage;
