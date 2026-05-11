import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform
} from 'react-native';
import {
  ArrowLeft, User, Users, Phone, Mail, Calendar, Search,
  Edit, Trash2, Plus, X, CheckCircle, XCircle,
  Clock, History, Package, Save, Shield
} from 'lucide-react-native';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';

// ── Helpers ──
const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getRemainingDays = (endDate) => {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
};

export default function AdminUsersScreen({ navigation, route }) {
  const { refreshTrigger } = React.useContext(SocketContext);
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [historyUser, setHistoryUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', dob: '', password: '', role: 'user' });
  const [activeTab, setActiveTab] = useState('all');

  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      if (!silent) Alert.alert('Error', 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers, refreshTrigger]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchUsers(true); }, [fetchUsers]);

  // Handle Initial Filter from Dashboard
  useEffect(() => {
    if (route.params?.initialFilter === 'active') {
      setActiveTab('active');
    }
  }, [route.params]);

  // Combined Filter logic
  useEffect(() => {
    let result = users;
    
    // Apply Tab Filter
    if (activeTab === 'active') {
      result = users.filter(u => u.latestMembership && getRemainingDays(u.latestMembership.endDate) > 0);
    } else if (activeTab === 'expired') {
      result = users.filter(u => u.latestMembership && getRemainingDays(u.latestMembership.endDate) <= 0);
    } else if (activeTab === 'noplan') {
      result = users.filter(u => !u.latestMembership);
    }

    // Apply Search q
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.latestMembership?.packageName?.toLowerCase().includes(q)
      );
    }
    
    setFiltered(result);
  }, [search, users, activeTab]);

  const handleDelete = (id, name) => {
    Alert.alert('Delete User', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/users/${id}`);
            fetchUsers(true);
          } catch { Alert.alert('Error', 'Failed to delete user.'); }
        }
      }
    ]);
  };

  const handleCreate = async () => {
    if (!newUser.name || !newUser.email || !newUser.phone || !newUser.password) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    setEditLoading(true);
    try {
      await api.post('/admin/users', newUser);
      setNewUser({ name: '', email: '', phone: '', dob: '', password: '', role: 'user' });
      setShowCreate(false);
      fetchUsers(true);
      Alert.alert('Success', 'User created successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create user.';
      Alert.alert('Error', msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setEditLoading(true);
    try {
      const { _id, ...userData } = editUser;
      await api.put(`/admin/users/${editUser._id}`, userData);
      setEditUser(null);
      fetchUsers(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  const togglePending = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-pending`);
      fetchUsers(true);
    } catch {
      Alert.alert('Error', 'Failed to update permission.');
    }
  };

  // Stats
  const totalUsers = users.length;
  const activePlans = users.filter(u => u.latestMembership && getRemainingDays(u.latestMembership.endDate) > 0).length;
  const expiredPlans = users.filter(u => u.latestMembership && getRemainingDays(u.latestMembership.endDate) <= 0).length;
  const noPlan = users.filter(u => !u.latestMembership).length;

  const renderUserCard = (u) => {
    const m = u.latestMembership;
    const days = m ? getRemainingDays(m.endDate) : null;
    const isActive = days !== null && days > 0;

    return (
      <View key={u._id} style={styles.userCard}>
        {/* Name & Role Row */}
        <View style={styles.userTopRow}>
          <View style={styles.userInfo}>
            <View style={styles.avatarSmall}>
              <User color="#E34A29" size={16} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
            </View>
          </View>
          <View style={[styles.roleBadge, u.role === 'admin' && styles.roleBadgeAdmin]}>
            {u.role === 'admin' && <Shield color="#A855F7" size={10} />}
            <Text style={[styles.roleText, u.role === 'admin' && styles.roleTextAdmin]}>{u.role}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Phone color="#666" size={12} />
            <Text style={styles.detailText}>{u.phone || '—'}</Text>
          </View>
          {u.batchTime && u.batchTime !== 'Not Assigned' && (
            <View style={styles.detailRow}>
              <Clock color="#666" size={12} />
              <Text style={styles.detailText}>{u.batchTime}</Text>
            </View>
          )}
        </View>

        {/* Plan Status */}
        <View style={styles.planRow}>
          {m ? (
            <>
              <View style={[styles.planBadge, isActive ? styles.planActive : styles.planExpired]}>
                {isActive ? <CheckCircle color="#22C55E" size={10} /> : <XCircle color="#EF4444" size={10} />}
                <Text style={[styles.planBadgeText, isActive ? styles.planActiveText : styles.planExpiredText]}>
                  {m.packageName} • {isActive ? `${days}d left` : 'Expired'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noPlanText}>No Active Plan</Text>
          )}

          {/* Allow Pending */}
          <TouchableOpacity
            style={[styles.pendingToggle, u.allowPendingPayment !== false ? styles.pendingAllow : styles.pendingDisable]}
            onPress={() => togglePending(u._id)}
          >
            <Text style={[styles.pendingToggleText, u.allowPendingPayment !== false ? styles.pendingAllowText : styles.pendingDisableText]}>
              {u.allowPendingPayment !== false ? '✔ Pending' : '✖ Pending'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setHistoryUser(u)}>
            <History color="#A855F7" size={14} />
            <Text style={[styles.actionBtnText, { color: '#A855F7' }]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setEditUser({ ...u })}>
            <Edit color="#4F8EF7" size={14} />
            <Text style={[styles.actionBtnText, { color: '#4F8EF7' }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(u._id, u.name)}>
            <Trash2 color="#EF4444" size={14} />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>USER MANAGEMENT</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Plus color="#E34A29" size={24} />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        {[
          { key: 'all', label: 'Total', value: totalUsers, color: '#4F8EF7' },
          { key: 'active', label: 'Active', value: activePlans, color: '#22C55E' },
          { key: 'expired', label: 'Expired', value: expiredPlans, color: '#EF4444' },
          { key: 'noplan', label: 'No Plan', value: noPlan, color: '#888' },
        ].map((s, i) => (
          <TouchableOpacity 
            key={i} 
            style={[styles.statItem, activeTab === s.key && styles.statItemActive]}
            onPress={() => setActiveTab(s.key)}
          >
            <Text style={[styles.statValue, { color: s.color }, activeTab === s.key && styles.statValueActive]}>{s.value}</Text>
            <Text style={[styles.statLabel, activeTab === s.key && styles.statLabelActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search color="#666" size={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, email, phone..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X color="#666" size={16} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E34A29" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />}
        >
          <Text style={styles.resultCount}>{filtered.length} user{filtered.length !== 1 ? 's' : ''} found</Text>
          {filtered.map(renderUserCard)}
          {filtered.length === 0 && (
            <View style={styles.emptyContainer}>
              <Users color="#333" size={48} />
              <Text style={styles.emptyText}>{search ? 'No users match your search' : 'No users found'}</Text>
            </View>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Create User Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New User</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <X color="#FFF" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {[
                { label: 'Full Name *', key: 'name', icon: <User color="#666" size={16} /> },
                { label: 'Email *', key: 'email', icon: <Mail color="#666" size={16} />, keyboard: 'email-address' },
                { label: 'Phone *', key: 'phone', icon: <Phone color="#666" size={16} />, keyboard: 'phone-pad' },
                { label: 'Password *', key: 'password', icon: <Shield color="#666" size={16} />, secure: true },
                { label: 'Date of Birth', key: 'dob', icon: <Calendar color="#666" size={16} /> },
              ].map(({ label, key, icon, keyboard, secure }) => (
                <View key={key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{label}</Text>
                  <View style={styles.formInputRow}>
                    {icon}
                    <TextInput
                      style={styles.formInput}
                      value={newUser[key] || ''}
                      onChangeText={(v) => setNewUser(p => ({ ...p, [key]: v }))}
                      placeholderTextColor="#555"
                      placeholder={label.replace(' *', '')}
                      keyboardType={keyboard || 'default'}
                      secureTextEntry={secure}
                      autoCapitalize={key === 'email' ? 'none' : 'sentences'}
                    />
                  </View>
                </View>
              ))}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Role</Text>
                <View style={styles.roleSelector}>
                  {['user', 'admin'].map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleOption, newUser.role === role && styles.roleOptionActive]}
                      onPress={() => setNewUser(p => ({ ...p, role }))}
                    >
                      <Text style={[styles.roleOptionText, newUser.role === role && styles.roleOptionTextActive]}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreate} disabled={editLoading}>
                {editLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <>
                    <Plus color="#FFF" size={18} />
                    <Text style={styles.modalSaveText}>Create User</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={!!editUser} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => setEditUser(null)}>
                <X color="#FFF" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {editUser && (
                <>
                  {[
                    { label: 'Full Name', key: 'name', icon: <User color="#666" size={16} /> },
                    { label: 'Email', key: 'email', icon: <Mail color="#666" size={16} /> },
                    { label: 'Phone', key: 'phone', icon: <Phone color="#666" size={16} /> },
                    { label: 'Date of Birth', key: 'dob', icon: <Calendar color="#666" size={16} /> },
                    { label: 'Batch Time', key: 'batchTime', icon: <Clock color="#666" size={16} /> },
                  ].map(({ label, key, icon }) => (
                    <View key={key} style={styles.formGroup}>
                      <Text style={styles.formLabel}>{label}</Text>
                      <View style={styles.formInputRow}>
                        {icon}
                        <TextInput
                          style={styles.formInput}
                          value={editUser[key] || ''}
                          onChangeText={(v) => setEditUser(p => ({ ...p, [key]: v }))}
                          placeholderTextColor="#555"
                          placeholder={label}
                        />
                      </View>
                    </View>
                  ))}

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Role</Text>
                    <View style={styles.roleSelector}>
                      {['user', 'admin'].map(role => (
                        <TouchableOpacity
                          key={role}
                          style={[styles.roleOption, editUser.role === role && styles.roleOptionActive]}
                          onPress={() => setEditUser(p => ({ ...p, role }))}
                        >
                          <Text style={[styles.roleOptionText, editUser.role === role && styles.roleOptionTextActive]}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditUser(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdate} disabled={editLoading}>
                {editLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <>
                    <Save color="#FFF" size={15} />
                    <Text style={styles.modalSaveText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Plan History Modal */}
      <Modal visible={!!historyUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Plan History</Text>
                <Text style={styles.modalSubtitle}>{historyUser?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryUser(null)}>
                <X color="#FFF" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {(!historyUser?.allMemberships || historyUser.allMemberships.length === 0) ? (
                <View style={styles.emptyContainer}>
                  <Package color="#333" size={40} />
                  <Text style={styles.emptyText}>No plan history found</Text>
                </View>
              ) : (
                historyUser.allMemberships.map((m, idx) => {
                  const days = getRemainingDays(m.endDate);
                  const isActive = days !== null && days > 0;
                  return (
                    <View key={m._id} style={[styles.historyCard, idx === 0 && styles.historyCardLatest]}>
                      {idx === 0 && <Text style={styles.latestTag}>LATEST</Text>}
                      <Text style={styles.historyPlan}>{m.packageName}</Text>
                      <View style={styles.historyDetailRow}>
                        <Text style={styles.historyLabel}>Duration:</Text>
                        <Text style={styles.historyValue}>{m.planDuration ? `${m.planDuration} days` : '30 days'}</Text>
                      </View>
                      <View style={styles.historyDetailRow}>
                        <Text style={styles.historyLabel}>Period:</Text>
                        <Text style={styles.historyValue}>{fmt(m.startDate)} → {fmt(m.endDate)}</Text>
                      </View>
                      <View style={styles.historyDetailRow}>
                        <Text style={styles.historyLabel}>Amount:</Text>
                        <Text style={styles.historyValue}>₹{m.amountPaid?.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={[styles.planBadge, isActive ? styles.planActive : styles.planExpired, { marginTop: 8 }]}>
                        {isActive ? <CheckCircle color="#22C55E" size={10} /> : <XCircle color="#EF4444" size={10} />}
                        <Text style={[styles.planBadgeText, isActive ? styles.planActiveText : styles.planExpiredText]}>
                          {isActive ? `${days}d remaining` : 'Expired'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}

              {historyUser?.allMemberships?.length > 0 && (
                <View style={styles.totalSpent}>
                  <Text style={styles.totalSpentLabel}>Total Spent</Text>
                  <Text style={styles.totalSpentValue}>
                    ₹{historyUser.allMemberships.reduce((sum, m) => sum + (m.amountPaid || 0), 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 56, backgroundColor: '#111',
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#222',
  },
  statItemActive: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  statValueActive: {
    transform: [{ scale: 1.05 }],
  },
  statLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelActive: {
    color: '#AAA',
  },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#151515',
    margin: 16, marginBottom: 0, borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#222', height: 44, gap: 10,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 13 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingTop: 12 },

  resultCount: { color: '#666', fontSize: 11, marginBottom: 12, fontWeight: '600' },

  userCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 12,
  },
  userTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarSmall: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(227,74,41,0.1)',
    borderWidth: 1, borderColor: 'rgba(227,74,41,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  userName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  userEmail: { color: '#777', fontSize: 11, marginTop: 1 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  roleBadgeAdmin: { backgroundColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)' },
  roleText: { color: '#999', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  roleTextAdmin: { color: '#A855F7' },

  userDetails: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: '#888', fontSize: 11 },

  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  planActive: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  planExpired: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  planBadgeText: { fontSize: 10, fontWeight: '700' },
  planActiveText: { color: '#22C55E' },
  planExpiredText: { color: '#EF4444' },
  noPlanText: { color: '#666', fontSize: 11, fontStyle: 'italic' },

  pendingToggle: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  pendingAllow: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  pendingDisable: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  pendingToggleText: { fontSize: 10, fontWeight: '700' },
  pendingAllowText: { color: '#22C55E' },
  pendingDisableText: { color: '#EF4444' },

  actionRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#1F1F1F', paddingTop: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1A1A1A',
  },
  actionBtnText: { fontSize: 11, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: '#666', fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', borderWidth: 1, borderColor: '#222',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#222',
  },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  modalSubtitle: { color: '#888', fontSize: 12, marginTop: 2 },
  modalScroll: { padding: 20, maxHeight: 400 },
  modalFooter: {
    flexDirection: 'row', gap: 10, padding: 20,
    borderTopWidth: 1, borderTopColor: '#222',
  },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333',
  },
  modalCancelText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  modalSaveBtn: {
    flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E34A29',
  },
  modalSaveText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  formGroup: { marginBottom: 16 },
  formLabel: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  formInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#222',
  },
  formInput: { flex: 1, color: '#FFF', fontSize: 13 },

  roleSelector: { flexDirection: 'row', gap: 10 },
  roleOption: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333',
  },
  roleOptionActive: { backgroundColor: '#E34A29', borderColor: '#E34A29' },
  roleOptionText: { color: '#888', fontWeight: '600', fontSize: 13 },
  roleOptionTextActive: { color: '#FFF' },

  historyCard: {
    backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#222',
  },
  historyCardLatest: { borderColor: 'rgba(168,85,247,0.4)' },
  latestTag: { color: '#A855F7', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  historyPlan: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  historyDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  historyLabel: { color: '#888', fontSize: 11 },
  historyValue: { color: '#CCC', fontSize: 11, fontWeight: '600' },

  totalSpent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, backgroundColor: '#1A1A1A', borderRadius: 12, marginTop: 6,
    borderWidth: 1, borderColor: '#222',
  },
  totalSpentLabel: { color: '#888', fontSize: 12 },
  totalSpentValue: { color: '#E34A29', fontSize: 16, fontWeight: '900' },
});
