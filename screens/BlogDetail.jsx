import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, Pressable, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';  // สำหรับการดึงข้อมูลผู้ใช้
import { app } from '../config/firebase.config';

const BlogDetail = ({ route }) => {
  const navigation = useNavigation();
  const { blogId } = route.params;
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [additionalComments, setAdditionalComments] = useState('');

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        const db = getFirestore(app);
        const blogRef = doc(db, 'blogs', blogId);
        const blogSnap = await getDoc(blogRef);

        if (blogSnap.exists()) {
          setBlogData(blogSnap.data());
        } else {
          console.error('No such blog document!');
        }
      } catch (error) {
        console.error('Error fetching blog data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [blogId]);

  const handleReport = async () => {
    if (!selectedReportType) {
      Alert.alert('Error', 'กรุณาเลือกประเภทการรายงาน');
      return;
    }

    try {
      const auth = getAuth();  // ดึงข้อมูลการ authenticate ของผู้ใช้
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'กรุณาเข้าสู่ระบบก่อนรายงาน');
        return;
      }

      const db = getFirestore(app);
      const reportRef = collection(db, 'reports');

      await addDoc(reportRef, {
        blogId: blogId,
        reportedAt: Timestamp.now(),  // ใช้ Firestore Timestamp
        reason: selectedReportType,  // ใช้ประเภทการรายงานที่เลือก
        comments: additionalComments, // เพิ่มคำอธิบายเพิ่มเติม
        reporter: user.uid,  // ใช้ uid ของผู้ใช้ที่ล็อกอิน
      });

      Alert.alert('รายงานเสร็จสิ้น', 'การรายงานของคุณถูกส่งเรียบร้อยแล้ว');
      setModalVisible(false);  // ปิดโมดัลหลังจากรายงานเสร็จ
      setAdditionalComments('');  // รีเซ็ตข้อความเพิ่มเติม
    } catch (error) {
      console.error('Error reporting blog:', error);
      Alert.alert('ไม่สามารถส่งรายงานได้', 'กรุณาลองอีกครั้ง');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8FBC8F" />
      </View>
    );
  }

  if (!blogData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Blog not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{blogData.title}</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={[styles.authorIndicator, { backgroundColor: blogData.color || '#8FBC8F' }]} />
        <Text style={styles.authorText}>โดย {blogData.author}</Text>
        <Text style={styles.contentText}>{blogData.content}</Text>
      </View>

      {/* Report Button */}
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="flag" size={24} color="white" />
      </TouchableOpacity>

      {/* Report Type Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เลือกประเภทการรายงาน</Text>
            {['เนื้อหาไม่เหมาะสม', 'การละเมิดสิทธิบัตร', 'อื่น ๆ'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modalOption,
                  selectedReportType === type ? styles.selectedOption : null,
                ]}
                onPress={() => setSelectedReportType(type)}
              >
                <Text style={styles.modalOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.commentsInput}
              placeholder="พิมพ์คำอธิบายเพิ่มเติม (ถ้ามี)"
              value={additionalComments}
              onChangeText={setAdditionalComments}
              multiline
            />
            <Pressable style={styles.submitButton} onPress={handleReport}>
              <Text style={styles.submitButtonText}>ส่งรายงาน</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>ยกเลิก</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FFF5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  authorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  authorText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
  },
  // ปุ่มรายงาน
  reportButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF4C4C', // สีแดงสำหรับธง
    justifyContent: 'center',
    alignItems: 'center',

    // เพิ่มเงาเพื่อให้ดูเป็น 3D
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,  // สำหรับ Android
  },
  reportButtonText: {
    marginLeft: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalOption: {
    width: '100%',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#FFF', // เปลี่ยนสีพื้นหลังปุ่ม
    justifyContent: 'center',
    alignItems: 'center',

    // เพิ่มเงาให้ปุ่มเพื่อให้ดูมีมิติแบบ 3D
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,  // สำหรับ Android
  },
  selectedOption: {
    backgroundColor: '#8FBC8F',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  commentsInput: {
    width: '100%',
    height: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    textAlignVertical: 'top',
  },
  // ปุ่มส่ง
  submitButton: {
    backgroundColor: '#8FBC8F',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',

    // เพิ่มเงาเพื่อให้ดูมีมิติแบบ 3D
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,  // สำหรับ Android
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',

    // เพิ่มเงาเพื่อให้ดูมีมิติแบบ 3D
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,  // สำหรับ Android
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default BlogDetail;
