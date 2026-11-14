import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Today from './pages/Today.jsx';
import DailyLog from './pages/DailyLog.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import StudentPicker from './pages/StudentPicker.jsx';
import MonthlyPlan from './pages/MonthlyPlan.jsx';
import Reports from './pages/Reports.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="log" element={<StudentPicker mode="log" />} />
        <Route path="students" element={<StudentPicker mode="profile" />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="students/:id/log/:date" element={<DailyLog />} />
        <Route path="plan" element={<MonthlyPlan />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Today />} />
      </Route>
    </Routes>
  );
}
