import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Dashboard Sidebar Navigation
 * Role-filtered collapsible sidebar with grouped navigation links.
 * Replaces AdminSidebar with unified role-based nav for all staff.
 */
class DashboardSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedGroups: {},
    };
  }

  /**
   * Check if the user has any of the specified roles.
   * super_admin inherits all admin access.
   */
  userHasAnyRole = (roles) => {
    const { user } = this.props;
    if (!user) return false;
    return roles.some((role) => {
      if (user.hasRole) return user.hasRole(role);
      if (user.roles) return user.roles.includes(role);
      return user.role === role;
    });
  };

  getNavGroups = () => {
    const groups = [
      {
        label: 'Overview',
        roles: null, // all staff
        items: [
          {
            path: '/dashboard',
            label: 'Dashboard Home',
            exact: true,
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            ),
          },
          {
            path: '/dashboard/calendar',
            label: 'Calendar',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
        ],
      },
      {
        label: 'People',
        roles: ['admin', 'super_admin', 'owner', 'manager'],
        items: [
          {
            path: '/dashboard/staff',
            label: 'Staff Management',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
          {
            path: '/dashboard/players',
            label: 'Players Management',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ),
          },
        ],
      },
      {
        label: 'Coaching',
        roles: ['coach', 'owner', 'manager', 'admin', 'super_admin'],
        items: [
          {
            path: '/dashboard/training',
            label: 'Training',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
          },
          {
            path: '/dashboard/matches',
            label: 'Matches',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            path: '/dashboard/formation',
            label: 'Formation Builder',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            ),
          },
          {
            path: '/dashboard/squad',
            label: 'Squad Selection',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            ),
          },
          {
            path: '/dashboard/match-evaluation',
            label: 'Match Evaluation',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          },
          {
            path: '/dashboard/attendance',
            label: 'Player Attendance',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            path: '/dashboard/player-notes',
            label: 'Player Notes',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
          },
          {
            path: '/dashboard/squad-presets',
            label: 'Squad Presets',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            ),
          },
        ],
      },
      {
        label: 'Marketing & Content',
        roles: ['editor', 'marketing', 'admin', 'super_admin'],
        items: [
          {
            path: '/dashboard/content',
            label: 'Content Management',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
              </svg>
            ),
          },
          {
            path: '/dashboard/content?tab=news',
            label: 'News Articles',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
              </svg>
            ),
          },
          {
            path: '/dashboard/events',
            label: 'Events',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
        ],
      },
      {
        label: 'Finance',
        roles: ['admin', 'super_admin', 'owner'],
        items: [
          {
            path: '/dashboard/payments',
            label: 'Payments',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            path: '/dashboard/investors',
            label: 'Investors Management',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ),
          },
        ],
      },
      {
        label: 'System',
        roles: ['admin', 'super_admin'],
        items: [
          {
            path: '/dashboard/analytics',
            label: 'Analytics',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          },
          {
            path: '/dashboard/activity-log',
            label: 'Activity Log',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ],
      },
    ];

    // Super admin only: User Management (added to System group)
    const isSuperAdmin = this.userHasAnyRole(['super_admin']);
    if (isSuperAdmin) {
      const systemGroup = groups.find((g) => g.label === 'System');
      if (systemGroup) {
        systemGroup.items.push({
          path: '/dashboard/users',
          label: 'User Management',
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        });
      }
    }

    // Public Site group — all staff
    groups.push({
      label: 'Public Site',
      roles: null, // all staff
      external: true,
      items: [
        {
          path: '/fan-portal',
          label: 'Fan Portal',
          external: true,
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ),
        },
        {
          path: '/our-team',
          label: 'Our Team',
          external: true,
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          path: '/stats',
          label: 'Stats',
          external: true,
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          path: '/shop',
          label: 'Shop',
          external: true,
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          ),
        },
        {
          path: '/investors',
          label: 'Investors',
          external: true,
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ),
        },
      ],
    });

    return groups;
  };

  getFilteredGroups = () => {
    const groups = this.getNavGroups();
    return groups.filter((group) => {
      // null roles means all staff can see it
      if (!group.roles) return true;
      return this.userHasAnyRole(group.roles);
    });
  };

  isGroupActive = (group) => {
    const currentPath = window.location.pathname;
    return group.items.some(item => {
      if (item.exact) return currentPath === item.path;
      return currentPath.startsWith(item.path);
    });
  };

  toggleGroup = (label) => {
    this.setState(prev => ({
      expandedGroups: {
        ...prev.expandedGroups,
        [label]: !prev.expandedGroups[label],
      },
    }));
  };

  isGroupExpanded = (group) => {
    // Overview is always expanded
    if (group.label === 'Overview') return true;
    // If user has explicitly toggled, use that
    if (this.state.expandedGroups[group.label] !== undefined) {
      return this.state.expandedGroups[group.label];
    }
    // Auto-expand if group contains active route
    return this.isGroupActive(group);
  };

  handleNavClick = () => {
    const { onMobileClose } = this.props;
    if (onMobileClose) {
      onMobileClose();
    }
  };

  renderNavItem = (item) => {
    const { collapsed, mobileOpen } = this.props;
    const isExpanded = !collapsed || mobileOpen;

    if (item.external) {
      return (
        <li key={item.path}>
          <a
            href={item.path}
            onClick={this.handleNavClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-white/70 hover:bg-white/10 hover:text-white relative"
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium text-sm"
              >
                {item.label}
              </motion.span>
            )}
            {!isExpanded && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-surface-dark-elevated rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 z-[60]">
                {item.label}
              </div>
            )}
            {isExpanded && (
              <svg className="w-4 h-4 ml-auto text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </a>
        </li>
      );
    }

    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          end={item.exact}
          onClick={this.handleNavClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
              isActive
                ? 'bg-accent-gold/20 text-accent-gold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex-shrink-0 ${isActive ? 'text-accent-gold' : ''}`}>
                {item.icon}
              </span>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium text-sm"
                >
                  {item.label}
                </motion.span>
              )}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface-dark-elevated rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 z-[60]">
                  {item.label}
                </div>
              )}
            </>
          )}
        </NavLink>
      </li>
    );
  };

  renderSidebarContent = () => {
    const { collapsed, onToggle, mobileOpen } = this.props;
    const isExpanded = !collapsed || mobileOpen;
    const filteredGroups = this.getFilteredGroups();

    return (
      <>
        {/* Logo Section */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src={`${import.meta.env.BASE_URL}kaboona-logo.png`}
                alt="Kaboona FC"
                className="w-full h-full object-contain"
              />
            </div>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-white font-display font-bold text-lg">Kaboona FC</h2>
                <p className="text-white/50 text-xs">Dashboard</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {filteredGroups.map((group) => {
            const isOverview = group.label === 'Overview';
            const groupExpanded = this.isGroupExpanded(group);

            return (
              <div key={group.label} className="mb-4">
                {/* Group Label */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-6 mb-2"
                  >
                    {isOverview ? (
                      <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">
                        {group.label}
                      </span>
                    ) : (
                      <button
                        onClick={() => this.toggleGroup(group.label)}
                        className="flex items-center justify-between w-full text-white/40 hover:text-white/60 transition-colors"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {group.label}
                        </span>
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${groupExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </motion.div>
                )}
                {!isExpanded && (
                  <div className="px-3 mb-2">
                    <div className="border-t border-white/10" />
                  </div>
                )}
                {/* Items - always show when collapsed (icon-only) or when group is expanded */}
                {(!isExpanded || isOverview || groupExpanded) && (
                  <ul className="space-y-0.5 px-3">
                    {group.items.map((item) => this.renderNavItem(item))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/10">
          {/* Back to Site Link */}
          <a
            href="/"
            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 ${
              !isExpanded ? 'justify-center' : ''
            }`}
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium"
              >
                Back to Site
              </motion.span>
            )}
          </a>

          {/* Collapse Toggle (hidden on mobile overlay) */}
          {!mobileOpen && (
            <button
              onClick={onToggle}
              className={`mt-2 w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <svg
                className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
                  collapsed ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium"
                >
                  Collapse
                </motion.span>
              )}
            </button>
          )}
        </div>
      </>
    );
  };

  render() {
    const { collapsed, mobileOpen, onMobileClose } = this.props;

    return (
      <>
        {/* Desktop Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 80 : 256 }}
          transition={{ duration: 0.3 }}
          className="fixed left-0 top-16 md:top-20 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-surface-dark-elevated border-r border-white/10 z-40 flex-col hidden md:flex"
        >
          {this.renderSidebarContent()}
        </motion.aside>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onMobileClose}
                className="fixed inset-0 bg-black/60 z-[55] md:hidden"
              />
              {/* Mobile Sidebar */}
              <motion.aside
                initial={{ x: -256 }}
                animate={{ x: 0 }}
                exit={{ x: -256 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-surface-dark-elevated border-r border-white/10 z-[60] flex flex-col md:hidden"
              >
                {this.renderSidebarContent()}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }
}

export default DashboardSidebar;
