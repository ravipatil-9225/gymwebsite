import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PlaceholderPage from './pages/PlaceholderPage';
import Packages from './pages/Packages';
import ServicesPage from './pages/ServicesPage';
import Trainers from './pages/Trainers';
import Media from './pages/Media';
import Contact from './pages/Contact';
import Portal from './pages/Portal';
import SmartNutrition from './pages/SmartNutrition';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import JoinUs from './pages/JoinUs';
import BookGroupClass from './pages/forms/BookGroupClass';
import BookPTSession from './pages/forms/BookPTSession';
import EnquiryForm from './pages/forms/EnquiryForm';
import FeedbackForm from './pages/forms/FeedbackForm';
import ContactInfo from './pages/ContactInfo';
import ParQForm from './pages/forms/ParQForm';
import TrialWaiverForm from './pages/forms/TrialWaiverForm';
import PTContractForm from './pages/forms/PTContractForm';
import GalleryPage from './pages/GalleryPage';
import TransformationsPage from './pages/TransformationsPage';
import MembershipPlans from './pages/MembershipPlans';
import CategoryPlans from './pages/CategoryPlans';
import OffersPage from './pages/OffersPage';
import SeeFeedbackPage from './pages/SeeFeedbackPage';
import NotFound from './pages/NotFound';
import UserDashboard from './pages/UserDashboard';

// Admin Imports
import AdminLayout from './components/layout/AdminLayout';
import AdminRoute from './components/routing/AdminRoute';
import PrivateRoute from './components/routing/PrivateRoute';
import PublicRoute from './components/routing/PublicRoute';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import PackagesManager from './pages/admin/PackagesManager';
import TrainersManager from './pages/admin/TrainersManager';
import OffersManager from './pages/admin/OffersManager';
import GalleryManager from './pages/admin/GalleryManager';
import CMSManager from './pages/admin/CMSManager';
import PaymentsManager from './pages/admin/PaymentsManager';
import SummaryDashboard from './pages/admin/SummaryDashboard';
import { EnquiriesManager, ClassBookingsManager, PTSessionsManager, FeedbackManager, DocumentsManager } from './pages/admin/FormManagers';
import AttendanceManager from './pages/admin/AttendanceManager';
import UserProfile from './pages/admin/UserProfile';
import ProductsManager from './pages/admin/ProductsManager';
import ProductsPage from './pages/ProductsPage';
import InvoicesManager from './pages/admin/InvoicesManager';
import BirthdayManager from './pages/admin/BirthdayManager';

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '677200111519-ckd14p5oojhpfv0fn3sq4cf0sb98j3m4.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-dark transition-colors duration-300">
              <Navbar />

              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                  <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  <Route path="/services" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
                  <Route path="/packages" element={<PrivateRoute><Packages /></PrivateRoute>} />
                  <Route path="/trainers" element={<PrivateRoute><Trainers /></PrivateRoute>} />
                  <Route path="/media" element={<PrivateRoute><Media /></PrivateRoute>} />
                  <Route path="/contact" element={<PrivateRoute><Contact /></PrivateRoute>} />
                  <Route path="/portal" element={<PrivateRoute><Portal /></PrivateRoute>} />
                  <Route element={<AdminRoute />}>
                    <Route path="/smart-nutrition" element={<SmartNutrition />} />
                  </Route>
                  <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
                  <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                  <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
                  <Route path="/join" element={<PrivateRoute><JoinUs /></PrivateRoute>} />

                  {/* Forms Routes */}
                  <Route path="/forms/join" element={<PrivateRoute><JoinUs /></PrivateRoute>} />
                  <Route path="/forms/book-pt" element={<PrivateRoute><BookPTSession /></PrivateRoute>} />
                  <Route path="/forms/book-class" element={<PrivateRoute><BookGroupClass /></PrivateRoute>} />
                  <Route path="/forms/enquiry" element={<PrivateRoute><EnquiryForm /></PrivateRoute>} />
                  <Route path="/forms/feedback" element={<PrivateRoute><FeedbackForm /></PrivateRoute>} />
                  <Route path="/forms/par-q" element={<PrivateRoute><ParQForm /></PrivateRoute>} />
                  <Route path="/forms/trial-waiver" element={<PrivateRoute><TrialWaiverForm /></PrivateRoute>} />
                  <Route path="/forms/pt-contract" element={<PrivateRoute><PTContractForm /></PrivateRoute>} />

                  {/* Media Routes */}
                  <Route path="/media/gallery" element={<PrivateRoute><GalleryPage /></PrivateRoute>} />
                  <Route path="/media/transformations" element={<PrivateRoute><TransformationsPage /></PrivateRoute>} />

                  {/* Contact Routes */}
                  <Route path="/contact/info" element={<PrivateRoute><ContactInfo /></PrivateRoute>} />
                  <Route path="/contact/see-feedback" element={<PrivateRoute><SeeFeedbackPage /></PrivateRoute>} />

                  {/* Package Routes */}
                  <Route path="/packages/plans" element={<PrivateRoute><MembershipPlans /></PrivateRoute>} />
                  <Route path="/packages/plans/:categoryName" element={<PrivateRoute><CategoryPlans /></PrivateRoute>} />
                  <Route path="/offers" element={<PrivateRoute><OffersPage /></PrivateRoute>} />
                  <Route path="/products" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />

                  <Route path="/admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="summary" element={<SummaryDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="users/:userId" element={<UserProfile />} />
                      <Route path="attendance" element={<AttendanceManager />} />
                      <Route path="enquiries" element={<EnquiriesManager />} />
                      <Route path="classes" element={<ClassBookingsManager />} />
                      <Route path="pt-sessions" element={<PTSessionsManager />} />
                      <Route path="packages" element={<PackagesManager />} />
                      <Route path="trainers" element={<TrainersManager />} />
                      <Route path="offers" element={<OffersManager />} />
                      <Route path="gallery" element={<GalleryManager />} />
                      <Route path="payments" element={<PaymentsManager />} />
                      <Route path="products" element={<ProductsManager />} />
                      <Route path="invoices" element={<InvoicesManager />} />
                      <Route path="feedback" element={<FeedbackManager />} />
                      <Route path="documents" element={<DocumentsManager />} />
                      <Route path="cms" element={<CMSManager />} />
                      <Route path="birthdays" element={<BirthdayManager />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
