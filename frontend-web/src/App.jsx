import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import Reports from './pages/Reports.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import CompanyProfile from './pages/CompanyProfile.jsx';
import CustomerProfile from './pages/CustomerProfile.jsx';
import AcceptInvitation from './pages/AcceptInvitation.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import CustomerOrdersPage from './pages/CustomerOrdersPage.jsx';
import EmailInbox from './pages/EmailInbox.jsx';
import EmailTemplates from './pages/EmailTemplates.jsx';
import './App.css';

const GOOGLE_CLIENT_ID = '324860582148-cbt87g1gg0qmf913n8uv46vjlq1hqqiq.apps.googleusercontent.com';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
            <Route 
              path="/company-dashboard" 
              element={
                <ProtectedRoute requiredAccountType="company">
                  <CompanyDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute requiredAccountType="company">
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute requiredAccountType="company">
                  <CustomersPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute requiredAccountType="company">
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email-inbox"
              element={
                <ProtectedRoute requiredAccountType="company">
                  <EmailInbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email-templates"
              element={
                <ProtectedRoute requiredAccountType="company">
                  <EmailTemplates />
                </ProtectedRoute>
              }
            />
              <Route 
                path="/company-profile" 
                element={
                  <ProtectedRoute requiredAccountType="company">
                    <CompanyProfile />
                  </ProtectedRoute>
                }
              />
            <Route 
              path="/customer-dashboard" 
              element={
                <ProtectedRoute requiredAccountType="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-profile" 
              element={
                <ProtectedRoute requiredAccountType="customer">
                  <CustomerProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-orders" 
              element={
                <ProtectedRoute requiredAccountType="customer">
                  <CustomerOrdersPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
