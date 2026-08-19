import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { ProjectsPage } from '../pages/Projects/ProjectsPage';
import { ProjectDetailsPage } from '../pages/ProjectDetails/ProjectDetailsPage';
import { ActivityPage } from '../pages/Activity/ActivityPage';
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage';
import { SchedulesPage } from '../pages/Schedules/SchedulesPage';
import { QueuePage } from '../pages/Queue/QueuePage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { AdminDashboard } from '../pages/Admin/AdminDashboard';
import { Login } from '../pages/Auth/Login';
import { Register } from '../pages/Auth/Register';
import { ForgotPassword } from '../pages/Auth/ForgotPassword';

export function AppRoutes({ onOpenAddModal, onOpenScanModal, onCommitPreview, onOpenDiff }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardPage
            onOpenAddModal={onOpenAddModal}
            onOpenScanModal={onOpenScanModal}
            onCommitPreview={onCommitPreview}
            onOpenDiff={onOpenDiff}
          />
        }
      />
      <Route
        path="/projects"
        element={
          <ProjectsPage
            onOpenAddModal={onOpenAddModal}
            onOpenScanModal={onOpenScanModal}
            onCommitPreview={onCommitPreview}
            onOpenDiff={onOpenDiff}
          />
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProjectDetailsPage
            onCommitPreview={onCommitPreview}
            onOpenDiff={onOpenDiff}
          />
        }
      />
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/schedules" element={<SchedulesPage />} />
      <Route path="/queue" element={<QueuePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route
        path="/auth/login"
        element={
          <div style={{ maxWidth: '440px', margin: '40px auto', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
            <Login />
          </div>
        }
      />
      <Route
        path="/auth/register"
        element={
          <div style={{ maxWidth: '440px', margin: '40px auto', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
            <Register />
          </div>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <div style={{ maxWidth: '440px', margin: '40px auto', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
            <ForgotPassword />
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
