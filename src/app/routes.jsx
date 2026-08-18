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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
