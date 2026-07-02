import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import MainTabNavigator from './MainTabNavigator';
import { AuthContext } from '../context/AuthContext';
import EnquiryScreen from '../screens/EnquiryScreen';
import FeedbackScreen from '../screens/FeedbackScreen';

// Form screens
import BookGroupClassScreen from '../screens/forms/BookGroupClassScreen';
import BookPTSessionScreen from '../screens/forms/BookPTSessionScreen';
import ParQFormScreen from '../screens/forms/ParQFormScreen';
import PTContractFormScreen from '../screens/forms/PTContractFormScreen';
import TrialWaiverFormScreen from '../screens/forms/TrialWaiverFormScreen';
import SmartNutritionScreen from '../screens/SmartNutritionScreen';
import GalleryScreen from '../screens/GalleryScreen';
import OffersScreen from '../screens/OffersScreen';
import ContactScreen from '../screens/ContactScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Admin screens
import AdminPanelScreen from '../screens/admin/AdminPanelScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminPaymentsScreen from '../screens/admin/AdminPaymentsScreen';
import AdminSummaryScreen from '../screens/admin/AdminSummaryScreen';
import AdminPackagesScreen from '../screens/admin/AdminPackagesScreen';
import AdminTrainersScreen from '../screens/admin/AdminTrainersScreen';
import AdminOffersScreen from '../screens/admin/AdminOffersScreen';
import AdminGalleryScreen from '../screens/admin/AdminGalleryScreen';
import AdminFormScreen from '../screens/admin/AdminFormScreen';
import AdminDocumentsScreen from '../screens/admin/AdminDocumentsScreen';
import AdminCMSScreen from '../screens/admin/AdminCMSScreen';
import AttendanceScannerScreen from '../screens/admin/AttendanceScannerScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, isLoading, user } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator size="large" color="#E34A29" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {token == null ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen} 
              options={{ headerShown: false }} 
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabNavigator} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="BookGroupClass" 
              component={BookGroupClassScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="BookPTSession" 
              component={BookPTSessionScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ParQForm" 
              component={ParQFormScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="PTContractForm" 
              component={PTContractFormScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="TrialWaiverForm" 
              component={TrialWaiverFormScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Enquiry" 
              component={EnquiryScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Feedback" 
              component={FeedbackScreen} 
              options={{ headerShown: false }} 
            />

            <Stack.Screen 
              name="Gallery" 
              component={GalleryScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Offers" 
              component={OffersScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Contact" 
              component={ContactScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="SmartNutrition" 
              component={SmartNutritionScreen} 
              options={{ headerShown: false }} 
            />

            {/* ═══ Admin Screens (Admin Only) ═══ */}
            {user?.role === 'admin' && (
              <>
                <Stack.Screen 
                  name="AdminPanel" 
                  component={AdminPanelScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AdminUsers" 
                  component={AdminUsersScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AdminPayments" 
                  component={AdminPaymentsScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AdminSummary" 
                  component={AdminSummaryScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AdminPackages" 
                  component={AdminPackagesScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AdminTrainers" 
                  component={AdminTrainersScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AdminOffers" 
                  component={AdminOffersScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AdminGallery" 
                  component={AdminGalleryScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AdminEnquiries" 
                  component={AdminFormScreen} 
                  options={{ headerShown: false }} 
                  initialParams={{ title: 'Enquiries & Join Requests', type: 'enquiry' }}
                />
                <Stack.Screen 
                  name="AdminClassBookings" 
                  component={AdminFormScreen} 
                  options={{ headerShown: false }} 
                  initialParams={{ title: 'Group Class Bookings', type: 'group-class' }}
                />
                <Stack.Screen 
                  name="AdminPTSessions" 
                  component={AdminFormScreen} 
                  options={{ headerShown: false }} 
                  initialParams={{ title: 'PT Sessions', type: 'pt-session' }}
                />
                <Stack.Screen 
                  name="AdminFeedback" 
                  component={AdminFormScreen} 
                  options={{ headerShown: false }} 
                  initialParams={{ title: 'Feedback', type: 'feedback' }}
                />
                <Stack.Screen 
                  name="AdminDocuments" 
                  component={AdminDocumentsScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AdminCMS" 
                  component={AdminCMSScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="AttendanceScanner" 
                  component={AttendanceScannerScreen} 
                  options={{ headerShown: false }} 
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

