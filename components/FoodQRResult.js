import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { firebaseDB, firebaseAuth } from '../config/firebase.config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const FoodQRResult = ({ route }) => {
    const navigation = useNavigation();
    const { product } = route.params;
    
    const determineUnit = () => {
        console.log('Product:', product);
        console.log('product.quantity:', product.quantity);
        console.log('product.product_quantity:', product.product_quantity);
    
        if (product.quantity_unit) {
            console.log('Quantity unit from product:', product.quantity_unit);
            // Normalize the unit to avoid duplicates
            const normalizedUnit = product.quantity_unit.toLowerCase().replace(/(.)\1+/g, '$1');
            console.log('Normalized quantity unit:', normalizedUnit);
            return normalizedUnit;
        }
    
        const liquidCategories = ['beverages', 'drinks', 'liquids', 'milk', 'juice', 'water', 'soda', 'cola'];
        const isLiquid = liquidCategories.some(category => 
            product.categories_tags?.some(tag => tag.toLowerCase().includes(category)) ||
            product.categories?.toLowerCase().includes(category) ||
            product.product_name?.toLowerCase().includes(category)
        );
    
        // Check if the quantity string includes 'ml', 'l', or 'g'
        if (product.quantity) {
            console.log('Original quantity string:', product.quantity);
            const normalizedQuantity = product.quantity.toLowerCase().replace(/(.)\1+/g, '$1');
            console.log('Normalized quantity string:', normalizedQuantity);
            
            if (normalizedQuantity.includes('ml')) return 'ml';
            if (normalizedQuantity.includes('l')) return 'l';
            if (normalizedQuantity.includes('g')) return 'g';
        }
    
        console.log('Determined unit based on product type:', isLiquid ? 'ml' : 'g');
        return isLiquid ? 'ml' : 'g';
    };
    
    const formatQuantity = (quantity, unit) => {
        console.log('Formatting quantity:', quantity, 'with unit:', unit);
        let numericQuantity = parseFloat(quantity);
        
        if (unit === 'l') {
            if (numericQuantity < 10) {
                return `${numericQuantity.toFixed(1)}L`;
            }
            return `${(numericQuantity / 1000).toFixed(1)}L`;
        }
    
        if (unit === 'ml' && numericQuantity >= 1000) {
            return `${(numericQuantity / 1000).toFixed(1)}L`;
        }
    
        if (unit === 'g' && numericQuantity >= 1000) {
            return `${(numericQuantity / 1000).toFixed(1)}kg`;
        }
    
        return `${numericQuantity} ${unit}`;
    };
    
    const unit = determineUnit();
    console.log('Determined unit:', unit);
    const amount = product.product_quantity ? formatQuantity(product.product_quantity, unit) : 'N/A';
    console.log('Formatted amount:', amount);


    if (!product || !product.nutriments) {
        return (
            <View>
                <Text>Error: Invalid product data</Text>
            </View>
        );
    }

    const NutrientItem = ({ icon, label, value, color }) => (
        <View style={[styles.nutrientItem, { backgroundColor: color }]}>
            <Icon name={icon} size={28} color="#FFFFFF" style={styles.nutrientIcon} />
            <View>
                <Text style={styles.nutrientLabel}>{label}</Text>
                <Text style={styles.nutrientValue}>{value}</Text>
            </View>
        </View>
    );

    const nutriments = product.nutriments || {};

    
    const getEnergyKj = () => {
        const possibleKeys = ['energy-kj_100g', 'energy-kj', 'energy_kj', 'energy_kj_100g'];
        for (let key of possibleKeys) {
            if (nutriments[key] !== undefined) {
                return nutriments[key];
            }
        }
        return null;
    };

    
    const getEnergyKcal = () => {
        const possibleKeys = ['energy-kcal_100g', 'energy-kcal', 'energy_kcal', 'energy_kcal_100g'];
        for (let key of possibleKeys) {
            if (nutriments[key] !== undefined) {
                return nutriments[key];
            }
        }
        return null;
    };

    // Function to convert kJ to kcal
    const kJToKcal = (kJ) => {
        return (kJ / 4.184).toFixed(1);
    };

    let energyKj = getEnergyKj();
    let energyKcal = getEnergyKcal();

    // If we have kJ but not kcal, calculate kcal
    if (energyKj !== null && energyKcal === null) {
        energyKcal = kJToKcal(energyKj);
    }
    // If we have kcal but not kJ, calculate kJ
    else if (energyKcal !== null && energyKj === null) {
        energyKj = (energyKcal * 4.184).toFixed(1);
    }

    // If we still don't have values, default to 0
    energyKj = energyKj !== null ? energyKj : 0;
    energyKcal = energyKcal !== null ? energyKcal : 0;

    const handleAddFood = async () => {
        const userId = firebaseAuth.currentUser?.uid;
        const productName = product.product_name ? product.product_name : 'Unknown Product';
    
        if (productName !== undefined) {
            const foodData = {
                name: productName,
                energy_kcal: parseFloat(energyKcal),
                calories: parseFloat(energyKcal),
                amount: amount, // Use the formatted amount here
                unit: unit,
                fat: nutriments.fat_100g || 0,
                carbs: nutriments.carbohydrates_100g || 0,
                protein: nutriments.proteins_100g || 0,
                userId: userId,
                createdAt: serverTimestamp(),
            };
    
            try {
                const docRef = await addDoc(collection(firebaseDB, 'foodHistory'), foodData);
                foodData.id = docRef.id;
                console.log('Food added to history successfully');
                navigation.navigate('AddFood', { newFood: foodData, alreadyInFirestore: true });
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
                <Text style={styles.title}>{product.product_name || 'ไม่ทราบชื่อสินค้า'}</Text>
                <Text style={styles.subtitle}>ปริมาณ: {amount}</Text>
                <View style={styles.nutrientContainer}>
                    <NutrientItem
                        icon="flame-outline"
                        label="พลังงาน"
                        value={`${energyKj} กิโลจูล (${energyKcal} กิโลแคลอรี่)`}
                        color="#FF6B6B"
                    />
                    <NutrientItem
                        icon="restaurant-outline"
                        label="ไขมัน"
                        value={`${nutriments.fat_100g || 0} กรัม`}
                        color="#4ECDC4"
                    />
                    <NutrientItem
                        icon="nutrition-outline"
                        label="คาร์โบไฮเดรต"
                        value={`${nutriments.carbohydrates_100g || 0} กรัม`}
                        color="#45B7D1"
                    />
                    <NutrientItem
                        icon="barbell-outline"
                        label="โปรตีน"
                        value={`${nutriments.proteins_100g || 0} กรัม`}
                        color="#FF9F1C"
                    />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleAddFood}>
                    <Icon name="add-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>เพิ่มในประวัติ</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2C3E50',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#7F8C8D',
        marginBottom: 20,
        textAlign: 'center',
    },
    nutrientContainer: {
        marginBottom: 20,
    },
    nutrientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        padding: 15,
        borderRadius: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    nutrientIcon: {
        marginRight: 15,
    },
    nutrientLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    nutrientValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    addButton: {
        backgroundColor: '#2ECC71',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default FoodQRResult;