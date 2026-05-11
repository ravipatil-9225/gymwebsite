import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Share, Platform
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { 
  ArrowLeft, X, CheckCircle, ShieldAlert, Droplets, 
  Moon, HeartPulse, Target, Download, Utensils,
  Dumbbell, FileText
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';

const LOADING_STEPS = [
  { label: 'Scanning your biometric profile...', icon: '🧬', duration: 1500 },
  { label: 'Calculating caloric targets & macros...', icon: '⚡', duration: 2000 },
  { label: 'Designing your 7-day nutrition protocol...', icon: '🥗', duration: 3000 },
  { label: 'Building personalised workout split...', icon: '🏋️', duration: 3000 },
  { label: 'Applying safety & injury rules...', icon: '🛡️', duration: 2000 },
  { label: 'Computing hydration & sleep plan...', icon: '💧', duration: 2000 },
  { label: 'Finalising supplement guidance...', icon: '💊', duration: 1500 },
  { label: 'Running quality checks...', icon: '✅', duration: 2000 },
];

export default function SmartNutritionScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const timerRef = useRef(null);
  const stepTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'male', weight_kg: '', height_cm: '',
    goal: 'muscle_gain', activity_level: 'moderately_active',
    plan_type: 'diet',
    food_preference: 'non_vegetarian', cuisine_preference: 'Indian_first',
    allergies: '', medical_conditions: '', injuries: '',
    fitness_level: 'intermediate', equipment_available: 'full_gym', sleep_hours_actual: '7'
  });

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(stepTimerRef.current);
    };
  }, []);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateMetrics = () => {
    const w = parseFloat(formData.weight_kg);
    const h = parseFloat(formData.height_cm);
    const a = parseInt(formData.age);
    if (!w || !h || !a) return null;

    const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
    let bmiCategory = 'normal';
    if (bmi < 18.5) bmiCategory = 'underweight';
    else if (bmi >= 25 && bmi < 30) bmiCategory = 'overweight';
    else if (bmi >= 30) bmiCategory = 'obese';

    const bmr = (10 * w) + (6.25 * h) - (5 * a) + (formData.gender === 'male' ? 5 : -161);
    let multiplier = 1.2;
    switch (formData.activity_level) {
      case 'lightly_active': multiplier = 1.375; break;
      case 'moderately_active': multiplier = 1.55; break;
      case 'very_active': multiplier = 1.725; break;
      case 'athlete': multiplier = 1.9; break;
      default: multiplier = 1.2;
    }
    let tdee = bmr * multiplier;

    let target_calories = Math.round(tdee);
    if (formData.goal === 'weight_loss') target_calories -= 500;
    else if (formData.goal === 'weight_gain' || formData.goal === 'muscle_gain') target_calories += 400;

    return {
      bmi: parseFloat(bmi),
      bmiCategory,
      target_calories
    };
  };

  const startLoadingAnimation = () => {
    setLoadingStep(0);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    let stepIndex = 0;
    const advanceStep = () => {
      if (stepIndex < LOADING_STEPS.length - 1) {
        stepIndex++;
        setLoadingStep(stepIndex);
        stepTimerRef.current = setTimeout(advanceStep, LOADING_STEPS[stepIndex].duration);
      }
    };
    stepTimerRef.current = setTimeout(advanceStep, LOADING_STEPS[0].duration);
  };

  const stopLoadingAnimation = () => {
    clearInterval(timerRef.current);
    clearTimeout(stepTimerRef.current);
  };

  const handleSubmit = async () => {
    setError('');
    setResult(null);

    // Validations
    if (!formData.name || formData.name.trim().length === 0 || formData.name.length > 50) {
      setError("Name must be between 1 and 50 characters."); return;
    }
    const ageRaw = parseInt(formData.age);
    if (isNaN(ageRaw) || ageRaw < 10 || ageRaw > 100) {
      setError("Age must be between 10 and 100 years."); return;
    }
    const weightRaw = parseFloat(formData.weight_kg);
    if (isNaN(weightRaw) || weightRaw < 20 || weightRaw > 200) {
      setError("Weight must be between 20kg and 200kg."); return;
    }
    const heightRaw = parseFloat(formData.height_cm);
    if (isNaN(heightRaw) || heightRaw < 120 || heightRaw > 220) {
      setError("Height must be between 120cm and 220cm."); return;
    }
    const metrics = calculateMetrics();
    if (!metrics) {
      setError("Please fill in Weight, Height, and Age correctly."); return;
    }

    const payload = {
      ...formData,
      age: parseInt(formData.age),
      weight_kg: parseFloat(formData.weight_kg),
      height_cm: parseFloat(formData.height_cm),
      sleep_hours_actual: parseFloat(formData.sleep_hours_actual),
      allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
      medical_conditions: formData.medical_conditions ? formData.medical_conditions.split(',').map(s => s.trim()) : [],
      injuries: formData.injuries ? formData.injuries.split(',').map(s => s.trim()) : [],
      ...metrics
    };

    setLoading(true);
    startLoadingAnimation();
    try {
      const res = await api.post('/nutrition/generate', payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during AI generation.');
    } finally {
      setLoading(false);
      stopLoadingAnimation();
    }
  };

  // --- Rendering Functions ---

  const renderForm = () => (
    <View style={styles.formCard}>
      {/* Basic Metrics */}
      <View style={styles.formRow}>
        <View style={styles.formCol}>
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#666" value={formData.name} onChangeText={t => handleChange('name', t)} />
        </View>
        <View style={styles.formCol}>
          <Text style={styles.label}>Age *</Text>
          <TextInput style={styles.input} placeholder="25" placeholderTextColor="#666" keyboardType="numeric" value={formData.age} onChangeText={t => handleChange('age', t)} />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formCol}>
          <Text style={styles.label}>Weight (kg) *</Text>
          <TextInput style={styles.input} placeholder="75" placeholderTextColor="#666" keyboardType="numeric" value={formData.weight_kg} onChangeText={t => handleChange('weight_kg', t)} />
        </View>
        <View style={styles.formCol}>
          <Text style={styles.label}>Height (cm) *</Text>
          <TextInput style={styles.input} placeholder="175" placeholderTextColor="#666" keyboardType="numeric" value={formData.height_cm} onChangeText={t => handleChange('height_cm', t)} />
        </View>
      </View>

      <Text style={styles.label}>Gender *</Text>
      <View style={styles.pickerWrapper}>
        <Picker style={styles.picker} dropdownIconColor="#FFF" selectedValue={formData.gender} onValueChange={v => handleChange('gender', v)}>
          <Picker.Item label="Male" value="male" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Female" value="female" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Other" value="other" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
        </Picker>
      </View>

      <Text style={styles.label}>Primary Goal *</Text>
      <View style={styles.pickerWrapper}>
        <Picker style={styles.picker} dropdownIconColor="#FFF" selectedValue={formData.goal} onValueChange={v => handleChange('goal', v)}>
          <Picker.Item label="Weight Loss" value="weight_loss" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Weight Gain" value="weight_gain" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Muscle Gain" value="muscle_gain" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Maintenance" value="maintenance" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Endurance" value="endurance" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Flexibility" value="flexibility" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
        </Picker>
      </View>

      <Text style={styles.label}>Activity Level *</Text>
      <View style={styles.pickerWrapper}>
        <Picker style={styles.picker} dropdownIconColor="#FFF" selectedValue={formData.activity_level} onValueChange={v => handleChange('activity_level', v)}>
          <Picker.Item label="Sedentary (Office Job)" value="sedentary" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Lightly Active (1-3 days)" value="lightly_active" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Moderately Active (3-5 days)" value="moderately_active" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Very Active (6-7 days)" value="very_active" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Athlete (2x a day)" value="athlete" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
        </Picker>
      </View>

      <Text style={styles.label}>Plan Type *</Text>
      <View style={styles.pickerWrapper}>
        <Picker style={styles.picker} dropdownIconColor="#FFF" selectedValue={formData.plan_type} onValueChange={v => handleChange('plan_type', v)}>
          <Picker.Item label="Diet Plan Only" value="diet" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Workout Plan Only" value="workout" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
        </Picker>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formCol}>
          <Text style={styles.label}>Fitness Level *</Text>
          <View style={styles.pickerWrapper}>
            <Picker style={styles.picker} dropdownIconColor="#FFF" selectedValue={formData.fitness_level} onValueChange={v => handleChange('fitness_level', v)}>
              <Picker.Item label="Beginner" value="beginner" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
              <Picker.Item label="Intermediate" value="intermediate" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
              <Picker.Item label="Advanced" value="advanced" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
            </Picker>
          </View>
        </View>
        <View style={styles.formCol}>
          <Text style={styles.label}>Food Preference *</Text>
          <View style={styles.pickerWrapper}>
            <Picker style={styles.picker} dropdownIconColor="#FFF" selectedValue={formData.food_preference} onValueChange={v => handleChange('food_preference', v)}>
              <Picker.Item label="Non-Vegetarian" value="non_vegetarian" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
              <Picker.Item label="Vegetarian" value="vegetarian" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
              <Picker.Item label="Vegan" value="vegan" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
              <Picker.Item label="Eggetarian" value="eggetarian" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
              <Picker.Item label="Jain" value="jain" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formCol}>
           <Text style={styles.label}>Sleep (Hours) *</Text>
           <TextInput style={styles.input} placeholder="7" placeholderTextColor="#666" keyboardType="decimal-pad" value={formData.sleep_hours_actual} onChangeText={t => handleChange('sleep_hours_actual', t)} />
        </View>
        <View style={styles.formCol}>
           <Text style={styles.label}>Cuisine *</Text>
           <View style={styles.pickerWrapper}>
             <Picker style={styles.picker} dropdownIconColor="#FFF" selectedValue={formData.cuisine_preference} onValueChange={v => handleChange('cuisine_preference', v)}>
               <Picker.Item label="Indian (Rec)" value="Indian_first" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
               <Picker.Item label="Global" value="global" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
             </Picker>
           </View>
        </View>
      </View>

      <Text style={styles.label}>Equipment Available *</Text>
      <View style={styles.pickerWrapper}>
        <Picker style={styles.picker} dropdownIconColor="#FFF" selectedValue={formData.equipment_available} onValueChange={v => handleChange('equipment_available', v)}>
          <Picker.Item label="Full Gym Access" value="full_gym" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Dumbbells Only" value="dumbbells" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="Resistance Bands" value="resistance_bands" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
          <Picker.Item label="None (Bodyweight)" value="none" color={Platform.OS === 'ios' ? '#FFF' : '#000'} />
        </Picker>
      </View>

      {/* Optional Settings */}
      <View style={styles.optionalSection}>
        <View style={styles.optionalHeader}>
          <ShieldAlert color="#E34A29" size={16} />
          <Text style={styles.optionalTitle}>Medical & Safety (Optional)</Text>
        </View>

        <Text style={styles.label}>Allergies (comma separated)</Text>
        <TextInput style={styles.input} placeholder="e.g. peanuts, lactose" placeholderTextColor="#666" value={formData.allergies} onChangeText={t => handleChange('allergies', t)} />

        <Text style={styles.label}>Medical Conditions (comma separated)</Text>
        <TextInput style={styles.input} placeholder="e.g. diabetes, pcos" placeholderTextColor="#666" value={formData.medical_conditions} onChangeText={t => handleChange('medical_conditions', t)} />

        <Text style={styles.label}>Active Injuries (comma separated)</Text>
        <TextInput style={styles.input} placeholder="e.g. left knee" placeholderTextColor="#666" value={formData.injuries} onChangeText={t => handleChange('injuries', t)} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitBtnText}>GENERATE BLUEPRINT</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#E34A29" style={{ marginBottom: 20 }} />
      <Text style={styles.loadingTitle}>Building Your Blueprint</Text>
      <Text style={styles.loadingSubtitle}>{LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)]?.label}</Text>
      <Text style={styles.loadingElapsed}>⏱ {elapsed}s elapsed</Text>

      <View style={styles.stepsBox}>
        {LOADING_STEPS.map((step, i) => (
          <View key={i} style={[styles.stepItem, i < loadingStep && styles.stepDone, i === loadingStep && styles.stepActive]}>
             <Text style={styles.stepIcon}>{i < loadingStep ? '✓' : step.icon}</Text>
             <Text style={[styles.stepLabel, i === loadingStep && { color: '#E34A29' }, i < loadingStep && { color: '#4ade80' }]}>
               {step.label}
             </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const generateHTML = () => {
    const meta = result.planMeta || {};
    const macros = result.macroTargets || {};
    const dietPlan = result.dietPlan || [];
    const workoutPlan = result.workoutPlan || [];
    const hydration = result.hydration || {};
    const supplements = result.supplementSuggestions || [];
    const summary = result.weeklySummary || {};

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #E34A29; padding-bottom: 15px; margin-bottom: 20px; }
            .title { color: #E34A29; font-size: 26px; font-weight: bold; text-transform: uppercase; margin: 0; }
            .meta { font-size: 14px; color: #666; margin-top: 5px; }
            .macros { display: flex; justify-content: space-around; background: #fef2f2; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
            .macro-item { text-align: center; }
            .macro-val { font-size: 18px; font-weight: bold; color: #E34A29; }
            .macro-lab { font-size: 10px; text-transform: uppercase; color: #666; }
            .section-title { font-size: 18px; font-weight: bold; border-left: 5px solid #E34A29; padding-left: 12px; margin: 30px 0 15px; text-transform: uppercase; color: #000; }
            .day-card { border: 1px solid #eee; border-radius: 10px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; background: #fafafa; }
            .day-header { display: flex; justify-content: space-between; font-weight: bold; border-bottom: 2px solid #fff; margin-bottom: 15px; padding-bottom: 10px; font-size: 16px; color: #E34A29; }
            .meal { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #eee; }
            .meal:last-child { border-bottom: none; }
            .meal-title { font-size: 14px; font-weight: bold; color: #444; margin-bottom: 5px; display: flex; justify-content: space-between; }
            .meal-item { font-size: 13px; margin: 4px 0; color: #555; }
            .ex-table { width: 100%; border-collapse: collapse; }
            .ex-table th { text-align: left; font-size: 11px; color: #999; text-transform: uppercase; padding: 8px; border-bottom: 2px solid #fff; }
            .ex-table td { font-size: 13px; padding: 10px 8px; border-bottom: 1px solid #eee; }
            .tip-list { padding-left: 20px; }
            .tip-item { margin-bottom: 8px; font-size: 13px; }
            .info-box { background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">SMARTNUTRITION BLUEPRINT</h1>
            <p class="meta">For ${meta.generatedFor} • ${meta.caloriesTarget} kcal/day • Goal: ${(meta.goal||'').replace(/_/g, ' ')}</p>
          </div>

          <div class="macros">
            <div class="macro-item"><div class="macro-val">${macros.daily_calories || meta.caloriesTarget}</div><div class="macro-lab">Calories</div></div>
            <div class="macro-item"><div class="macro-val">${macros.protein_g || '--'}g</div><div class="macro-lab">Protein</div></div>
            <div class="macro-item"><div class="macro-val">${macros.carbs_g || '--'}g</div><div class="macro-lab">Carbs</div></div>
            <div class="macro-item"><div class="macro-val">${macros.fat_g || '--'}g</div><div class="macro-lab">Fats</div></div>
          </div>

          <div class="info-box">
            <strong>💧 Hydration:</strong> ${hydration.daily_water_liters || '--'} Liters per day<br/>
            <strong>💊 Supplements:</strong> ${supplements.length > 0 ? supplements.map(s => `${s.name} (${s.recommended_dose})`).join(', ') : 'None suggested'}
          </div>

          ${dietPlan.length > 0 ? `
            <h2 class="section-title">7-Day Nutrition Protocol</h2>
            ${dietPlan.map(day => `
              <div class="day-card">
                <div class="day-header"><span>${day.day} — ${day.date_label}</span><span>${day.total_calories} kcal</span></div>
                ${Object.entries(day.meals).map(([name, m]) => `
                  <div class="meal">
                    <div class="meal-title"><span>${name.toUpperCase()}</span> <span>${m.time}</span></div>
                    ${m.items.map(it => `<div class="meal-item">• ${it.quantity} ${it.unit} ${it.name} (${it.calories} cal) — <i>${it.preparation_tip || ''}</i></div>`).join('')}
                  </div>
                `).join('')}
              </div>
            `).join('')}
          ` : ''}

          ${workoutPlan.length > 0 ? `
            <h2 class="section-title">7-Day Training Split</h2>
            ${workoutPlan.map(day => `
              <div class="day-card">
                <div class="day-header"><span>${day.day} — ${day.date_label}</span><span>${day.total_duration_minutes || '--'} min</span></div>
                <p style="margin:0 0 10px; font-weight:bold; color:#666;">Focus: ${day.focus || (day.isRestDay ? 'Rest & Recovery' : '')}</p>
                ${day.isRestDay ? '<p style="font-size:13px; font-style:italic; color:#E34A29;">Active recovery day. Focus on mobility, light walking, and quality sleep.</p>' : `
                  <table class="ex-table">
                    <thead><tr><th>Exercise</th><th>Sets x Reps</th><th>Rest</th></tr></thead>
                    <tbody>
                      ${day.main_workout.map(ex => `
                        <tr><td>${ex.name}<br/><small style="color:#888;">${ex.instruction || ''}</small></td><td style="font-weight:bold;">${ex.sets} x ${ex.reps}</td><td style="color:#999;">${ex.rest_seconds}s</td></tr>
                      `).join('')}
                    </tbody>
                  </table>
                `}
              </div>
            `).join('')}
          ` : ''}

          ${summary.top_3_tips ? `
            <h2 class="section-title">Weekly Blueprint Summary</h2>
            <div class="day-card">
              <p><i>${summary.goal_alignment_note || ''}</i></p>
              <h4 style="color:#E34A29; margin-bottom:10px;">Success Tips:</h4>
              <ul class="tip-list">
                ${summary.top_3_tips.map(tip => `<li class="tip-item">${tip}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="margin-top: 50px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            <strong>Tara Fitness SmartNutrition Hub</strong><br/>
            AI Generated Blueprint • Validated for ${meta.generatedFor}<br/>
            <i>Disclaimer: This plan is for informational purposes only. Consult a healthcare professional before start.</i>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing Error', 'Sharing is not available on this device');
        return;
      }

      setLoading(true);
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      const safeName = (formData.name || 'My').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const newUri = `${FileSystem.cacheDirectory}${safeName}_blueprint.pdf`;
      
      await FileSystem.copyAsync({ from: uri, to: newUri });
      await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', dialogueTitle: 'Download Nutrition Blueprint' });
    } catch (err) {
      console.error('PDF Error:', err);
      Alert.alert('Error', 'Failed to generate PDF. Make sure you have storage permissions enabled.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDoc = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing Error', 'Sharing is not available on this device');
        return;
      }

      setLoading(true);
      const html = generateHTML();
      const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'></head>
        <body>${html}</body>
        </html>
      `;
      
      const safeName = (formData.name || 'My').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeName}_blueprint.doc`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, docHtml, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'application/msword', dialogueTitle: 'Download Editable Blueprint' });
    } catch (err) {
      console.error('DOC Error:', err);
      Alert.alert('Error', 'Failed to generate Word file.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const meta = result.planMeta;
      const macros = result.macroTargets;
      let text = `🏋️ MY SMARTNUTRITION BLUEPRINT\n`;
      text += `--------------------------------\n`;
      text += `Generated for: ${meta.generatedFor}\n`;
      text += `Goal: ${meta.goal}\n`;
      text += `Daily Target: ${meta.caloriesTarget} kcal\n\n`;
      text += `📊 MACROS:\n`;
      text += `P: ${macros.protein_g}g | C: ${macros.carbs_g}g | F: ${macros.fat_g}g\n\n`;
      text += `💧 HYDRATION: ${result.hydration?.daily_water_liters}L/day\n\n`;
      text += `Check the app for the full 7-day Diet & Workout split!\n`;
      
      await Share.share({ message: text });
    } catch (err) {
      Alert.alert('Error', 'Failed to share plan.');
    }
  };

  const renderResult = () => {
    if (!result) return null;
    const meta = result.planMeta || {};
    const macros = result.macroTargets || {};
    const dietPlan = Array.isArray(result.dietPlan) ? result.dietPlan : [];
    const workoutPlan = Array.isArray(result.workoutPlan) ? result.workoutPlan : [];

    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>PLAN GENERATED ✓</Text>
          <Text style={styles.resultSubtitle}>For {meta.generatedFor} • {meta.caloriesTarget} kcal/day • {(meta.goal||'').replace(/_/g, ' ').toUpperCase()}</Text>
          {meta.safetyNotice ? <Text style={styles.safetyNotice}>{meta.safetyNotice}</Text> : null}
          
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.newBtn} onPress={() => setResult(null)}>
              <Text style={styles.newBtnText}>↩ NEW</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleDownloadPDF}>
              <Download color="#FFF" size={12} />
              <Text style={styles.shareBtnText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, {backgroundColor: '#2563EB'}]} onPress={handleDownloadDoc}>
              <FileText color="#FFF" size={12} />
              <Text style={styles.shareBtnText}>DOC</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Macros */}
        {Object.keys(macros).length > 0 && (
          <View style={styles.macrosRow}>
             <View style={styles.macroBox}><Text style={[styles.macroValue, {color:'#E34A29'}]}>{macros.daily_calories}</Text><Text style={styles.macroLabel}>KCAL</Text></View>
             <View style={styles.macroBox}><Text style={[styles.macroValue, {color:'#60a5fa'}]}>{macros.protein_g||0}g</Text><Text style={styles.macroLabel}>PROTEIN</Text></View>
             <View style={styles.macroBox}><Text style={[styles.macroValue, {color:'#4ade80'}]}>{macros.carbs_g||0}g</Text><Text style={styles.macroLabel}>CARBS</Text></View>
             <View style={styles.macroBox}><Text style={[styles.macroValue, {color:'#facc15'}]}>{macros.fat_g||0}g</Text><Text style={styles.macroLabel}>FATS</Text></View>
          </View>
        )}

        {/* Diet Plan */}
        {dietPlan.length > 0 && (
          <View style={styles.planSection}>
            <Text style={styles.sectionHeading}>🥗 7-DAY NUTRITION PROTOCOL</Text>
            {dietPlan.map((day, idx) => (
              <View key={idx} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{day.day} — {day.date_label}</Text>
                  <Text style={styles.daySub}>{day.total_calories || '--'} kcal</Text>
                </View>
                {Object.entries(day.meals || {}).map(([mealName, meal]) => (
                  <View key={mealName} style={styles.mealBox}>
                    <Text style={styles.mealTitle}>{mealName.replace(/([A-Z])/g, ' $1').trim()} {meal?.time ? `(${meal.time})` : ''}</Text>
                    {(meal?.items || []).map((item, i) => (
                      <View key={i} style={styles.mealItemRow}>
                        <Text style={styles.mealItem}>{item.quantity} {item.unit} {item.name}</Text>
                        <Text style={styles.mealCal}>{item.calories} kcal</Text>
                      </View>
                    ))}
                    {(!meal?.items || meal.items.length === 0) && <Text style={styles.noItems}>No items</Text>}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Workout Plan */}
        {workoutPlan.length > 0 && (
          <View style={styles.planSection}>
            <Text style={styles.sectionHeading}>🏋️ 7-DAY TRAINING SPLIT</Text>
            {workoutPlan.map((day, idx) => (
              <View key={idx} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={{flex: 1}}>
                    <Text style={styles.dayTitle}>{day.day} — {day.date_label}</Text>
                    <Text style={styles.daySub}>{day.isRestDay ? '🛌 Rest & Recovery' : `${day.type || ''}${day.focus ? ` • ${day.focus}` : ''}`}</Text>
                  </View>
                  <Text style={styles.daySub}>{day.total_duration_minutes || '--'} min</Text>
                </View>

                {day.isRestDay ? (
                  <View style={styles.mealBox}>
                     {(day.active_recovery || []).map((r, i) => (
                        <Text key={i} style={styles.mealItem}>• {typeof r === 'string' ? r : r.activity || r.name || ''}</Text>
                     ))}
                     {(!day.active_recovery || day.active_recovery.length === 0) && <Text style={styles.mealItem}>Light stretching recommended</Text>}
                  </View>
                ) : (
                  <View style={styles.mealBox}>
                    <View style={styles.exerHeader}>
                      <Text style={[styles.exerCol, {flex: 2}]}>Exercise</Text>
                      <Text style={styles.exerCol}>Sets×Reps</Text>
                      <Text style={styles.exerCol}>Rest</Text>
                    </View>
                    {(day.main_workout || []).map((ex, i) => (
                      <View key={i} style={styles.exerRow}>
                        <Text style={[styles.exerItem, {flex: 2}]}>{ex.name}</Text>
                        <Text style={[styles.exerItem, {color:'#E34A29', fontWeight: 'bold'}]}>{ex.sets}×{ex.reps}</Text>
                        <Text style={[styles.exerItem, {color:'#888'}]}>{ex.rest_seconds}s</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Hydration & Supplements */}
        <View style={styles.planSection}>
          <Text style={styles.sectionHeading}>💧 HYDRATION & SUPPLEMENTS</Text>
          <View style={styles.dayCard}>
            <View style={styles.infoRow}>
              <Droplets color="#E34A29" size={20} />
              <View style={{flex: 1}}>
                <Text style={styles.infoValue}>{result.hydration?.daily_water_liters || '--'} L/day</Text>
                <Text style={styles.infoLabel}>Water Intake Target</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.subHeading}>SUGGESTED SUPPLEMENTS</Text>
            {(result.supplementSuggestions || []).map((sup, i) => (
              <View key={i} style={styles.supItem}>
                <Text style={styles.supName}>{sup.name} <Text style={styles.supDose}>({sup.recommended_dose})</Text></Text>
                <Text style={styles.supPurpose}>{sup.purpose} • {sup.best_timing}</Text>
              </View>
            ))}
            {(!result.supplementSuggestions || result.supplementSuggestions.length === 0) && (
              <Text style={styles.noItems}>No supplements recommended</Text>
            )}
          </View>
        </View>

        {/* Weekly Summary */}
        {result.weeklySummary && (
          <View style={styles.planSection}>
            <Text style={styles.sectionHeading}>📋 WEEKLY BLUEPRINT SUMMARY</Text>
            <View style={styles.dayCard}>
               <Text style={styles.summaryNote}>{result.weeklySummary.goal_alignment_note}</Text>
               <View style={styles.tipsBox}>
                  <Text style={styles.tipsTitle}>TOP TIPS FOR THE WEEK</Text>
                  {(result.weeklySummary.top_3_tips || []).map((tip, i) => (
                    <Text key={i} style={styles.tipText}>• {tip}</Text>
                  ))}
               </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.resetBtn} onPress={() => setResult(null)}>
          <Text style={styles.resetBtnText}>CREATE ANOTHER PLAN</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SmartNutrition Hub</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!result && !loading && renderForm()}
        {loading && renderLoading()}
        {result && !loading && renderResult()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  scroll: { padding: 20, paddingBottom: 60 },
  
  formCard: { backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#222' },
  formRow: { flexDirection: 'row', gap: 12 },
  formCol: { flex: 1 },
  label: { color: '#888', fontSize: 12, fontWeight: 'bold', uppercase: true, marginBottom: 8, marginTop: 16, letterSpacing: 1 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 10, color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  pickerWrapper: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 10, overflow: 'hidden' },
  picker: { color: '#FFF', height: 50 },
  
  optionalSection: { marginTop: 24, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#222' },
  optionalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  optionalTitle: { color: '#E34A29', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  
  errorText: { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, textAlign: 'center', marginTop: 20, fontSize: 13 },
  submitBtn: { backgroundColor: '#E34A29', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, shadowColor: '#E34A29', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 2 },
  
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  loadingSubtitle: { color: '#E34A29', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  loadingElapsed: { color: '#888', fontSize: 12, marginBottom: 30 },
  stepsBox: { width: '100%', backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#222' },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  stepActive: { backgroundColor: 'rgba(227,74,41,0.1)', borderRadius: 8, paddingHorizontal: 10 },
  stepDone: { opacity: 0.7 },
  stepIcon: { fontSize: 16, color: '#888' },
  stepLabel: { color: '#888', fontSize: 13, flex: 1 },
  
  resultContainer: { gap: 24 },
  resultHeader: { backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#222', alignItems: 'center' },
  resultTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  resultSubtitle: { color: '#A0A0A0', fontSize: 13 },
  safetyNotice: { color: '#ef4444', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 10, paddingHorizontal: 10 },
  resultActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  newBtn: { backgroundColor: '#222', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  newBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  shareBtn: { backgroundColor: '#E34A29', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  
  macrosRow: { flexDirection: 'row', gap: 10 },
  macroBox: { flex: 1, backgroundColor: '#111', paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: '#222', alignItems: 'center' },
  macroValue: { fontSize: 18, fontWeight: '900' },
  macroLabel: { color: '#888', fontSize: 10, marginTop: 4, letterSpacing: 1 },
  
  planSection: { gap: 16 },
  sectionHeading: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  dayCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#222' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 12, marginBottom: 12 },
  dayTitle: { color: '#E34A29', fontSize: 15, fontWeight: 'bold' },
  daySub: { color: '#888', fontSize: 12, marginTop: 2 },
  mealBox: { marginBottom: 16 },
  mealTitle: { color: '#FFF', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  mealItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  mealItem: { color: '#CCC', fontSize: 13, flex: 1, paddingRight: 10 },
  mealCal: { color: '#666', fontSize: 12 },
  noItems: { color: '#666', fontSize: 12, fontStyle: 'italic' },
  
  exerHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 6, marginBottom: 8 },
  exerCol: { color: '#666', fontSize: 10, textTransform: 'uppercase', flex: 1 },
  exerRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  exerItem: { color: '#CCC', fontSize: 13, flex: 1 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  infoValue: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  infoLabel: { color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 16 },
  subHeading: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  supItem: { backgroundColor: '#1A1A1A', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  supName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  supDose: { color: '#E34A29', fontSize: 12 },
  supPurpose: { color: '#888', fontSize: 12, marginTop: 4 },
  
  summaryNote: { color: '#CCC', fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: 16 },
  tipsBox: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: '#E34A29' },
  tipsTitle: { color: '#E34A29', fontSize: 11, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  tipText: { color: '#FFF', fontSize: 13, marginBottom: 8, lineHeight: 18 },
  
  resetBtn: { backgroundColor: '#222', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  resetBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 2 },
});
