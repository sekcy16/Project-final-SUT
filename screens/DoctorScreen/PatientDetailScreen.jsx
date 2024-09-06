import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit'; // For the graph

const PatientDetailScreen = ({ route, navigation }) => {
  const { patientId } = route.params;

  // Dummy data for demonstration
  const patientData = {
    '1': { name: 'Johny', age: 40, level: 2 },
    '2': { name: 'Jackky', age: 37, level: 1 },
  };

  const patient = patientData[patientId] || { name: 'Unknown', age: '-', level: '-' };

  const [selectedTab, setSelectedTab] = useState('bloodSugar');

  // Dummy weight data
  const weightData = {
    labels: ['01/08/2024', '07/08/2024', '14/08/2024'],
    datasets: [{ data: [70, 72, 71] }],
  };

  // Dummy exercise data
  const exerciseData = [
    { date: '01/08/2024', activity: 'Running', duration: '30 mins' },
    { date: '07/08/2024', activity: 'Cycling', duration: '45 mins' },
    { date: '14/08/2024', activity: 'Swimming', duration: '60 mins' },
  ];

  // Dummy dietary data
  const dietaryData = {
    labels: ['01/08/2024', '07/08/2024', '14/08/2024'],
    datasets: [{ data: [45, 50, 48] }], // Daily carb intake (grams)
  };

  // Dummy daily intake data with calories
  const dailyIntake = [
    { date: '01/08/2024', calories: 1800, protein: 70, carbs: 45, fats: 60, sugar: 30 },
    { date: '07/08/2024', calories: 1900, protein: 75, carbs: 50, fats: 65, sugar: 35 },
    { date: '14/08/2024', calories: 1850, protein: 80, carbs: 48, fats: 62, sugar: 32 },
  ];

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'bloodSugar':
        return (
          <View>
            <Text style={styles.statsText}>ระดับน้ำตาลในเลือด</Text>
            <LineChart
              data={{
                labels: ['23/7/2024', '27/7/2024'],
                datasets: [{ data: [85, 110] }],
              }}
              width={350}
              height={200}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, // Blue color
              }}
              bezier
              style={styles.chart}
            />
            <Text style={styles.historyTitle}>ประวัติ</Text>
            <View style={styles.historyItem}>
              <Text style={styles.historyDate}>23/7/2024</Text>
              <Text style={styles.historyValue}>85 mg/dL</Text>
            </View>
            <View style={styles.historyItem}>
              <Text style={styles.historyDate}>27/7/2024</Text>
              <Text style={styles.historyValue}>110 mg/dL</Text>
            </View>
          </View>
        );
      case 'weight':
        return (
          <View>
            <Text style={styles.statsText}>น้ำหนัก</Text>
            <LineChart
              data={weightData}
              width={350}
              height={200}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, // Blue color
              }}
              bezier
              style={styles.chart}
            />
            <Text style={styles.historyTitle}>ประวัติ</Text>
            <View style={styles.historyItem}>
              <Text style={styles.historyDate}>01/08/2024</Text>
              <Text style={styles.historyValue}>70 kg</Text>
            </View>
            <View style={styles.historyItem}>
              <Text style={styles.historyDate}>07/08/2024</Text>
              <Text style={styles.historyValue}>72 kg</Text>
            </View>
            <View style={styles.historyItem}>
              <Text style={styles.historyDate}>14/08/2024</Text>
              <Text style={styles.historyValue}>71 kg</Text>
            </View>
          </View>
        );
      case 'exercise':
        return (
          <View>
            <Text style={styles.historyTitle}>ประวัติการออกกำลังกาย</Text>
            {exerciseData.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyValue}>{item.activity} - {item.duration}</Text>
              </View>
            ))}
          </View>
        );
      case 'diet':
        return (
          <View>
            <Text style={styles.sectionTitle}>อาหารที่รับประทาน</Text>
            {dailyIntake.map((entry, index) => (
              <View key={index} style={styles.dietaryEntry}>
                <Text style={styles.dietaryDate}>{entry.date}</Text>
                <View style={styles.nutritionDetails}>
                  <Text style={styles.nutritionText}>Calories: {entry.calories} kcal</Text>
                  <Text style={styles.nutritionText}>Protein: {entry.protein} g</Text>
                  <Text style={styles.nutritionText}>Carbs: {entry.carbs} g</Text>
                  <Text style={styles.nutritionText}>Fats: {entry.fats} g</Text>
                  <Text style={styles.nutritionText}>Sugar: {entry.sugar} g</Text>
                </View>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{patient.name}</Text>
        <Text style={styles.age}>อายุ {patient.age} | เบาหวานระดับ {patient.level}</Text>
      </View>

      <ScrollView>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'bloodSugar' && styles.activeTab]}
            onPress={() => setSelectedTab('bloodSugar')}
          >
            <Text style={styles.tabText}>ระดับน้ำตาลในเลือด</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'weight' && styles.activeTab]}
            onPress={() => setSelectedTab('weight')}
          >
            <Text style={styles.tabText}>น้ำหนัก</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'exercise' && styles.activeTab]}
            onPress={() => setSelectedTab('exercise')}
          >
            <Text style={styles.tabText}>การออกกำลังกาย</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'diet' && styles.activeTab]}
            onPress={() => setSelectedTab('diet')}
          >
            <Text style={styles.tabText}>การกิน</Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('AdvicePage', {
            patientName: patient.name,
            patientAge: patient.age,
            patientLevel: patient.level
          })}
        >
          <Text style={styles.buttonText}>ให้คำแนะนำ</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD' }, // Light blue background
  header: { padding: 20, backgroundColor: '#2196F3', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  name: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  age: { fontSize: 18, color: 'white', marginTop: 5 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', backgroundColor: 'white' },
  tab: { flex: 1, padding: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#2196F3' },
  tabText: { fontSize: 16, color: '#333' },
  statsText: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20, marginVertical: 10 },
  chart: { borderRadius: 12, marginVertical: 20, marginHorizontal: 10 },
  historyTitle: { fontSize: 20, fontWeight: 'bold', padding: 20, color: '#2196F3' },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  historyDate: { fontSize: 16, color: '#555' },
  historyValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', padding: 20, color: '#2196F3' },
  dietaryEntry: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dietaryDate: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  nutritionDetails: { marginTop: 10 },
  nutritionText: { fontSize: 16, color: '#666' },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default PatientDetailScreen;
