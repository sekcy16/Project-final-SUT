import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const TotalCalories = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.title}>Summary</Text>
        <Text style={styles.dateText}>23/7/2024</Text>
        <View style={styles.nutrientSummary}>
          <NutrientRow label="Calories" value="2000/2300" />
          <NutrientRow label="Protein" value="110/130 g" />
          <NutrientRow label="Fat" value="40/70 g" />
          <NutrientRow label="Carbohydrates" value="230/250 g" />
          <NutrientRow label="Sugar" value="30/40 g" />
          <NutrientRow label="Fiber" value="30/40 g" />
        </View>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Today's Intake</Text>
        <DetailItem label="Breakfast" value="500 cal" />
        <DetailItem label="Lunch" value="750 cal" />
        <DetailItem label="Dinner" value="750 cal" />
        <Text style={styles.detailsTitle}>Exercise</Text>
        <DetailItem label="Running" value="30 mins" />
      </View>
    </ScrollView>
  );
};

const NutrientRow = ({ label, value }) => (
  <View style={styles.nutrientRow}>
    <Text style={styles.nutrientLabel}>{label}:</Text>
    <Text style={styles.nutrientValue}>{value}</Text>
  </View>
);

const DetailItem = ({ label, value }) => (
  <View style={styles.detailItemContainer}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  summaryContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 18,
    color: '#777',
    marginBottom: 20,
  },
  nutrientSummary: {
    borderTopColor: '#e0e0e0',
    borderTopWidth: 1,
    paddingTop: 20,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  nutrientLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  detailItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 18,
    color: '#555',
  },
  detailValue: {
    fontSize: 18,
    color: '#4CAF50',
  },
});

export default TotalCalories;
