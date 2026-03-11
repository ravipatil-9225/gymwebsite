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
import MembershipPlans from './pages/MembershipPlans';

// Admin Imports
import AdminLayout from './components/layout/AdminLayout';
import AdminRoute from './components/routing/AdminRoute';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import PackagesManager from './pages/admin/PackagesManager';
import TrainersManager from './pages/admin/TrainersManager';
import OffersManager from './pages/admin/OffersManager';
import GalleryManager from './pages/admin/GalleryManager';
import CMSManager from './pages/admin/CMSManager';
import { EnquiriesManager, ClassBookingsManager, PTSessionsManager, FeedbackManager, DocumentsManager } from './pages/admin/FormManagers';

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
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/packages" element={<Packages />} />
                  <Route path="/trainers" element={<Trainers />} />
                  <Route path="/media" element={<Media />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/portal" element={<Portal />} />
                  <Route path="/dashboard" element={<Navigate to="/settings" replace />} />
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

                  {/* Contact Routes */}
                  <Route path="/contact/info" element={<ContactInfo />} />

                  {/* Package Routes */}
                  <Route path="/packages/plans" element={<MembershipPlans />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="enquiries" element={<EnquiriesManager />} />
                      <Route path="classes" element={<ClassBookingsManager />} />
                      <Route path="pt-sessions" element={<PTSessionsManager />} />
                      <Route path="packages" element={<PackagesManager />} />
                      <Route path="trainers" element={<TrainersManager />} />
                      <Route path="offers" element={<OffersManager />} />
                      <Route path="gallery" element={<GalleryManager />} />
                      <Route path="feedback" element={<FeedbackManager />} />
                      <Route path="documents" element={<DocumentsManager />} />
                      <Route path="cms" element={<CMSManager />} />
                    </Route>
                  </Route>

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
