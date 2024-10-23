import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView, SafeAreaView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'กรุณาเข้าสู่ระบบก่อนรายงาน');
        return;
      }

      const db = getFirestore(app);
      const reportRef = collection(db, 'reports');

      await addDoc(reportRef, {
        blogId: blogId,
        reportedAt: Timestamp.now(),
        reason: selectedReportType,
        comments: additionalComments,
        reporter: user.uid,
      });

      Alert.alert('รายงานเสร็จสิ้น', 'การรายงานของคุณถูกส่งเรียบร้อยแล้ว');
      setModalVisible(false);
      setAdditionalComments('');
    } catch (error) {
      console.error('Error reporting blog:', error);
      Alert.alert('ไม่สามารถส่งรายงานได้', 'กรุณาลองอีกครั้ง');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!blogData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Blog not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{blogData.title}</Text>
        </View>

        <ScrollView style={styles.content}>
          <LinearGradient colors={['#ffffff', '#f0f0f0']} style={styles.blogGradient}>
            <View style={styles.authorContainer}>
              <View style={[styles.categoryContainer, { backgroundColor: blogData.category === 'health' ? '#a8e6cf' : '#ffd3b6' }]}>
                <Text style={styles.blogCategory}>{blogData.category === 'health' ? 'สุขภาพ' : 'สูตรอาหาร'}</Text>
              </View>
              <Text style={styles.authorText}>โดย {blogData.author}</Text>
            </View>
            {blogData.photo && (
              <Image source={{ uri: blogData.photo }} style={styles.blogImage} />
            )}
            <Text style={styles.contentText}>{blogData.content}</Text>
          </LinearGradient>
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
                  colors={['#4A90E2', '#50E3C2']}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: '#FFF',
    marginLeft: 15,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  blogGradient: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  authorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  blogCategory: {
    fontSize: 12,
    fontFamily: 'Kanit-Regular',
    color: '#333',
  },
  authorText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Kanit-Regular',
  },
  blogImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
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
    backgroundColor: '#4A90E2',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    fontFamily: 'Kanit-Regular',
  },
});

export default BlogDetail;