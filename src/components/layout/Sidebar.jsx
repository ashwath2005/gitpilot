import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Activity,
  BarChart3,
  Clock,
  ListOrdered,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { APP_VERSION } from '../../config/version';

import { GitPilotLogo } from '../common/GitPilotLogo';

export function Sidebar({ collapsed, onToggleCollapse, gitStatus }) {
  const { isAdmin } = useAuthStore();
  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard, shortcut: '⌘1' },
    { label: 'Projects', to: '/projects', icon: FolderGit2, shortcut: '⌘2' },
    { label: 'Activity', to: '/activity', icon: Activity, shortcut: '⌘3' },
    { label: 'Analytics', to: '/analytics', icon: BarChart3, shortcut: '⌘4' },
  ];

  const automationItems = [
    { label: 'Schedules', to: '/schedules', icon: Clock },
    { label: 'Push Queue', to: '/queue', icon: ListOrdered },
  ];

  const systemItems = [
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <GitPilotLogo size={24} />
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '-0.02em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                GitPilot
                <span style={{ fontSize: '9.5px', background: 'var(--primary-subtle)', color: 'var(--primary-bright)', padding: '1px 5px', borderRadius: '4px' }}>v{APP_VERSION}</span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="btn-ghost"
          style={{ padding: '4px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav List */}
      <div style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Main Section */}
        <div>
          {!collapsed && <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 8px 6px 8px', letterSpacing: '0.05em' }}>WORKSPACE</div>}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                    border: isActive ? '1px solid var(--border-focus)' : '1px solid transparent',
                    textDecoration: 'none',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 500 : 400,
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <Icon size={16} style={{ color: 'var(--text-primary)' }} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.shortcut && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.shortcut}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Automation Section */}
        <div>
          {!collapsed && <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 8px 6px 8px', letterSpacing: '0.05em' }}>AUTOMATION</div>}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {automationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                    border: isActive ? '1px solid var(--border-focus)' : '1px solid transparent',
                    textDecoration: 'none',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 500 : 400,
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <Icon size={16} style={{ color: 'var(--text-primary)' }} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* System Section */}
        <div>
          {!collapsed && <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 8px 6px 8px', letterSpacing: '0.05em' }}>SYSTEM</div>}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {systemItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                    border: isActive ? '1px solid var(--border-focus)' : '1px solid transparent',
                    textDecoration: 'none',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 500 : 400,
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <Icon size={16} style={{ color: 'var(--text-primary)' }} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Administration Section (Owner / Admin Only) */}
        {isAdmin && (
          <div>
            {!collapsed && <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 600, padding: '0 8px 6px 8px', letterSpacing: '0.05em' }}>ADMINISTRATION</div>}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <NavLink
                to="/admin"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? '#FFFFFF' : '#F59E0B',
                  backgroundColor: isActive ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 600 : 500,
                })}
                title={collapsed ? 'Admin Console' : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Crown size={16} style={{ color: '#F59E0B' }} />
                  {!collapsed && <span>Admin Console</span>}
                </div>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Footer Git Status Indicator */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: gitStatus?.valid ? 'var(--success)' : 'var(--danger)' }} />
          {!collapsed && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Git {gitStatus?.version || 'Ready'}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
