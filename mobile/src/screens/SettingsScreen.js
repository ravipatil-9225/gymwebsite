import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, Modal, FlatList, Image,
  RefreshControl
} from 'react-native';
import {
  User, Phone, Mail, Calendar, Target, Edit3, Save, X, ArrowLeft,
  Camera, LogOut, Clock, TrendingUp, AlertCircle, CheckCircle,
  CalendarDays, Activity, ChevronRight, Shield
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const FITNESS_GOALS = [
  'Weight Loss', 'Muscle Gain', 'Strength Training',
  'Cardio & Endurance', 'General Fitness', 'Body Transformation'
];

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateUser, uploadPhoto } = useContext(AuthContext);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // Subscription state
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [subLoading, setSubLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    dob: user?.dob || '',
    goal: user?.goal || ''
  });

  useEffect(() => {
    if (!editing) {
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        dob: user?.dob || '',
        goal: user?.goal || ''
      });
    }
  }, [user, editing]);

  // Fetch subscription & payments
  const fetchSubscription = useCallback(async (isBackground = false) => {
    if (!isBackground) setSubLoading(true);
    try {
      const [subRes, payRes] = await Promise.allSettled([
        api.get('/subscription/'),
        api.get('/payments/my-payments')
      ]);

      if (subRes.status === 'fulfilled') {
        setSubscription(subRes.value.data);
      } else {
        setSubscription(null);
      }

      if (payRes.status === 'fulfilled') {
        setPayments(payRes.value.data);
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setSubLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription(false);
  }, [fetchSubscription]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSubscription(true);
  }, [fetchSubscription]);

  // Handlers
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const { name, phone, email, dob, goal } = formData;

    if (!name || name.trim().length < 2) return Alert.alert('Error', 'Full name must be at least 2 characters.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Alert.alert('Error', 'Invalid email address.');
    if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) return Alert.alert('Error', 'Enter a valid 10-digit Indian phone number.');

    if (dob) {
      const selectedDate = new Date(dob);
      const today = new Date();
      if (selectedDate > today) return Alert.alert('Error', 'Date of birth cannot be in the future.');
    }

    setLoading(true);
    try {
      await updateUser({ name, phone, email, dob, goal });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      dob: user?.dob || '',
      goal: user?.goal || ''
    });
    setEditing(false);
  };

  const handlePhotoUpload = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setUploading(true);
      try {
        await uploadPhoto(result.assets[0].uri);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        }
      }
    ]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const isExpired = subscription?.status === 'expired';
  const overduePayment = payments.find(p => p.verificationStatus === 'overdue');
  let daysOverdue = 0;
  if (overduePayment?.expiryDate) {
    daysOverdue = Math.floor((new Date() - new Date(overduePayment.expiryDate)) / (1000 * 60 * 60 * 24));
  }

  const renderGoalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.goalItem}
      onPress={() => {
        handleChange('goal', item);
        setGoalModalVisible(false);
      }}
    >
      <Text style={styles.goalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  // Quick action items
  const quickActions = [
    { title: 'Book a Class', icon: <CalendarDays color="#E34A29" size={20} />, route: 'BookGroupClass' },
    { title: 'Book PT Session', icon: <TrendingUp color="#E34A29" size={20} />, route: 'BookPTSession' },
    { title: 'View Plans', icon: <Activity color="#E34A29" size={20} />, route: null, tab: 'Package' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ACCOUNT </Text>
          <Text style={styles.headerTitleAccent}>SETTINGS</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      {/* Saved Toast */}
      {saved && (
        <View style={styles.toast}>
          <CheckCircle color="#FFF" size={16} />
          <Text style={styles.toastText}>Profile saved successfully!</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />
        }
      >
        {/* ═══ PROFILE CARD ═══ */}
        <View style={styles.card}>
          {/* Avatar with Upload */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {uploading ? (
                <View style={styles.avatar}>
                  <ActivityIndicator color="#E34A29" size="large" />
                </View>
              ) : user?.profileImage?.url ? (
                <Image source={{ uri: user.profileImage.url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <User color="#E34A29" size={40} />
                </View>
              )}
              <TouchableOpacity style={styles.cameraBtn} onPress={handlePhotoUpload} disabled={uploading}>
                <Camera color="#FFF" size={14} />
              </TouchableOpacity>
            </View>

            {!editing && (
              <>
                <Text style={styles.profileName}>{user?.name || 'Member'}</Text>
                <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                <View style={styles.memberTag}>
                  <Text style={styles.memberTagText}>Active Member</Text>
                </View>
              </>
            )}
          </View>

          {/* Edit Profile Button */}
          {!editing ? (
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditing(true)}>
              <Edit3 color="#FFF" size={15} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <>
                    <Save color="#FFF" size={15} />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={loading}>
                <X color="#FFF" size={15} />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Subscription Info ── */}
          <View style={styles.subscriptionSection}>
            {subLoading ? (
              <View style={styles.subSkeleton}>
                <View style={styles.skeletonRow}><View style={styles.skeletonBar} /><View style={styles.skeletonBar} /></View>
                <View style={styles.skeletonRow}><View style={styles.skeletonBar} /><View style={styles.skeletonBar} /></View>
                <View style={styles.skeletonRow}><View style={styles.skeletonBarSmall} /><View style={styles.skeletonBadge} /></View>
              </View>
            ) : !subscription ? (
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>Current Plan:</Text>
                <View style={styles.subValueRow}>
                  <AlertCircle color="#888" size={14} />
                  <Text style={styles.subValueMuted}>No Active Plan</Text>
                </View>
              </View>
            ) : (
              <>
                {overduePayment && (
                  <View style={styles.overdueAlert}>
                    <Text style={styles.overdueTitle}>⚠️ Your payment is overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}.</Text>
                    <Text style={styles.overdueDesc}>Please complete payment for your {overduePayment.planName} plan to continue.</Text>
                  </View>
                )}
                <View style={styles.subRow}>
                  <Text style={styles.subLabel}>Next Renewal:</Text>
                  <View style={styles.subValueRow}>
                    <Clock color={isExpired ? '#EF4444' : '#FFF'} size={14} />
                    <Text style={[styles.subValue, isExpired && styles.subValueExpired]}>{formatDate(subscription.endDate)}</Text>
                  </View>
                </View>
                <View style={styles.subRow}>
                  <Text style={styles.subLabel}>Current Plan:</Text>
                  <View style={styles.subValueRow}>
                    <TrendingUp color={isExpired ? '#EF4444' : '#E34A29'} size={14} />
                    <Text style={styles.subValue}>{subscription.planName}</Text>
                  </View>
                </View>
                <View style={styles.subRow}>
                  <Text style={styles.subLabel}>Status:</Text>
                  <View style={[styles.statusBadge, isExpired ? styles.statusExpired : styles.statusActive]}>
                    {isExpired ? <AlertCircle color="#EF4444" size={10} /> : <CheckCircle color="#22C55E" size={10} />}
                    <Text style={[styles.statusText, isExpired ? styles.statusTextExpired : styles.statusTextActive]}>
                      {isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ═══ PERSONAL INFORMATION ═══ */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <User color="#E34A29" size={18} />
              <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
            </View>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <View style={styles.editSmallBtn}>
                  <Edit3 color="#E34A29" size={13} />
                  <Text style={styles.editSmallText}>Edit</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Full Name */}
          <Text style={styles.label}>FULL NAME</Text>
          <View style={[styles.inputContainer, !editing && styles.inputDisabled]}>
            <User color="#666" size={18} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              editable={editing}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={[styles.inputContainer, !editing && styles.inputDisabled]}>
            <Mail color="#666" size={18} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              editable={editing}
            />
          </View>

          {/* Phone */}
          <Text style={styles.label}>PHONE NUMBER</Text>
          <View style={[styles.inputContainer, !editing && styles.inputDisabled]}>
            <Phone color="#666" size={18} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Contact Number (10 digits)"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              editable={editing}
            />
          </View>

          {/* DOB */}
          <Text style={styles.label}>DATE OF BIRTH</Text>
          <TouchableOpacity 
            style={[styles.inputContainer, !editing && styles.inputDisabled]}
            onPress={() => {
              if (!editing) return;
              if (formData.dob) {
                setTempDate(new Date(formData.dob));
              } else {
                setTempDate(new Date());
              }
              setShowDatePicker(true);
            }}
            activeOpacity={editing ? 0.7 : 1}
          >
            <Calendar color="#666" size={18} style={styles.icon} />
            <Text style={[styles.input, { color: formData.dob ? '#FFF' : '#666', paddingTop: 16, paddingBottom: 16 }]}>
              {formData.dob || "DOB (YYYY-MM-DD)"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal transparent={true} animationType="slide">
                <View style={styles.modalOverlayPicker}>
                  <View style={styles.modalContentPicker}>
                    <View style={styles.modalHeaderPicker}>
                      <TouchableOpacity onPress={() => {
                        handleChange('dob', tempDate.toISOString().split('T')[0]);
                        setShowDatePicker(false);
                      }}>
                        <Text style={styles.modalDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner"
                      textColor="white"
                      maximumDate={new Date()}
                      onChange={(event, date) => {
                        if (date) {
                          setTempDate(date);
                        }
                      }}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={formData.dob ? new Date(formData.dob) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    handleChange('dob', date.toISOString().split('T')[0]);
                  }
                }}
              />
            )
          )}

          {/* Fitness Goal */}
          <Text style={styles.label}>FITNESS GOAL</Text>
          <TouchableOpacity
            style={[styles.inputContainer, !editing && styles.inputDisabled]}
            onPress={() => editing && setGoalModalVisible(true)}
            activeOpacity={editing ? 0.7 : 1}
          >
            <Target color="#666" size={18} style={styles.icon} />
            <Text style={[styles.input, !formData.goal && { color: '#666' }]}>
              {formData.goal ? formData.goal : (editing ? 'Select a goal...' : 'Not set')}
            </Text>
          </TouchableOpacity>

          {/* Save / Cancel in form section */}
          {editing && (
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.formSaveBtn} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Save color="#FFF" size={16} />
                    <Text style={styles.formSaveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.formCancelBtn} onPress={handleCancel} disabled={loading}>
                <X color="#FFF" size={16} />
                <Text style={styles.formCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ═══ QUICK ACTIONS ═══ */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickActionItem}
                onPress={() => {
                  if (action.route) {
                    navigation.navigate(action.route);
                  } else if (action.tab) {
                    navigation.navigate('MainTabs', { screen: action.tab });
                  }
                }}
              >
                <View style={styles.quickActionLeft}>
                  {action.icon}
                  <Text style={styles.quickActionText}>{action.title}</Text>
                </View>
                <ChevronRight color="#666" size={18} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══ UPCOMING CLASSES ═══ */}
        <View style={styles.card}>
          <View style={styles.emptyClasses}>
            <View style={styles.emptyIcon}>
              <CalendarDays color="#E34A29" size={32} />
            </View>
            <Text style={styles.emptyTitle}>NO UPCOMING CLASSES</Text>
            <Text style={styles.emptyDesc}>
              You haven't booked any classes or Personal Training sessions yet. Check out the schedule to get started.
            </Text>
            <TouchableOpacity
              style={styles.bookClassBtn}
              onPress={() => navigation.navigate('BookGroupClass')}
            >
              <Text style={styles.bookClassBtnText}>BOOK A CLASS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ SIGN OUT ═══ */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <LogOut color="#E34A29" size={20} />
          <Text style={styles.logoutText}>SIGN OUT</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Goal Picker Modal */}
      <Modal visible={goalModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Fitness Goal</Text>
            <FlatList
              data={FITNESS_GOALS}
              keyExtractor={(item) => item}
              renderItem={renderGoalItem}
            />
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setGoalModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 56,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222'
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
  headerTitleAccent: { color: '#E34A29', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
  signOutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(227,74,41,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(227,74,41,0.2)',
  },

  // ── Toast ──
  toast: {
    position: 'absolute',
    top: 110,
    right: 16,
    left: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toastText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },

  // ── Card ──
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    padding: 20,
    marginBottom: 16,
  },

  // ── Profile / Avatar ──
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(227, 74, 41, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(227, 74, 41, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(227, 74, 41, 0.5)',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E34A29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111',
  },
  profileName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#888',
    fontSize: 13,
    marginBottom: 10,
  },
  memberTag: {
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderColor: 'rgba(37, 211, 102, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  memberTagText: {
    color: '#25D366',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // ── Edit Profile Button ──
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    marginBottom: 16,
  },
  editProfileText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    backgroundColor: '#E34A29',
    borderRadius: 14,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
  },
  cancelBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  // ── Subscription ──
  subscriptionSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  subSkeleton: { gap: 12 },
  skeletonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  skeletonBar: { height: 12, width: 90, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 6 },
  skeletonBarSmall: { height: 12, width: 60, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 6 },
  skeletonBadge: { height: 18, width: 60, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10 },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subLabel: { color: '#888', fontSize: 13 },
  subValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subValue: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  subValueExpired: { color: '#EF4444' },
  subValueMuted: { color: '#888', fontWeight: '600', fontSize: 13 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  statusExpired: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  statusTextActive: { color: '#22C55E' },
  statusTextExpired: { color: '#EF4444' },
  overdueAlert: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  overdueTitle: { color: '#EF4444', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  overdueDesc: { color: '#EF4444', fontSize: 11 },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  editSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editSmallText: { color: '#E34A29', fontWeight: '600', fontSize: 13 },

  // ── Form ──
  label: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputDisabled: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
  },
  modalOverlayPicker: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContentPicker: {
    backgroundColor: '#151515',
    padding: 16,
    paddingBottom: 30,
  },
  modalHeaderPicker: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  modalDoneText: {
    color: '#E34A29',
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 14 },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  formSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#E34A29',
    borderRadius: 12,
  },
  formSaveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  formCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  formCancelBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  // ── Quick Actions ──
  quickActionsContainer: { marginTop: 12 },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  quickActionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickActionText: { color: '#FFF', fontSize: 15, fontWeight: '500' },

  // ── Empty Classes ──
  emptyClasses: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(227, 74, 41, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  emptyDesc: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 20,
  },
  bookClassBtn: {
    backgroundColor: '#E34A29',
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  bookClassBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },

  // ── Logout ──
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    marginBottom: 16,
  },
  logoutText: {
    color: '#E34A29',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },

  // ── Goal Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#151515',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  goalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  goalItemText: { color: '#FFF', fontSize: 16 },
  modalCloseBtn: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 12,
  },
  modalCloseText: { color: '#FFF', fontWeight: 'bold' }
});
