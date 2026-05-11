import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Linking
} from 'react-native';
import { ChevronRight, ArrowLeft, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';

const ACCENT_COLORS = ['#FFD700', '#a78bfa', '#CD7F32', '#ff4b2b', '#4299e1', '#ed8936', '#38b2ac'];
const DURATION_ORDER = ['1 Day', '1 Month', '3 Months', '6 Months', '1 Year', 'Other'];
const DURATION_LABELS = {
  '1 Day': 'Daily Plans', '1 Month': 'Monthly Plans', '3 Months': '3 Month Plans',
  '6 Months': '6 Month Plans', '1 Year': 'Yearly Plans', 'Other': 'Other Plans',
};
const UPI_ID = 'taraparmar2-2@oksbi';

export default function PackagesScreen() {
  const { user } = useContext(AuthContext);
  const { refreshTrigger } = useContext(SocketContext);
  const [tab, setTab] = useState('plans');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [plans, setPlans] = useState({});
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allPackages, setAllPackages] = useState([]);

  // Payment modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payTab, setPayTab] = useState('upi');
  const [form, setForm] = useState({ name: '', email: '', transactionId: '' });
  const [payStatus, setPayStatus] = useState('idle');
  const [payMsg, setPayMsg] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('');

  const fetchData = async (isSilent = false) => {
    try {
      const [pkgRes, offersRes] = await Promise.all([
        api.get('/public/packages'),
        api.get('/public/offers'),
      ]);
      const activePackages = pkgRes.data.filter(p => p.isActive);
      setAllPackages(activePackages);
      const uniqueCategories = [...new Set(activePackages.map(p => p.category || 'OTHER PACKAGES'))];
      const predefinedOrder = ['BASIC TRAINING PACKAGES', 'PERSONAL TRAINING', 'STEAM BATH'];
      uniqueCategories.sort((a, b) => {
        const iA = predefinedOrder.indexOf(a); const iB = predefinedOrder.indexOf(b);
        if (iA !== -1 && iB !== -1) return iA - iB;
        if (iA !== -1) return -1; if (iB !== -1) return 1;
        return a.localeCompare(b);
      });
      setCategories(uniqueCategories);
      const activeOffers = offersRes.data.filter(o => {
        if (o.isActive === false) return false;
        if (!o.expiryDate) return true;
        const exp = new Date(o.expiryDate); exp.setHours(23, 59, 59, 999);
        return exp >= new Date();
      });
      setOffers(activeOffers);
    } catch (err) { console.error('Fetch error:', err); }
    finally { if (!isSilent) setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, [refreshTrigger]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    const catPlans = allPackages.filter(p => (p.category || 'OTHER PACKAGES') === cat);
    const grouped = {};
    catPlans.forEach((p, idx) => {
      const dur = p.duration || 'Other';
      if (!grouped[dur]) grouped[dur] = [];
      grouped[dur].push({ ...p, accentColor: ACCENT_COLORS[idx % ACCENT_COLORS.length] });
    });
    setPlans(grouped);
  };

  const openPaymentModal = (plan) => {
    setSelectedPlan(plan);
    setPayTab('upi');
    setForm({ name: user?.name || '', email: user?.email || '', transactionId: '' });
    setPayStatus('idle');
    setPayMsg('');
    setVerifyStatus('');
    setModalVisible(true);
  };

  const closeModal = () => { setModalVisible(false); setSelectedPlan(null); setPayStatus('idle'); };

  const openUPIApp = () => {
    if (!selectedPlan) return;
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Tara%20Parmar&am=${selectedPlan.price}&cu=INR&tn=Gym%20Membership%20${encodeURIComponent(selectedPlan.name)}`;
    Linking.openURL(upiUrl).catch(() => {
      Alert.alert('UPI App Not Found', 'Please install a UPI app like Google Pay, PhonePe, or Paytm.');
    });
  };

  const handlePaymentSubmit = async () => {
    if (!form.name || !form.email) {
      return Alert.alert('Error', 'Please enter your name and email.');
    }

    if (payTab === 'upi' && !form.transactionId) {
      return Alert.alert('Error', 'Please enter your UPI Transaction ID after completing payment.');
    }

    setPayStatus('submitting');
    try {
      const token = await AsyncStorage.getItem('userToken');
      let bodyData; let headers = { 'Authorization': `Bearer ${token}` };

      if (payTab === 'upi') {
        // For mobile: Send as JSON without screenshot (manual verification by admin)
        bodyData = JSON.stringify({
          userName: form.name, email: form.email,
          packageId: selectedPlan._id, planName: selectedPlan.name,
          planPrice: selectedPlan.price, paymentMethod: 'upi',
          transactionId: form.transactionId,
        });
        headers['Content-Type'] = 'application/json';
      } else {
        bodyData = JSON.stringify({
          userName: form.name, email: form.email,
          packageId: selectedPlan._id, planName: selectedPlan.name,
          planPrice: selectedPlan.price,
          paymentMethod: payTab === 'later' ? 'pay_later' : 'cash_on_bench',
        });
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(`${api.defaults.baseURL}/payments/verify-and-upload`, {
        method: 'POST', headers, body: bodyData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission Failed');

      setPayMsg(data.message);
      setVerifyStatus(data.payment?.verificationStatus || '');
      setPayStatus('success');
    } catch (err) {
      setPayStatus('error');
      Alert.alert('Payment Error', err.message || 'Something went wrong.');
    }
  };

  // ── Payment Modal Component ──
  const renderPaymentModal = () => (
    <Modal visible={modalVisible} animationType="slide" transparent>
      <View style={ms.overlay}>
        <View style={ms.modalBox}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Close */}
            <TouchableOpacity style={ms.closeBtn} onPress={closeModal}>
              <X color="#888" size={22} />
            </TouchableOpacity>

            {payStatus === 'success' ? (
              <View style={ms.successView}>
                <View style={[ms.successIcon, {
                  backgroundColor: verifyStatus === 'auto_verified' ? 'rgba(34,197,94,0.2)' :
                    verifyStatus === 'cash_pending' ? 'rgba(249,115,22,0.2)' : 'rgba(234,179,8,0.2)'
                }]}>
                  <Text style={ms.successCheck}>
                    {verifyStatus === 'auto_verified' ? '✓' : verifyStatus === 'cash_pending' ? '⏳' : '⏳'}
                  </Text>
                </View>
                <Text style={ms.successTitle}>{payMsg}</Text>
                <Text style={ms.successDesc}>
                  {verifyStatus === 'auto_verified' ? 'Your payment was automatically verified. Your membership is now active!' :
                   verifyStatus === 'cash_pending' ? `Please pay ₹${selectedPlan?.price} at the gym reception. Your membership will be activated once payment is received.` :
                   verifyStatus === 'pending' ? 'Your Pay Later request has been approved. Complete payment before your plan expires.' :
                   'Our team will manually review your transaction. We\'ll update you soon.'}
                </Text>
                <TouchableOpacity style={ms.doneBtn} onPress={closeModal}>
                  <Text style={ms.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Plan Header */}
                {selectedPlan && (
                  <View style={ms.planHeader}>
                    <View style={[ms.planIcon, { backgroundColor: `${selectedPlan.accentColor}20` }]}>
                      <Text style={{ color: selectedPlan.accentColor, fontSize: 20, fontWeight: 'bold' }}>{selectedPlan.name?.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={ms.planName}>{selectedPlan.name}</Text>
                      <Text style={[ms.planPrice, { color: selectedPlan.accentColor }]}>₹{selectedPlan.price} — {selectedPlan.duration}</Text>
                    </View>
                  </View>
                )}

                {/* Payment Method Tabs */}
                <View style={ms.tabRow}>
                  <TouchableOpacity style={[ms.tab, payTab === 'upi' && { backgroundColor: '#E34A29' }]}
                    onPress={() => { setPayTab('upi'); setPayStatus('idle'); }}>
                    <Text style={[ms.tabText, payTab === 'upi' && { color: '#FFF' }]}>💳 UPI</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[ms.tab, payTab === 'cash' && { backgroundColor: '#16a34a' }]}
                    onPress={() => { setPayTab('cash'); setPayStatus('idle'); }}>
                    <Text style={[ms.tabText, payTab === 'cash' && { color: '#FFF' }]}>💵 Cash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[ms.tab, payTab === 'later' && { backgroundColor: '#f97316' }]}
                    onPress={() => { setPayTab('later'); setPayStatus('idle'); }}>
                    <Text style={[ms.tabText, payTab === 'later' && { color: '#FFF' }]}>⏰ Pay Later</Text>
                  </TouchableOpacity>
                </View>

                {/* Common Fields */}
                <TextInput style={ms.input} placeholder="Full Name *" placeholderTextColor="#666"
                  value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
                <TextInput style={ms.input} placeholder="Email Address *" placeholderTextColor="#666"
                  keyboardType="email-address" autoCapitalize="none"
                  value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} />

                {/* UPI Tab Content */}
                {payTab === 'upi' && (
                  <View style={ms.methodBox}>
                    <Text style={ms.stepTitle}>Step 1: Pay via UPI</Text>
                    <Text style={ms.stepDesc}>Tap the button below to open your UPI app and pay ₹{selectedPlan?.price}</Text>
                    <TouchableOpacity style={ms.upiBtn} onPress={openUPIApp}>
                      <Text style={ms.upiBtnText}>Open UPI App to Pay ₹{selectedPlan?.price}</Text>
                    </TouchableOpacity>
                    <Text style={ms.upiIdText}>UPI ID: {UPI_ID}</Text>

                    <View style={ms.stepDivider} />
                    <Text style={ms.stepTitle}>Step 2: Enter Transaction ID</Text>
                    <Text style={ms.stepDesc}>After payment, enter the Transaction ID from your payment confirmation screen.</Text>
                    <TextInput style={ms.input} placeholder="UPI Transaction ID *" placeholderTextColor="#666"
                      value={form.transactionId} onChangeText={v => setForm(f => ({ ...f, transactionId: v }))} />
                  </View>
                )}

                {/* Cash Tab Content */}
                {payTab === 'cash' && (
                  <View style={[ms.methodBox, { borderColor: 'rgba(22,163,74,0.3)' }]}>
                    <Text style={ms.stepTitle}>💵 Pay at the Gym</Text>
                    <Text style={ms.stepDesc}>No online payment required</Text>
                    <View style={ms.infoList}>
                      <Text style={ms.infoItem}>✓ Submit this form to register your interest.</Text>
                      <Text style={ms.infoItem}>✓ Visit the gym reception and pay ₹{selectedPlan?.price} in cash.</Text>
                      <Text style={ms.infoItem}>✓ Staff will activate your membership on the spot.</Text>
                    </View>
                    <View style={ms.amountBox}>
                      <Text style={ms.amountLabel}>Amount to pay at bench</Text>
                      <Text style={ms.amountValue}>₹{selectedPlan?.price}</Text>
                      <Text style={ms.amountDur}>{selectedPlan?.duration}</Text>
                    </View>
                  </View>
                )}

                {/* Pay Later Tab Content */}
                {payTab === 'later' && (
                  <View style={[ms.methodBox, { borderColor: 'rgba(249,115,22,0.3)' }]}>
                    <Text style={ms.stepTitle}>⏰ Pay Later Plan</Text>
                    <Text style={ms.stepDesc}>Start now, pay before expiry</Text>
                    <View style={ms.infoList}>
                      <Text style={ms.infoItem}>✓ Membership activates instantly.</Text>
                      <Text style={ms.infoItem}>✓ You MUST complete payment (₹{selectedPlan?.price}) before your plan expires.</Text>
                      <Text style={[ms.infoItem, { color: '#f97316' }]}>⚠ Unpaid plans will result in overdue status and access restrictions.</Text>
                    </View>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[ms.submitBtn, {
                    backgroundColor: payTab === 'cash' ? '#16a34a' : payTab === 'later' ? '#f97316' : '#E34A29'
                  }]}
                  onPress={handlePaymentSubmit}
                  disabled={payStatus === 'submitting'}>
                  {payStatus === 'submitting' ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={ms.submitText}>
                      {payTab === 'upi' ? 'VERIFY PAYMENT' : payTab === 'cash' ? 'REQUEST CASH PAYMENT' : 'CONFIRM PAY LATER'}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={ms.footerNote}>
                  {payTab === 'upi' ? 'Admin will manually verify your transaction.' :
                   payTab === 'later' ? 'Committing to a binding later payment.' :
                   'Membership activated after cash is paid at reception.'}
                </Text>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E34A29" />
        <Text style={styles.loadingText}>Loading packages...</Text>
      </View>
    );
  }

  // ── Category Plans View ──
  if (selectedCategory) {
    return (
      <View style={styles.container}>
        {renderPaymentModal()}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" />}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedCategory(null)}>
            <ArrowLeft color="#E34A29" size={18} />
            <Text style={styles.backText}> Back to Categories</Text>
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Pricing</Text>
            <Text style={styles.title}>{selectedCategory}</Text>
            <View style={styles.divider} />
            <Text style={styles.subtitle}>Choose the plan that fits your goals.</Text>
          </View>

          {DURATION_ORDER.map(durKey => {
            const durPlans = plans[durKey];
            if (!durPlans || durPlans.length === 0) return null;
            return (
              <View key={durKey} style={styles.durationSection}>
                <View style={styles.durationHeader}>
                  <Text style={styles.durationTitle}>{DURATION_LABELS[durKey] || durKey}</Text>
                  <View style={styles.durationLine} />
                </View>
                {durPlans.map((plan, idx) => (
                  <View key={plan._id || idx} style={[styles.planCard, { borderLeftColor: plan.accentColor, borderLeftWidth: 3 }]}>
                    <View style={styles.planTop}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.planPrice}>₹{plan.price}</Text>
                        <Text style={styles.planDuration}> / {plan.duration}</Text>
                      </View>
                    </View>
                    {plan.description ? <Text style={styles.planDesc}>{plan.description}</Text> : null}
                    {plan.features && plan.features.length > 0 && (
                      <View style={styles.featuresContainer}>
                        <Text style={styles.includesLabel}>INCLUDES:</Text>
                        {plan.features.map((feat, fIdx) => (
                          <View key={fIdx} style={styles.featureRow}>
                            <View style={[styles.featureDot, { backgroundColor: plan.accentColor }]} />
                            <Text style={styles.featureText}>{feat}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {/* Get Started Button */}
                    <TouchableOpacity
                      style={[styles.getStartedBtn, { backgroundColor: plan.accentColor }]}
                      onPress={() => openPaymentModal(plan)}>
                      <Text style={styles.getStartedText}>Get Started</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}

          <Text style={styles.footerText}>All memberships include access to our full facility.</Text>
        </ScrollView>
      </View>
    );
  }

  // ── Main Packages View ──
  return (
    <View style={styles.container}>
      {renderPaymentModal()}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" />}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Choose Your Path</Text>
          <Text style={styles.title}>OUR <Text style={styles.highlight}>PACKAGES</Text></Text>
          <View style={styles.divider} />
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'plans' && styles.tabBtnActive]} onPress={() => setTab('plans')}>
            <Text style={[styles.tabText, tab === 'plans' && styles.tabTextActive]}>Membership Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'offers' && styles.tabBtnActive]} onPress={() => setTab('offers')}>
            <Text style={[styles.tabText, tab === 'offers' && styles.tabTextActive]}>Offers</Text>
          </TouchableOpacity>
        </View>

        {tab === 'plans' ? (
          <>
            <Text style={styles.sectionSubtitle}>Select a category to view training plans.</Text>
            {categories.length === 0 ? (
              <Text style={styles.emptyText}>No categories found.</Text>
            ) : (
              categories.map((cat, idx) => (
                <TouchableOpacity key={idx} style={styles.categoryCard} onPress={() => selectCategory(cat)} activeOpacity={0.7}>
                  <View style={[styles.categoryIcon, { backgroundColor: `${ACCENT_COLORS[idx % ACCENT_COLORS.length]}20` }]}>
                    <Text style={{ color: ACCENT_COLORS[idx % ACCENT_COLORS.length], fontSize: 22, fontWeight: 'bold' }}>{cat.charAt(0)}</Text>
                  </View>
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryName}>{cat}</Text>
                    <Text style={styles.categoryAction}>View Plans</Text>
                  </View>
                  <ChevronRight color="#666" size={20} />
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionSubtitle}>Seasonal discounts and exclusive packages.</Text>
            {offers.length === 0 ? (
              <Text style={styles.emptyText}>No active offers right now.</Text>
            ) : (
              offers.map((offer, idx) => {
                const expiry = offer.expiryDate ? new Date(offer.expiryDate) : null;
                const diffDays = expiry ? Math.ceil((expiry - new Date()) / (86400000)) : null;
                const isEndingSoon = diffDays && diffDays <= 7 && diffDays > 0;
                return (
                  <View key={offer._id || idx} style={styles.offerCard}>
                    {offer.discount && <View style={styles.discountBadge}><Text style={styles.discountText}>{offer.discount} OFF</Text></View>}
                    {isEndingSoon && <View style={styles.endingSoonBadge}><Text style={styles.endingSoonText}>⏰ Ends in {diffDays}d</Text></View>}
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    <Text style={styles.offerDesc}>{offer.description}</Text>
                    {expiry && <View style={styles.expiryRow}><Text style={styles.expiryText}>Valid until: {expiry.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</Text></View>}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Modal Styles ──
const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#111', borderRadius: 20, padding: 24, maxHeight: '90%', borderWidth: 1, borderColor: '#222' },
  closeBtn: { position: 'absolute', top: 0, right: 0, zIndex: 10, padding: 4 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  planIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  planName: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  planPrice: { fontSize: 13, marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#0a0a0a', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  input: { backgroundColor: '#0a0a0a', borderRadius: 12, borderWidth: 1, borderColor: '#222', color: '#FFF', paddingVertical: 14, paddingHorizontal: 16, fontSize: 14, marginBottom: 12 },
  methodBox: { backgroundColor: '#0a0a0a', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(227,74,41,0.2)', padding: 16, marginBottom: 16 },
  stepTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  stepDesc: { color: '#888', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  stepDivider: { height: 1, backgroundColor: '#222', marginVertical: 14 },
  upiBtn: { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  upiBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  upiIdText: { color: '#888', fontSize: 11, textAlign: 'center', marginBottom: 4 },
  infoList: { marginTop: 8 },
  infoItem: { color: '#ccc', fontSize: 13, lineHeight: 22, marginBottom: 4 },
  amountBox: { backgroundColor: 'rgba(22,163,74,0.1)', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' },
  amountLabel: { color: '#86efac', fontSize: 11, marginBottom: 4 },
  amountValue: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  amountDur: { color: '#888', fontSize: 12, marginTop: 2 },
  submitBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 4, shadowColor: '#E34A29', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  footerNote: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 10 },
  successView: { alignItems: 'center', paddingVertical: 20 },
  successIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successCheck: { fontSize: 32 },
  successTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  successDesc: { color: '#A0A0A0', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  doneBtn: { backgroundColor: '#E34A29', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, marginTop: 20 },
  doneBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});

// ── Main Styles ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  scroll: { padding: 24, paddingBottom: 60 },
  loadingContainer: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  header: { alignItems: 'center', marginBottom: 28 },
  eyebrow: { color: '#A0A0A0', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 30, fontWeight: '900', textAlign: 'center' },
  highlight: { color: '#E34A29' },
  divider: { height: 1, width: 40, backgroundColor: '#E34A29', marginVertical: 14 },
  subtitle: { color: '#A0A0A0', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  tabRow: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#E34A29' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: '#FFF' },
  sectionSubtitle: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 14 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  categoryIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  categoryContent: { flex: 1 },
  categoryName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  categoryAction: { color: '#888', fontSize: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { color: '#E34A29', fontWeight: 'bold', fontSize: 14 },
  durationSection: { marginBottom: 28 },
  durationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  durationTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginRight: 12 },
  durationLine: { flex: 1, height: 1, backgroundColor: 'rgba(227,74,41,0.3)' },
  planCard: { backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  planTop: { marginBottom: 8 },
  planName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  planDuration: { color: '#888', fontSize: 13 },
  planDesc: { color: '#A0A0A0', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  featuresContainer: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 12 },
  includesLabel: { color: '#666', fontSize: 10, letterSpacing: 2, fontWeight: 'bold', marginBottom: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  featureDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  featureText: { color: '#CCC', fontSize: 13 },
  getStartedBtn: { marginTop: 14, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  getStartedText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  footerText: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 10 },
  offerCard: { backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  discountBadge: { backgroundColor: '#E34A29', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  discountText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  endingSoonBadge: { backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 10 },
  endingSoonText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },
  offerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  offerDesc: { color: '#A0A0A0', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  expiryRow: { borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 10 },
  expiryText: { color: '#888', fontSize: 12 },
});
