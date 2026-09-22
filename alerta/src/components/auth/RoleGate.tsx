import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';
import { ManagerLayout } from '@/components/layout/ManagerLayout';

import { EmployeeHomePage } from '@/pages/employee/EmployeeHomePage';
import { MyIncidentsPage } from '@/pages/employee/MyIncidentsPage';
import { ReportIncidentPage } from '@/pages/employee/ReportIncidentPage';
import { EmployeeProfilePage } from '@/pages/employee/EmployeeProfilePage';

import { ManagerDashboardPage } from '@/pages/manager/ManagerDashboardPage';
import { RosterPage } from '@/pages/manager/RosterPage';
import { IncidentsPage } from '@/pages/manager/IncidentsPage';
import { IncidentDetailPage } from '@/pages/manager/IncidentDetailPage';
import { EmployeesPage } from '@/pages/manager/EmployeesPage';
import { StatsPage } from '@/pages/manager/StatsPage';
import { SettingsPage } from '@/pages/manager/SettingsPage';

/**
 * Renders the correct app shell + route tree based on the signed-in
 * user's role. Employee and manager paths overlap (e.g. both have "/"
 * and "/incidents") but mean different things, so routing by role
 * happens here in ONE place rather than duplicating <Route path> entries
 * at the top level, which React Router cannot disambiguate.
 */
export function RoleGate() {
  const { profile } = useAuth();

  if (profile?.role === 'manager') {
    return (
      <ManagerLayout>
        <Routes>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="roster" element={<RosterPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ManagerLayout>
    );
  }

  return (
    <EmployeeLayout>
      <Routes>
        <Route index element={<EmployeeHomePage />} />
        <Route path="incidents" element={<MyIncidentsPage />} />
        <Route path="incidents/new" element={<ReportIncidentPage />} />
        <Route path="profile" element={<EmployeeProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </EmployeeLayout>
  );
}
