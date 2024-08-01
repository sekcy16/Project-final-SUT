import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BloodSugar = ({ navigation }) => {
  const [bloodSugarLevel, setBloodSugarLevel] = useState('');
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('bloodSugarHistory');
      if (savedHistory !== null) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        updateChartData(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const updateChartData = (historyData) => {
    const last7Days = historyData.slice(-7).map(item => parseInt(item.level));
    setChartData(last7Days.reverse());
  };

  const addBloodSugarEntry = async () => {
    if (bloodSugarLevel) {
      const now = new Date();
      const newEntry = {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        level: bloodSugarLevel,
        status: getStatus(parseInt(bloodSugarLevel))
      };
      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      updateChartData(updatedHistory);
      setBloodSugarLevel('');
      
      try {
        await AsyncStorage.setItem('bloodSugarHistory', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Error saving history:', error);
      }
    }
  };

  const deleteEntry = async (index) => {
    const updatedHistory = history.filter((_, i) => i !== index);
    setHistory(updatedHistory);
    updateChartData(updatedHistory);
    try {
      await AsyncStorage.setItem('bloodSugarHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const getStatus = (level) => {
    if (level < 70) return 'ต่ำ';
    if (level > 100) return 'สูง';
    return 'ดี';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>ระดับน้ำตาลในเลือด</Text>
        <View style={styles.profileIcon}></View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={bloodSugarLevel}
          onChangeText={setBloodSugarLevel}
          placeholder="ใส่ระดับน้ำตาลในเลือด (mg/dL)"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={addBloodSugarEntry}>
          <Text style={styles.addButtonText}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.today}>
        <Text style={styles.todayText}>วันนี้</Text>
        <Text style={styles.todayValue}>{history[0]?.level || '-'} mg/dL</Text>
      </View>

      {chartData.length > 0 && (
        <LineChart
          data={{
            datasets: [{ data: chartData }]
          }}
          width={Dimensions.get('window').width - 40}
          height={200}
          chartConfig={{
            backgroundGradientFrom: '#F6FFF5',
            backgroundGradientTo: '#F6FFF5',
            color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726"
            }
          }}
          bezier
          style={styles.chart}
        />
      )}

      <View style={styles.history}>
        <Text style={styles.historyTitle}>ประวัติ</Text>
        {history.map((item, index) => (
          <View key={index} style={styles.historyItem}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyTime}>{item.time}</Text>
            <Text style={[
              styles.historyValue,
              item.status === 'สูง' ? styles.highValue : 
              item.status === 'ต่ำ' ? styles.lowValue : styles.normalValue
            ]}>{item.status}</Text>
            <Text style={styles.historyLevel}>{item.level} mg/dL</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteEntry(index)}>
              <Text style={styles.deleteButtonText}>ลบ</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F6FFF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  today: {
    marginBottom: 20,
  },
  todayText: {
    fontSize: 18,
    marginBottom: 5,
  },
  todayValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: 20,
    borderRadius: 16,
  },
  history: {
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 16,
  },
  historyTime: {
    fontSize: 16,
  },
  historyValue: {
    fontSize: 16,
  },
  normalValue: {
    color: 'green',
  },
  highValue: {
    color: 'red',
  },
  lowValue: {
    color: 'orange',
  },
  historyLevel: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF6347',
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default BloodSugar;
