import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RoleGate } from '@/components/auth/RoleGate';

import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupBusinessPage } from '@/pages/auth/SignupBusinessPage';
import { JoinInvitePage } from '@/pages/auth/JoinInvitePage';

import { SosConfirmPage } from '@/pages/employee/SosConfirmPage';
import { SosStatusPage } from '@/pages/employee/SosStatusPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupBusinessPage />} />
          <Route path="/join/:code" element={<JoinInvitePage />} />

          {/* Authenticated */}
          <Route element={<RequireAuth />}>
            {/* SOS confirm/status use a dedicated full-screen layout without app chrome */}
            <Route path="/sos" element={<SosConfirmPage />} />
            <Route path="/sos/status" element={<SosStatusPage />} />

            {/* Everything else is routed by role inside RoleGate itself */}
            <Route path="/*" element={<RoleGate />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
