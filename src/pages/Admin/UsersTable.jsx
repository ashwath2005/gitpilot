import React, { useState } from 'react';
import { Search, Filter, Shield, MoreHorizontal, CheckCircle, ShieldAlert, Eye, Crown } from 'lucide-react';

export function UsersTable({ users, onSelectUser, search, setSearch, filterStatus, setFilterStatus, filterPlan, setFilterPlan, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-text"
            style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px' }}
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
          {['all', 'active', 'suspended'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="btn-ghost"
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: '4px',
                textTransform: 'capitalize',
                background: filterStatus === s ? 'var(--primary-subtle)' : 'transparent',
                color: filterStatus === s ? 'var(--primary-bright)' : 'var(--text-secondary)',
                fontWeight: filterStatus === s ? 600 : 400,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Plan Filter */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
          {['all', 'free', 'pro', 'lifetime'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPlan(p)}
              className="btn-ghost"
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: '4px',
                textTransform: 'capitalize',
                background: filterPlan === p ? 'var(--primary-subtle)' : 'transparent',
                color: filterPlan === p ? 'var(--primary-bright)' : 'var(--text-secondary)',
                fontWeight: filterPlan === p ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 14px' }}>User</th>
              <th style={{ padding: '10px 14px' }}>Plan</th>
              <th style={{ padding: '10px 14px' }}>Status</th>
              <th style={{ padding: '10px 14px' }}>Role</th>
              <th style={{ padding: '10px 14px' }}>Last Active</th>
              <th style={{ padding: '10px 14px' }}>Joined</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found matching the filter criteria.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSuspended = u.status === 'suspended';
                const isPro = u.plan === 'pro' || u.plan === 'lifetime';
                const isAdmin = u.role === 'admin';

                return (
                  <tr
                    key={u.id}
                    onClick={() => onSelectUser(u)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isPro ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-base)',
                            color: isPro ? 'var(--primary-bright)' : 'var(--text-secondary)',
                            border: `1px solid ${isPro ? 'var(--primary-bright)' : 'var(--border-default)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10.5px',
                            fontWeight: 700,
                          }}
                        >
                          {(u.display_name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.display_name || 'Developer'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          background: isPro ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-base)',
                          color: isPro ? 'var(--primary-bright)' : 'var(--text-muted)',
                          border: `1px solid ${isPro ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`,
                        }}
                      >
                        {u.plan || 'free'}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isSuspended ? 'var(--danger)' : 'var(--success)',
                          }}
                        />
                        <span style={{ fontSize: '11.5px', color: isSuspended ? 'var(--danger)' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {u.status || 'active'}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      {isAdmin ? (
                        <span style={{ fontSize: '11px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <Crown size={12} /> Admin
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>User</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 14px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Never'}
                    </td>

                    <td style={{ padding: '10px 14px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>

                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(u);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        <Eye size={12} style={{ marginRight: '4px' }} />
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
