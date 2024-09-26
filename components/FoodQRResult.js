import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { firebaseDB, firebaseAuth } from '../config/firebase.config'; // Adjust the import path if needed
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const FoodQRResult = ({ route }) => {
    const navigation = useNavigation();
    const { product } = route.params;
    const amount = product.product_quantity ? `${product.product_quantity} ${product.quantity_unit || ''}` : 'N/A';

    if (!product || !product.nutriments) {
        return (
            <View>
                <Text>Error: Invalid product data</Text>
            </View>
        );
    }

    const NutrientItem = ({ icon, label, value }) => (
        <View style={styles.nutrientItem}>
            <Icon name={icon} size={24} color="#2E7D32" style={styles.nutrientIcon} />
            <View>
                <Text style={styles.nutrientLabel}>{label}</Text>
                <Text style={styles.nutrientValue}>{value}</Text>
            </View>
        </View>
    );

    // Safely access nutriments
    const nutriments = product.nutriments || {};

    // Function to convert kJ to kcal
    const kJToKcal = (kJ) => {
        return (kJ / 4.184).toFixed(1);
    };

    // Function to get energy value, checking multiple possible keys
    const getEnergyKj = () => {
        const possibleKeys = ['energy-kj_100g', 'energy-kj', 'energy_kj', 'energy_kj_100g'];
        for (let key of possibleKeys) {
            if (nutriments[key] !== undefined) {
                return nutriments[key];
            }
        }
        return 0; // Default to 0 if no energy value is found
    };

    const energyKj = getEnergyKj();
    const energyKcal = parseFloat(kJToKcal(energyKj));

    const handleAddFood = async () => {
        const userId = firebaseAuth.currentUser?.uid; // Get the authenticated user's ID

        // Check if product name exists, if not, return a default value like 'Unknown Product'
        const productName = product.product_name ? product.product_name : 'Unknown Product';

        // Check if productName is defined before adding it to foodData
        if (productName !== undefined) {
            const foodData = {
                name: productName,
                energy_kcal: energyKcal,
                calories: energyKcal,
                amount: (product.product_quantity || 1) + 'g',
                fat: nutriments.fat_100g || 0,
                carbs: nutriments.carbohydrates_100g || 0,
                protein: nutriments.proteins_100g || 0,
                userId: userId,
                createdAt: serverTimestamp(),
            };
            


            try {
                // Add the food data to the Firestore collection "foodHistory"
                const docRef = await addDoc(collection(firebaseDB, 'foodHistory'), foodData);
                foodData.id = docRef.id; // Add the document ID to foodData
                console.log('Food added to history successfully');

                // Navigate to the AddFood screen with the newly added food details
                navigation.navigate('AddFood', { newFood: foodData });
            } catch (error) {
                console.error('Error adding food to history:', error);
            }
        } else {
            console.error('Error: Product name is undefined.');
        }
    };



    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>{product.product_name}</Text>
                <View style={styles.nutrientContainer}>
                    <NutrientItem
                        icon="flame-outline"
                        label="Energy"
                        value={`${energyKj} kJ (${energyKcal} kcal)`}
                    />
                    <NutrientItem
                        icon="restaurant-outline"
                        label="Fat"
                        value={`${nutriments.fat_100g || 0} g`}
                    />
                    <NutrientItem
                        icon="nutrition-outline"
                        label="Carbohydrates"
                        value={`${nutriments.carbohydrates_100g || 0} g`}
                    />
                    <NutrientItem
                        icon="barbell-outline"
                        label="Proteins"
                        value={`${nutriments.proteins_100g || 0} g`}
                    />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleAddFood}>
                    <Icon name="add-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add to Meal</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333333',
    },
    nutrientContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    nutrientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    nutrientIcon: {
        marginRight: 15,
    },
    nutrientLabel: {
        fontSize: 16,
        color: '#666666',
    },
    nutrientValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
    },
    addButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        margin: 20,
        borderRadius: 10,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default FoodQRResult;
