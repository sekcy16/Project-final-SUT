import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import RelativeEditModal from "./RelativeEditModal"; // Import the new component

const RelativesListScreen = () => {
  const [relatives, setRelatives] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRelative, setEditingRelative] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchRelatives();
  }, []);

  const fetchRelatives = async () => {
    const user = firebaseAuth.currentUser;
    if (user) {
      const userDocRef = doc(firebaseDB, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setRelatives(userDoc.data().relatives || []);
      }
    }
  };

  const handleEdit = (relative, index) => {
    setEditingRelative({ ...relative, index });
    setIsModalVisible(true);
  };

  const updateRelative = async (value, index) => {
    const [name, phoneNumber] = value.split(",");
    if (name && phoneNumber) {
      const updatedRelatives = [...relatives];
      updatedRelatives[index] = { name, phoneNumber };
      setRelatives(updatedRelatives);

      const user = firebaseAuth.currentUser;
      if (user) {
        const userDocRef = doc(firebaseDB, "users", user.uid);
        await updateDoc(userDocRef, { relatives: updatedRelatives });
      }
    } else {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบถ้วน");
    }
  };

  const handleAdd = () => {
    setEditingRelative(null);
    setIsModalVisible(true);
  };

  const handleSave = async (data) => {
    let updatedRelatives;
    if (editingRelative) {
      // Edit existing relative
      updatedRelatives = [...relatives];
      updatedRelatives[editingRelative.index] = data;
    } else {
      // Add new relative
      updatedRelatives = [...relatives, data];
    }
    setRelatives(updatedRelatives);

    const user = firebaseAuth.currentUser;
    if (user) {
      const userDocRef = doc(firebaseDB, "users", user.uid);
      await updateDoc(userDocRef, { relatives: updatedRelatives });
    }
  };

  const handleDelete = (index) => {
    Alert.alert("ยืนยันการลบ", "คุณแน่ใจหรือไม่ที่จะลบรายชื่อญาตินี้?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        onPress: async () => {
          const updatedRelatives = relatives.filter((_, i) => i !== index);
          setRelatives(updatedRelatives);
          const user = firebaseAuth.currentUser;
          if (user) {
            const userDocRef = doc(firebaseDB, "users", user.uid);
            await updateDoc(userDocRef, { relatives: updatedRelatives });
          }
        },
        style: "destructive",
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPhone}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          onPress={() => handleEdit(item, index)}
          style={styles.editButton}
        >
          <Icon name="pencil" size={20} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(index)}
          style={styles.deleteButton}
        >
          <Icon name="delete" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>รายชื่อญาติ</Text>
        </View>
        <FlatList
          data={relatives}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>ไม่มีรายชื่อญาติ</Text>
          }
          contentContainerStyle={styles.listContent}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
      <RelativeEditModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSave}
        initialData={editingRelative}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 24,
    color: "#FFF",
    marginLeft: 16,
    fontFamily: "Kanit-Bold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontFamily: "Kanit-Bold",
    color: "#333",
  },
  itemPhone: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
    fontFamily: "Kanit-Regular",
  },
  editButton: {
    backgroundColor: "#4A90E2",
    padding: 8,
    borderRadius: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
    color: "#FFF",
    fontFamily: "Kanit-Regular",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  itemActions: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#4A90E2",
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#FF6B6B",
    padding: 8,
    borderRadius: 20,
  },
});
export default RelativesListScreen;
