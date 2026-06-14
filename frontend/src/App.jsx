import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Suspense, lazy } from 'react';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminRoute from './components/routing/AdminRoute';
import PrivateRoute from './components/routing/PrivateRoute';
import AdminLayout from './components/layout/AdminLayout';

// ── Lazy load every page so initial bundle is tiny ──────────────────────────
const Home                = lazy(() => import('./pages/Home'));
const Login               = lazy(() => import('./pages/Login'));
const Register            = lazy(() => import('./pages/Register'));
const Settings            = lazy(() => import('./pages/Settings'));
const PlaceholderPage     = lazy(() => import('./pages/PlaceholderPage'));
const Packages            = lazy(() => import('./pages/Packages'));
const ServicesPage        = lazy(() => import('./pages/ServicesPage'));
const Trainers            = lazy(() => import('./pages/Trainers'));
const Media               = lazy(() => import('./pages/Media'));
const Contact             = lazy(() => import('./pages/Contact'));
const Portal              = lazy(() => import('./pages/Portal'));
const SmartNutrition      = lazy(() => import('./pages/SmartNutrition'));
const ForgotPassword      = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword       = lazy(() => import('./pages/ResetPassword'));
const JoinUs              = lazy(() => import('./pages/JoinUs'));
const BookGroupClass      = lazy(() => import('./pages/forms/BookGroupClass'));
const BookPTSession       = lazy(() => import('./pages/forms/BookPTSession'));
const EnquiryForm         = lazy(() => import('./pages/forms/EnquiryForm'));
const FeedbackForm        = lazy(() => import('./pages/forms/FeedbackForm'));
const ContactInfo         = lazy(() => import('./pages/ContactInfo'));
const ParQForm            = lazy(() => import('./pages/forms/ParQForm'));
const TrialWaiverForm     = lazy(() => import('./pages/forms/TrialWaiverForm'));
const PTContractForm      = lazy(() => import('./pages/forms/PTContractForm'));
const GalleryPage         = lazy(() => import('./pages/GalleryPage'));
const TransformationsPage = lazy(() => import('./pages/TransformationsPage'));
const MembershipPlans     = lazy(() => import('./pages/MembershipPlans'));
const CategoryPlans       = lazy(() => import('./pages/CategoryPlans'));
const OffersPage          = lazy(() => import('./pages/OffersPage'));
const SeeFeedbackPage     = lazy(() => import('./pages/SeeFeedbackPage'));
const NotFound            = lazy(() => import('./pages/NotFound'));
const UserDashboard       = lazy(() => import('./pages/UserDashboard'));

// Admin pages — loaded only when user navigates to /admin
const Dashboard           = lazy(() => import('./pages/admin/Dashboard'));
const UserManagement      = lazy(() => import('./pages/admin/UserManagement'));
const PackagesManager     = lazy(() => import('./pages/admin/PackagesManager'));
const TrainersManager     = lazy(() => import('./pages/admin/TrainersManager'));
const OffersManager       = lazy(() => import('./pages/admin/OffersManager'));
const GalleryManager      = lazy(() => import('./pages/admin/GalleryManager'));
const CMSManager          = lazy(() => import('./pages/admin/CMSManager'));
const PaymentsManager     = lazy(() => import('./pages/admin/PaymentsManager'));
const SummaryDashboard    = lazy(() => import('./pages/admin/SummaryDashboard'));
import { EnquiriesManager, ClassBookingsManager, PTSessionsManager, FeedbackManager, DocumentsManager } from './pages/admin/FormManagers';

// Minimal full-screen spinner shown during page chunk download
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', background: 'transparent'
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid #333',
        borderTop: '3px solid #f97316', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

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
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/trainers" element={<Trainers />} />
                    <Route path="/media" element={<Media />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/portal" element={<PrivateRoute><Portal /></PrivateRoute>} />
                    <Route element={<AdminRoute />}>
                      <Route path="/smart-nutrition" element={<SmartNutrition />} />
                    </Route>
                    <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/join" element={<JoinUs />} />

                    {/* Forms Routes */}
                    <Route path="/forms/join" element={<JoinUs />} />
                    <Route path="/forms/book-pt" element={<BookPTSession />} />
                    <Route path="/forms/book-class" element={<BookGroupClass />} />
                    <Route path="/forms/enquiry" element={<EnquiryForm />} />
                    <Route path="/forms/feedback" element={<FeedbackForm />} />
                    <Route path="/forms/par-q" element={<ParQForm />} />
                    <Route path="/forms/trial-waiver" element={<TrialWaiverForm />} />
                    <Route path="/forms/pt-contract" element={<PTContractForm />} />

                    {/* Media Routes */}
                    <Route path="/media/gallery" element={<GalleryPage />} />
                    <Route path="/media/transformations" element={<TransformationsPage />} />

                    {/* Contact Routes */}
                    <Route path="/contact/info" element={<ContactInfo />} />
                    <Route path="/contact/see-feedback" element={<SeeFeedbackPage />} />

                    {/* Package Routes */}
                    <Route path="/packages/plans" element={<MembershipPlans />} />
                    <Route path="/packages/plans/:categoryName" element={<CategoryPlans />} />
                    <Route path="/offers" element={<OffersPage />} />

                    <Route path="/admin" element={<AdminRoute />}>
                      <Route element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="summary" element={<SummaryDashboard />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="enquiries" element={<EnquiriesManager />} />
                        <Route path="classes" element={<ClassBookingsManager />} />
                        <Route path="pt-sessions" element={<PTSessionsManager />} />
                        <Route path="packages" element={<PackagesManager />} />
                        <Route path="trainers" element={<TrainersManager />} />
                        <Route path="offers" element={<OffersManager />} />
                        <Route path="gallery" element={<GalleryManager />} />
                        <Route path="payments" element={<PaymentsManager />} />
                        <Route path="feedback" element={<FeedbackManager />} />
                        <Route path="documents" element={<DocumentsManager />} />
                        <Route path="cms" element={<CMSManager />} />
                      </Route>
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
