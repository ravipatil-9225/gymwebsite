import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Vibration, ScrollView, TextInput
} from 'react-native';
import {
  ArrowLeft, QrCode, CheckCircle, XCircle, RefreshCw, Scan, Users, Search
} from 'lucide-react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

// ── Detect if expo-camera is available (it isn't in Expo Go) ──
const cameraAvailable = (() => {
  try {
    require('expo-camera');
    return true;
  } catch (_) {
    return false;
  }
})();

const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// ────────────────────────────────────────────────────────────────────────────────
// Camera scanner — only rendered when expo-camera is available
// (hooks are always called inside this component, satisfying React rules)
// ────────────────────────────────────────────────────────────────────────────────
function QRCameraScanner({ onResult }) {
  const { CameraView, useCameraPermissions } = require('expo-camera');
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const lastScan = useRef(null);

  const handleBarCodeScanned = async ({ data }) => {
    if (loading) return;
    const now = Date.now();
    if (lastScan.current && now - lastScan.current < 3000) return;
    lastScan.current = now;
    setLoading(true);
    try {
      let userId = data;
      try { const p = JSON.parse(data); userId = p.userId || p.id || data; } catch (_) {}
      const res = await api.post('/attendance/check-in', { userId });
      Vibration.vibrate([0, 100, 50, 100]);
      onResult('success', res.data?.message || 'Check-in successful!', res.data?.user || null);
    } catch (err) {
      Vibration.vibrate(500);
      onResult('error', err.response?.data?.message || 'Scan failed. Invalid QR code.', null);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <ActivityIndicator color="#E34A29" style={{ marginTop: 60 }} />;

  if (!permission.granted) {
    return (
      <View style={[styles.resultContainer, { alignItems: 'center', justifyContent: 'center' }]}>
        <QrCode color="#E34A29" size={56} />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permDesc}>Camera permission is needed to scan member QR codes.</Text>
        <TouchableOpacity style={styles.renewBtn} onPress={requestPermission}>
          <Text style={styles.renewBtnText}>GRANT PERMISSION</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraWrapper}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={!loading ? handleBarCodeScanned : undefined}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {loading && <ActivityIndicator color="#E34A29" size="large" style={styles.scanningIndicator} />}
          </View>
          <Text style={styles.scanHint}>
            {loading ? 'Processing...' : "Align the member's QR code within the frame"}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Fallback: manual user ID input (used in Expo Go)
// ────────────────────────────────────────────────────────────────────────────────
function ManualCheckIn({ onResult }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/attendance/check-in', { userId: query.trim() });
      onResult('success', res.data?.message || 'Check-in successful!', res.data?.user || null);
    } catch (err) {
      onResult('error', err.response?.data?.message || 'Check-in failed. Member not found.', null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.manualContainer}>
      <View style={styles.manualIconBg}>
        <Search color="#E34A29" size={40} />
      </View>
      <Text style={styles.manualTitle}>Manual Check-In</Text>
      <Text style={styles.manualDesc}>
        QR camera scanning requires the full production app build.{'\n'}
        For now, enter the member's User ID below to check them in.
      </Text>
      <TextInput
        style={styles.manualInput}
        placeholder="Enter Member User ID..."
        placeholderTextColor="#555"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleCheckIn}
      />
      <TouchableOpacity
        style={[styles.manualBtn, (!query.trim() || loading) && styles.manualBtnDisabled]}
        onPress={handleCheckIn}
        disabled={!query.trim() || loading}
      >
        {loading
          ? <ActivityIndicator color="#FFF" size="small" />
          : <><Scan color="#FFF" size={18} /><Text style={styles.manualBtnText}>CHECK IN</Text></>
        }
      </TouchableOpacity>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Main screen
// ────────────────────────────────────────────────────────────────────────────────
export default function AttendanceScannerScreen({ navigation }) {
  const [scanResult, setScanResult] = useState(null);
  const [scanMessage, setScanMessage] = useState('');
  const [memberInfo, setMemberInfo] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [tab, setTab] = useState('scanner');

  useEffect(() => {
    if (tab === 'log') fetchTodayLog();
  }, [tab]);

  const fetchTodayLog = async () => {
    try {
      const { data } = await api.get('/attendance/today');
      setTodayAttendance(data || []);
    } catch (err) {
      console.error('Attendance log fetch error:', err);
    }
  };

  const handleScanResult = (status, message, member) => {
    setScanResult(status);
    setScanMessage(message);
    setMemberInfo(member);
  };

  const resetScan = () => {
    setScanResult(null);
    setScanMessage('');
    setMemberInfo(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={22} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Scan color="#E34A29" size={20} />
          <Text style={styles.headerTitle}>ATTENDANCE </Text>
          <Text style={styles.headerTitleAccent}>SCANNER</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'scanner' && styles.tabActive]}
          onPress={() => { setTab('scanner'); resetScan(); }}
        >
          <Text style={[styles.tabText, tab === 'scanner' && styles.tabTextActive]}>Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'log' && styles.tabActive]}
          onPress={() => setTab('log')}
        >
          <Text style={[styles.tabText, tab === 'log' && styles.tabTextActive]}>Today's Log</Text>
        </TouchableOpacity>
      </View>

      {tab === 'scanner' ? (
        scanResult ? (
          /* ── Result Card ── */
          <View style={styles.resultContainer}>
            <View style={[
              styles.resultCard,
              scanResult === 'success' ? styles.resultCardSuccess : styles.resultCardError
            ]}>
              {scanResult === 'success'
                ? <CheckCircle color="#22C55E" size={56} />
                : <XCircle color="#EF4444" size={56} />}
              <Text style={[
                styles.resultTitle,
                { color: scanResult === 'success' ? '#22C55E' : '#EF4444' }
              ]}>
                {scanResult === 'success' ? 'CHECK-IN SUCCESSFUL' : 'SCAN FAILED'}
              </Text>
              <Text style={styles.resultMessage}>{scanMessage}</Text>
              {memberInfo && (
                <View style={styles.memberCard}>
                  <Text style={styles.memberName}>{memberInfo.name || 'Member'}</Text>
                  {memberInfo.email && <Text style={styles.memberEmail}>{memberInfo.email}</Text>}
                  <Text style={styles.checkInTime}>✅ Checked in at {formatTime(new Date())}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.resetBtn} onPress={resetScan}>
                <RefreshCw color="#FFF" size={18} />
                <Text style={styles.resetBtnText}>SCAN NEXT MEMBER</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : cameraAvailable ? (
          <QRCameraScanner onResult={handleScanResult} />
        ) : (
          <ManualCheckIn onResult={handleScanResult} />
        )
      ) : (
        /* ── Today's Attendance Log ── */
        <ScrollView style={styles.logContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.logHeader}>
            <Users color="#E34A29" size={18} />
            <Text style={styles.logTitle}>
              {formatDate(new Date())} · {todayAttendance.length} check-in{todayAttendance.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={fetchTodayLog} style={{ marginLeft: 'auto' }}>
              <RefreshCw color="#555" size={16} />
            </TouchableOpacity>
          </View>
          {todayAttendance.length === 0 ? (
            <View style={styles.emptyLog}>
              <QrCode color="#333" size={48} />
              <Text style={styles.emptyLogText}>No check-ins yet today</Text>
            </View>
          ) : (
            todayAttendance.map((record, i) => (
              <View key={record._id || i} style={styles.logRow}>
                <View style={styles.logAvatar}>
                  <Text style={styles.logAvatarText}>
                    {(record.user?.name || 'M').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logName}>{record.user?.name || 'Unknown Member'}</Text>
                  <Text style={styles.logEmail}>{record.user?.email || ''}</Text>
                </View>
                <Text style={styles.logTime}>{formatTime(record.createdAt)}</Text>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 56, backgroundColor: '#111',
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
  headerTitleAccent: { color: '#E34A29', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#E34A29' },
  tabText: { color: '#555', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#E34A29' },

  // Camera
  cameraWrapper: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanFrame: { width: 260, height: 260, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#E34A29', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanningIndicator: { position: 'absolute' },
  scanHint: { color: '#FFF', fontSize: 13, textAlign: 'center', marginTop: 32, paddingHorizontal: 32, lineHeight: 20, opacity: 0.8 },

  // Manual fallback
  manualContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  manualIconBg: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(227,74,41,0.1)', borderWidth: 1, borderColor: 'rgba(227,74,41,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  manualTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  manualDesc: { color: '#666', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  manualInput: {
    width: '100%', backgroundColor: '#111', borderWidth: 1, borderColor: '#333',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: '#FFF', fontSize: 14, marginBottom: 16,
  },
  manualBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E34A29', paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 12, width: '100%', justifyContent: 'center',
    shadowColor: '#E34A29', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  manualBtnDisabled: { opacity: 0.4 },
  manualBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

  // Result
  resultContainer: { flex: 1, padding: 16, justifyContent: 'center' },
  resultCard: { alignItems: 'center', padding: 32, borderRadius: 24, borderWidth: 1 },
  resultCardSuccess: { backgroundColor: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)' },
  resultCardError: { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' },
  resultTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  resultMessage: { color: '#AAA', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  memberCard: { width: '100%', backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: '#222', padding: 16, marginBottom: 24 },
  memberName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  memberEmail: { color: '#888', fontSize: 12, marginBottom: 10 },
  checkInTime: { color: '#22C55E', fontSize: 13, fontWeight: '600' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E34A29', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14,
    shadowColor: '#E34A29', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  resetBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },

  // Permission
  permTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 12, textAlign: 'center' },
  permDesc: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  renewBtn: { backgroundColor: '#E34A29', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  renewBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

  // Log
  logContainer: { flex: 1, padding: 16 },
  logHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  logTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#1A1A1A',
  },
  logAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(227,74,41,0.15)', borderWidth: 1, borderColor: 'rgba(227,74,41,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  logAvatarText: { color: '#E34A29', fontSize: 16, fontWeight: '900' },
  logName: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  logEmail: { color: '#666', fontSize: 11 },
  logTime: { color: '#E34A29', fontSize: 12, fontWeight: 'bold' },
  emptyLog: { alignItems: 'center', paddingVertical: 60 },
  emptyLogText: { color: '#555', fontSize: 14, marginTop: 16 },
});
