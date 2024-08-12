import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HealthDashboard = ({ navigation }) => {
  const [chartData, setChartData] = useState([]);
  const [bloodSugarChartData, setBloodSugarChartData] = useState([]);
  const [weightChartData, setWeightChartData] = useState([]);
  const [latestWeight, setLatestWeight] = useState(null);

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => {
      loadChartData();
    });

    loadChartData();

    return () => {
      navigation.removeListener('focus', focusListener);
    };
  }, [navigation]);

  const loadChartData = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('bloodSugarHistory');
      const savedWeightHistory = await AsyncStorage.getItem('weightHistory');

      if (savedHistory !== null) {
        const parsedHistory = JSON.parse(savedHistory);
        updateChartData(parsedHistory);
        setBloodSugarChartData(parsedHistory.slice(-7).map(item => parseInt(item.level)).reverse());
      }

      if (savedWeightHistory !== null) {
        const parsedWeightHistory = JSON.parse(savedWeightHistory);
        setWeightChartData(parsedWeightHistory.slice(-7).map(item => parseFloat(item.weight)).reverse());
        setLatestWeight(parsedWeightHistory[parsedWeightHistory.length - 1].weight);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const updateChartData = (historyData) => {
    const last7Days = historyData.slice(-7).map(item => parseInt(item.level));
    setChartData(last7Days.reverse());
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greetingText}>Hello, Jacob!</Text>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.date}>23/7/2024</Text>
        <Text style={styles.title}>พลังงานต่อวันคงเหลือ</Text>
        <Text style={styles.calories}>2,000 Calories</Text>
      </View>

      <View style={styles.healthCard}>
        <View style={styles.macroCard}>
        <MacroItem label="โปรตีน:" value={110} total={130} color="#FF6B6B" />
        <MacroItem label="ไขมัน:" value={40} total={70} color="#FFD93D" />
        <MacroItem label="คาร์โบไฮเดรต:" value={230} total={250} color="#4D96FF" />
        </View>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BloodSugar')}>
          <LineChart
            data={{
              datasets: [{ data: bloodSugarChartData.length > 0 ? bloodSugarChartData : [60, 80, 40, 70, 50, 80, 60] }]
            }}
            width={Dimensions.get('window').width / 2 - 30}
            height={100}
            chartConfig={{
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#FF6B6B"
              }
            }}
            bezier
            style={styles.chart}
          />
          <Text style={styles.cardText}>ระดับน้ำตาลในเลือด: {bloodSugarChartData.length > 0 ? `${bloodSugarChartData[bloodSugarChartData.length - 1]} mg/dL` : 'ไม่มีข้อมูล'} </Text> 
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WeightProgress')}>
          <LineChart
            data={{
              datasets: [{ data: weightChartData.length > 0 ? weightChartData : [75, 76, 75.5, 75, 76.2, 75.8, 75.5] }]
            }}
            width={Dimensions.get('window').width / 2 - 30}
            height={100}
            chartConfig={{
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              color: (opacity = 1) => `rgba(77, 150, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#4D96FF"
              }
            }}
            bezier
            style={styles.chart}
          />
          <Text style={styles.cardText}>น้ำหนัก: {latestWeight ? `${latestWeight} KG` : 'ไม่มีข้อมูล'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        {/* Additional content as needed */}
      </View>

      <View style={styles.doctorContainer}>
        {/* Doctor section */}
      </View>
    </ScrollView>
  );
};

const MacroItem = ({ label, value, total, color }) => (
  <View style={styles.macroItem}>
    <Text style={styles.macroLabel}>{label}</Text>
    <View style={styles.macroBar}>
      <View style={[styles.macroProgress, { width: `${(value / total) * 100}%`, backgroundColor: color }]} />
    </View>
    <Text style={styles.macroValue}>{value}/{total}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  header: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center', // Center-align the text elements
    backgroundColor: '#FFF', // Add a background color
    padding: 15, // Add padding for spacing
    borderRadius: 12, // Round the corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999', // Subtle color for the date
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 5,
    marginBottom: 5,
  },
  calories: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B', // Distinct color for the calories
  },
  healthCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  macroCard: {
    alignItems: 'center',
  },
  macroItem: {
    marginBottom: 15,
    width: '100%',
  },
  macroLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  macroBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
  },
  macroProgress: {
    height: 8,
    borderRadius: 5,
  },
  macroValue: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: Dimensions.get('window').width / 2 - 30,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  chart: {
    borderRadius: 12,
  },
  statsContainer: {
    // Your other styles here
  },
  doctorContainer: {
    // Your other styles here
  },
});

export default HealthDashboard;
