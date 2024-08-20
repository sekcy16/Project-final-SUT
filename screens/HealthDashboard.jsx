import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

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
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.profileIcon}>
          <Icon name="person-circle-outline" size={24} color="#fff" />
        </View>
      </View>

      {/* Macro Information */}
      <View style={styles.macroSection}>
        <Text style={styles.date}>23/7/2024</Text>
        <Text style={styles.title}>พลังงานต่อวันคงเหลือ</Text>
        <Text style={styles.calories}>2,000 Calories</Text>

        <View style={styles.macroCard}>
          <MacroItem label="โปรตีน:" value={110} total={130} color="#8FBC8F" />
          <MacroItem label="ไขมัน:" value={40} total={70} color="#F0E68C" />
          <MacroItem label="คาร์โบไฮเดรต:" value={230} total={250} color="#556B2F" />
        </View>
      </View>

      {/* Health Section */}
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BloodSugar')}>
          <LineChart
            data={{
              datasets: [{ data: bloodSugarChartData.length > 0 ? bloodSugarChartData : [60, 80, 40, 70, 50, 80, 60] }]
            }}
            width={Dimensions.get('window').width / 2 - 30}
            height={100}
            chartConfig={chartConfig('#8FBC8F')}
            bezier
            style={styles.chart}
          />
          <Text style={styles.cardText}>ระดับน้ำตาลในเลือด: {bloodSugarChartData.length > 0 ? `${bloodSugarChartData[bloodSugarChartData.length - 1]} mg/dL` : 'ไม่มีข้อมูล'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WeightProgress')}>
          <LineChart
            data={{
              datasets: [{ data: weightChartData.length > 0 ? weightChartData : [75, 76, 75.5, 75, 76.2, 75.8, 75.5] }]
            }}
            width={Dimensions.get('window').width / 2 - 30}
            height={100}
            chartConfig={chartConfig('#556B2F')}
            bezier
            style={styles.chart}
          />
          <Text style={styles.cardText}>น้ำหนัก: {latestWeight ? `${latestWeight} KG` : 'ไม่มีข้อมูล'}</Text>
        </TouchableOpacity>
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

const chartConfig = (color) => ({
  backgroundGradientFrom: '#F5F5DC',
  backgroundGradientTo: '#F5F5DC',
  color: (opacity = 1) => `${color}${opacity}`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: color,
  }
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F5F5DC', // Light beige background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#8FBC8F', // Soft green background for header
    borderRadius: 12,
    marginBottom: 20,
  },
  iconButton: {
    padding: 10,
    backgroundColor: '#556B2F', // Dark olive green for icon button
    borderRadius: 8,
  },
  profileIcon: {
    padding: 10,
    backgroundColor: '#BDB76B', // Khaki color for profile icon
    borderRadius: 8,
  },
  macroSection: {
    marginBottom: 20,
    backgroundColor: '#FAFAD2', // Light goldenrod yellow for section background
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    color: '#556B2F', // Dark olive for date
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B8E23', // Olive drab for title
    marginTop: 5,
    marginBottom: 5,
  },
  calories: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8FBC8F', // Soft green for calories
  },
  macroCard: {
    alignItems: 'center',
    width: '100%',
  },
  macroItem: {
    marginBottom: 15,
    width: '100%',
  },
  macroLabel: {
    fontSize: 16,
    color: '#556B2F', // Dark olive for label
    marginBottom: 5,
  },
  macroBar: {
    height: 8,
    backgroundColor: '#E0E0E0', // Grey for background bar
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
    color: '#6B8E23', // Olive drab for value
    marginTop: 5,
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF8DC', // Cornsilk for card background
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    width: Dimensions.get('window').width / 2 - 30,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#556B2F', // Dark olive for card text
    marginTop: 10,
    textAlign: 'center',
  },
  chart: {
    marginBottom: 10,
  },
});

export default HealthDashboard;
