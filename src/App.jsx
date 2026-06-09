import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute, { RoleRedirect } from './components/ProtectedRoute';
import Login from './pages/Login';
import SelectRole from './pages/SelectRole';
import DashboardHome from './pages/DashboardHome';
import Scorecard from './pages/Scorecard';
import SchoolDispersal from './pages/SchoolDispersal';
import DataEntry from './pages/DataEntry';
import Reports from './pages/Reports';
import FirebaseSetupNeeded from './pages/FirebaseSetupNeeded';
import { isFirebaseConfigured } from './firebase';

function App() {
  if (!isFirebaseConfigured) {
    return <FirebaseSetupNeeded />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/select-role" element={<SelectRole />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/redirect" element={<RoleRedirect />} />
            <Route path="/map" element={<DashboardHome />} />
            <Route path="/scorecard" element={<Scorecard />} />
            <Route path="/schools" element={<SchoolDispersal />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route path="/" element={<Navigate to="/redirect" replace />} />
          <Route path="*" element={<Navigate to="/redirect" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
