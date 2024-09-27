import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, Pressable, TextInput, ScrollView, SafeAreaView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firebase.config';
import { LinearGradient } from 'expo-linear-gradient';

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
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Blog not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={['#8FBC8F', '#F6FFF5']}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{blogData.title}</Text>
        </LinearGradient>

        <View style={styles.contentContainer}>
          <View style={styles.authorContainer}>
            <View style={[styles.authorIndicator, { backgroundColor: blogData.color || '#8FBC8F' }]} />
            <Text style={styles.authorText}>โดย {blogData.author}</Text>
          </View>
          {blogData.photo && (
            <Image source={{ uri: blogData.photo }} style={styles.blogImage} />
          )}
          <Text style={styles.contentText}>{blogData.content}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => setModalVisible(true)}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF4C4C']}
          style={styles.reportButtonGradient}
        >
          <Icon name="flag" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

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
                <Text style={[
                  styles.modalOptionText,
                  selectedReportType === type ? styles.selectedOptionText : null,
                ]}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.commentsInput}
              placeholder="พิมพ์คำอธิบายเพิ่มเติม (ถ้ามี)"
              value={additionalComments}
              onChangeText={setAdditionalComments}
              multiline
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleReport}>
              <LinearGradient
                colors={['#8FBC8F', '#6B8E23']}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>ส่งรายงาน</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    fontFamily: 'Kanit-Bold',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  authorText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Kanit-Regular',
  },
  blogImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 10,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontFamily: 'Kanit-Regular',
  },
  reportButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
  },
  reportButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    fontFamily: 'Kanit-Bold',
  },
  modalOption: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F0F0F0',
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: '#8FBC8F',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Kanit-Regular',
  },
  selectedOptionText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: 'Kanit-Bold',
  },
  commentsInput: {
    width: '100%',
    height: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    textAlignVertical: 'top',
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
  },
  submitButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    marginTop: 20,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
  },
});

export default BlogDetail;