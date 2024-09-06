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

      <TouchableOpacity style={styles.reportButton} onPress={() => setModalVisible(true)}>
        <Icon name="flag" size={24} color="red" />
        <Text style={styles.reportButtonText}>รายงาน</Text>
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
            <TouchableOpacity onPress={() => setSelectedReportType('เนื้อหาไม่เหมาะสม')}>
              <Text style={styles.modalOption}>เนื้อหาไม่เหมาะสม</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedReportType('การละเมิดสิทธิบัตร')}>
              <Text style={styles.modalOption}>การละเมิดสิทธิบัตร</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedReportType('อื่น ๆ')}>
              <Text style={styles.modalOption}>อื่น ๆ</Text>
            </TouchableOpacity>
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
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  reportButtonText: {
    marginLeft: 8,
    color: 'red',
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
    fontSize: 16,
    marginVertical: 10,
  },
  commentsInput: {
    width: '100%',
    height: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    textAlignVertical: 'top', // Ensure text input starts at the top
  },
  submitButton: {
    backgroundColor: '#8FBC8F',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
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
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default BlogDetail;
