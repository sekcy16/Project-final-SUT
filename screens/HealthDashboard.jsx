import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HealthDashboard = ({ navigation }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => {
      loadChartData();
    });

    // Load data when the component mounts
    loadChartData();

    // Cleanup the listener on unmount
    return () => {
      navigation.removeListener('focus', focusListener);
    };
  }, [navigation]);

  const loadChartData = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('bloodSugarHistory');
      if (savedHistory !== null) {
        const parsedHistory = JSON.parse(savedHistory);
        updateChartData(parsedHistory);
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
    <View style={styles.container}>
      <Text style={styles.date}>23/7/2024</Text>
      <Text style={styles.title}>พลังงานต่อวันคงเหลือ</Text>
      <Text style={styles.calories}>2,000 Calories</Text>

      <View style={styles.macroContainer}>
        <MacroItem label="โปรตีน:" value={110} total={130} color="#FF6B6B" />
        <MacroItem label="ไขมัน:" value={40} total={70} color="#FFD93D" />
        <MacroItem label="คาร์โบไฮเดรต:" value={230} total={250} color="#4D96FF" />
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('BloodSugar')}>
        <LineChart
          data={{
            datasets: [{ data: chartData.length > 0 ? chartData : [60, 80, 40, 70, 50, 80, 60] }]
          }}
          width={Dimensions.get('window').width - 40}
          height={200}
          chartConfig={{
            backgroundGradientFrom: '#F6FFF5',
            backgroundGradientTo: '#F6FFF5',
            color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
          }}
          bezier
          style={styles.chart}
        />
      </TouchableOpacity>

      <Text style={styles.bloodSugar}>ระดับน้ำตาลในเลือด: 80 mg/dL</Text>

      <View style={styles.weightContainer}>
        <Text style={styles.weight}>น้ำหนัก: 75.5 KG</Text>
      </View>

      <View style={styles.tabBar}>
        {/* Add tab bar icons here */}
      </View>
    </View>
  );
};

const MacroItem = ({ label, value, total, color }) => (
  <View style={styles.macroItem}>
    <Text>{label}</Text>
    <View style={styles.macroBar}>
      <View style={[styles.macroProgress, { width: `${(value / total) * 100}%`, backgroundColor: color }]} />
    </View>
    <Text>{value}/{total}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F6FFF5', // Updated background color
  },
  date: {
    fontSize: 16,
    color: '#888',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  calories: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4D96FF',
    marginTop: 5,
  },
  macroContainer: {
    marginTop: 20,
  },
  macroItem: {
    marginBottom: 10,
  },
  macroBar: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginTop: 5,
    overflow: 'hidden', // Added to ensure the progress bar stays within rounded corners
  },
  macroProgress: {
    height: 20,
    borderRadius: 10,
  },
  chart: {
    marginVertical: 20,
    borderRadius: 16,
  },
  bloodSugar: {
    fontSize: 18,
    marginBottom: 20,
  },
  weightContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  weight: {
    fontSize: 18,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default HealthDashboard;
