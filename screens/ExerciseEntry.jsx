import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const ExerciseEntry = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [minutes, setMinutes] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState(null);

  const handleAddPress = (exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  const handleCalculate = () => {
    if (selectedExercise && minutes) {
      const calories = (selectedExercise.met * 3.5 * 70 * minutes) / 200; // Simplified formula for calories burned
      setCaloriesBurned(calories.toFixed(2));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#999" />
        <TextInput 
          style={styles.searchInput}
          placeholder="ค้นหา"
        />
        <Icon name="mic" size={20} color="#999" />
      </View>

      <ScrollView style={styles.exerciseList}>
        <Text style={styles.sectionTitle}>การออกกำลังกาย</Text>
        <ExerciseItem 
          name="เล่นเวท/ยกน้ำหนัก" 
          description="Weight Training" 
          met={6} 
          onAddPress={() => handleAddPress({ name: 'เล่นเวท/ยกน้ำหนัก', met: 6 })} 
        />
        <ExerciseItem 
          name="วิ่งจ๊อกกิ้ง" 
          description="Jogging" 
          met={7} 
          onAddPress={() => handleAddPress({ name: 'วิ่งจ๊อกกิ้ง', met: 7 })} 
        />
        <ExerciseItem 
          name="กระโดดเชือก" 
          description="Jump rope" 
          met={12} 
          onAddPress={() => handleAddPress({ name: 'กระโดดเชือก', met: 12 })} 
        />
        <ExerciseItem 
          name="ว่ายน้ำ" 
          description="Swimming" 
          met={8} 
          onAddPress={() => handleAddPress({ name: 'ว่ายน้ำ', met: 8 })} 
        />
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
            <View style={styles.inputRow}>
              <Text>ออกกำลังกายไป</Text>
              <TextInput
                style={styles.input}
                placeholder="นาที"
                keyboardType="numeric"
                value={minutes}
                onChangeText={setMinutes}
              />
            </View>
            <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
              <Text style={styles.calculateButtonText}>คำนวณ</Text>
            </TouchableOpacity>
            {caloriesBurned && (
              <Text style={styles.caloriesText}>
                เผาผลาญไปทั้งหมด {caloriesBurned} แคลอรี่
              </Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.confirmButtonText}>ตกลง</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ExerciseItem = ({ name, description, onAddPress }) => (
  <View style={styles.exerciseItem}>
    <View>
      <Text style={styles.exerciseName}>{name}</Text>
      <Text style={styles.exerciseDescription}>{description}</Text>
    </View>
    <TouchableOpacity style={styles.addItemButton} onPress={onAddPress}>
      <Icon name="add" size={20} color="#4CAF50" />
    </TouchableOpacity>
  </View>
);

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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
  },
  exerciseList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
  },
  exerciseName: {
    fontWeight: 'bold',
  },
  exerciseDescription: {
    color: '#999',
  },
  addItemButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 100,
  },
  calculateButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
  },
  calculateButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  caloriesText: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default ExerciseEntry;
