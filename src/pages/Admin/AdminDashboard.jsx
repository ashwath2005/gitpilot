import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Sparkles,
  RefreshCw,
  Crown,
  Shield,
  Laptop,
  AlertCircle,
} from 'lucide-react';
import { userService } from '../../services/cloud';
import { useAuthStore } from '../../store/authStore';
import { UsersTable } from './UsersTable';
import { UserDetailsModal } from './UserDetailsModal';

export function AdminDashboard() {
  const { isAdmin, isCloudConfigured } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, newUsers: 0, pro: 0, free: 0, lifetime: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, statsRes] = await Promise.all([
      userService.getAllUsers({ search, status: filterStatus, plan: filterPlan }),
      userService.getAdminStats(),
    ]);

    if (usersRes.success) {
      setUsers(usersRes.users);
    }
    setStats(statsRes);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [search, filterStatus, filterPlan]);

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', textAlign: 'center', padding: '32px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Shield size={24} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Admin Authorization Required</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
          Only GitPilot owners and administrators with the <code className="font-mono">admin</code> role in Supabase can access this panel.
        </p>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          To designate an admin, execute the role update query in your Supabase SQL Editor.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>GitPilot Admin Console</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Manage cloud users, subscriptions, accounts, and connected devices
            </p>
          </div>
        </div>

        <button onClick={fetchData} disabled={loading} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>TOTAL USERS</span>
            <Users size={16} style={{ color: 'var(--primary-bright)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>+{stats.newUsers} in last 30d</div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>ACTIVE USERS</span>
            <UserCheck size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>{stats.active}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 100}% of total
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>SUSPENDED</span>
            <UserX size={16} style={{ color: 'var(--danger)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--danger)' }}>{stats.suspended}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Blocked from cloud</div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>PRO / LIFETIME</span>
            <Sparkles size={16} style={{ color: '#F59E0B' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F59E0B' }}>{stats.pro + stats.lifetime}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.pro} Pro • {stats.lifetime} Lifetime
          </div>
        </div>
      </div>

      {/* Users Table */}
      <UsersTable
        users={users}
        onSelectUser={(u) => setSelectedUser(u)}
        search={search}
        setSearch={setSearch}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPlan={filterPlan}
        setFilterPlan={setFilterPlan}
        loading={loading}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        onUserUpdated={fetchData}
      />
    </div>
  );
}
