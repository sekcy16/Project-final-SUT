import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const RelativeEditModal = ({ isVisible, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhoneNumber(initialData.phoneNumber);
    } else {
      setName('');
      setPhoneNumber('');
    }
  }, [initialData]);

  const handleSave = () => {
    if (name && phoneNumber) {
      onSave({ name, phoneNumber });
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {initialData ? 'แก้ไขข้อมูลญาติ' : 'เพิ่มญาติ'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="ชื่อ-นามสกุล"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="เบอร์โทรศัพท์"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 10,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Kanit-Bold',
  },
  input: {
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
  },
});

export default RelativeEditModal;