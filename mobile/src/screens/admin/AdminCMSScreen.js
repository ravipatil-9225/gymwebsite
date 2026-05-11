import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput
} from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';

const sections = [
  {
    id: 'hero',
    name: 'Hero Section',
    fields: [
      { key: 'title', label: 'Main Headline', type: 'text' },
      { key: 'subtitle', label: 'Sub-headline', type: 'textarea' },
      { key: 'buttonText', label: 'Primary Button Text', type: 'text' }
    ]
  },
  {
    id: 'about',
    name: 'About Section',
    fields: [
      { key: 'heading', label: 'Section Heading', type: 'text' },
      { key: 'description', label: 'About Us Details', type: 'textarea' },
      { key: 'mission', label: 'Our Mission Statement', type: 'textarea' }
    ]
  },
  {
    id: 'footer',
    name: 'Footer & Contact',
    fields: [
      { key: 'address', label: 'Gym Address', type: 'textarea' },
      { key: 'phone', label: 'Contact Phone', type: 'text' },
      { key: 'email', label: 'Contact Email', type: 'text' },
      { key: 'copyright', label: 'Copyright Text', type: 'text' }
    ]
  }
];

export default function AdminCMSScreen({ navigation }) {
  const { refreshTrigger } = useContext(SocketContext);
  const [activeSection, setActiveSection] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contentData, setContentData] = useState({});

  const fetchContent = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(`/admin/content/${activeSection}`);
      setContentData(data?.data || {});
    } catch (err) {
      if (!silent) Alert.alert('Error', 'Failed to load content for section');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSection]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent, refreshTrigger]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContent(true);
  }, [fetchContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/content/${activeSection}`, { data: contentData });
      Alert.alert('Success', 'Content saved successfully.');
      fetchContent(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (key, value) => {
    setContentData(prev => ({ ...prev, [key]: value }));
  };

  const activeConfig = sections.find(s => s.id === activeSection);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CMS MANAGER</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || loading}>
          {saving ? (
            <ActivityIndicator size="small" color="#E34A29" />
          ) : (
            <Save color="#E34A29" size={24} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {sections.map(sec => (
            <TouchableOpacity
              key={sec.id}
              style={[styles.tabBtn, activeSection === sec.id && styles.activeTabBtn]}
              onPress={() => setActiveSection(sec.id)}
            >
              <Text style={[styles.tabText, activeSection === sec.id && styles.activeTabText]}>
                {sec.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E34A29" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" />}
        >
          <Text style={styles.sectionTitle}>Editing: {activeConfig?.name}</Text>
          
          <View style={styles.formCard}>
            {activeConfig?.fields.map(field => (
              <View key={field.key} style={styles.formGroup}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <TextInput
                  style={[styles.formInput, field.type === 'textarea' && styles.textArea]}
                  value={contentData[field.key] || ''}
                  onChangeText={(v) => handleFieldChange(field.key, v)}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  placeholderTextColor="#666"
                  multiline={field.type === 'textarea'}
                  textAlignVertical={field.type === 'textarea' ? 'top' : 'center'}
                />
              </View>
            ))}
            
            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
              onPress={handleSave} 
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Publish Changes'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: '#1F1F1F', backgroundColor: '#0A0A0A' },
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#1A1A1A' },
  activeTabBtn: { backgroundColor: 'rgba(227, 74, 41, 0.1)', borderWidth: 1, borderColor: '#E34A29' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#E34A29' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  formCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1F1F1F' },
  formGroup: { marginBottom: 16 },
  formLabel: { color: '#AAA', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  formInput: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#222', borderRadius: 10, color: '#FFF', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: { minHeight: 100, paddingTop: 12 },
  saveBtn: { backgroundColor: '#E34A29', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
