import React, { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import Navbar from '../../components/Layout/Navbar';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { getCurrentUser } from '../../services/auth';
import { setUser } from '../../redux/slices/authSlice';

// Real components
import DashboardHome from './DashboardHome';
import DashboardOverview from './components/DashboardOverview';
import TrainingScheduler from './components/TrainingScheduler';
import MatchScheduler from './components/MatchScheduler';
import FormationBuilder from './components/FormationBuilder';
import SquadSelection from './components/SquadSelection';
import MatchEvaluation from './components/MatchEvaluation';
import ContentManagement from './components/ContentManagement';
import PaymentsOverview from './components/PaymentsOverview';
import InvestorsManagement from './components/InvestorsManagement';
import PlayersManagement from './components/PlayersManagement';
import StaffPlayerManagement from './components/StaffPlayerManagement';
import UserAnalytics from './components/UserAnalytics';
import UserManagement from './components/UserManagement';
import SuperAdminOverview from './components/SuperAdminOverview';
import Calendar from './components/Calendar';
import EventsManagement from './components/EventsManagement';
import PlayerAttendance from './components/PlayerAttendance';
import PlayerNotes from './components/PlayerNotes';
import ActivityLog from './components/ActivityLog';
import SquadPresets from './components/SquadPresets';
import MatchDetail from './components/MatchDetail';

/**
 * Placeholder page component for routes not yet wired to real components.
 */
class PlaceholderPage extends Component {
  render() {
    const { title } = this.props;
    return (
      <div className="p-6">
        <h2 className="text-2xl font-display text-white">{title}</h2>
        <p className="text-white/60 mt-2">Coming soon...</p>
      </div>
    );
  }
}

/**
 * Dashboard Shell
 * Main layout for the unified dashboard with sidebar, header, and nested routes.
 * Replaces separate /admin, /coaching-zone, /content-zone, /marketing-zone pages.
 */
class Dashboard extends Component {
  constructor(props) {
    super(props);
    const savedCollapsed = localStorage.getItem('dashboardSidebarCollapsed');
    this.state = {
      sidebarCollapsed: savedCollapsed === 'true',
      mobileOpen: false,
    };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);

    // Refresh user data from database to get latest roles
    try {
      const { user } = await getCurrentUser();
      if (user) {
        this.props.setUser(user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  toggleSidebar = () => {
    // On mobile, toggle mobile overlay instead
    if (window.innerWidth < 768) {
      this.setState((prevState) => ({ mobileOpen: !prevState.mobileOpen }));
    } else {
      this.setState(
        (prevState) => ({ sidebarCollapsed: !prevState.sidebarCollapsed }),
        () => {
          localStorage.setItem('dashboardSidebarCollapsed', this.state.sidebarCollapsed);
        }
      );
    }
  };

  closeMobileSidebar = () => {
    this.setState({ mobileOpen: false });
  };

  /**
   * Check if user has any staff role that grants dashboard access.
   */
  isStaff = () => {
    const { user } = this.props;
    if (!user) return false;

    const staffRoles = ['admin', 'super_admin', 'coach', 'owner', 'manager', 'editor', 'marketing'];
    return staffRoles.some((role) => {
      if (user.hasRole) return user.hasRole(role);
      if (user.roles) return user.roles.includes(role);
      return user.role === role;
    });
  };

  isSuperAdmin = () => {
    const { user } = this.props;
    if (!user) return false;
    if (user.hasRole) return user.hasRole('super_admin');
    if (user.roles) return user.roles.includes('super_admin');
    return user.role === 'super_admin';
  };

  renderLoadingState = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4">
          <svg
            className="animate-spin w-full h-full text-accent-gold"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p className="text-white/60">Loading dashboard...</p>
      </motion.div>
    </div>
  );

  renderAccessDenied = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-4"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-4">
          Access Denied
        </h1>
        <p className="text-white/60 mb-8">
          You do not have permission to access the dashboard.
          Only staff members can view this page.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Home
        </a>
      </motion.div>
    </div>
  );

  render() {
    const { user, loading } = this.props;
    const { sidebarCollapsed, mobileOpen } = this.state;

    // Show loading state
    if (loading) {
      return this.renderLoadingState();
    }

    // Redirect if not logged in
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Check staff access
    if (!this.isStaff()) {
      return this.renderAccessDenied();
    }

    const superAdmin = this.isSuperAdmin();

    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Top Navbar */}
        <Navbar />

        <div className="flex pt-16 md:pt-20">
          {/* Sidebar */}
          <DashboardSidebar
            user={user}
            collapsed={sidebarCollapsed}
            onToggle={this.toggleSidebar}
            mobileOpen={mobileOpen}
            onMobileClose={this.closeMobileSidebar}
          />

          {/* Main Content Area */}
          <div
            className={`flex-1 transition-all duration-300 ${
              sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
            } ml-0`}
          >
            {/* Header */}
            <DashboardHeader
              user={user}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={this.toggleSidebar}
            />

            {/* Page Content */}
            <main className="p-4 md:p-6">
              <Routes>
                {/* Overview */}
                <Route index element={<DashboardHome />} />
                <Route path="calendar" element={<Calendar userRoles={user?.roles} user={user} />} />

                {/* Coaching */}
                <Route path="training" element={<TrainingScheduler />} />
                <Route path="matches" element={<MatchScheduler />} />
                <Route path="formation" element={<FormationBuilder />} />
                <Route path="squad" element={<SquadSelection />} />
                <Route path="match-evaluation" element={<MatchEvaluation />} />
                <Route path="attendance" element={<PlayerAttendance />} />
                <Route path="player-notes" element={<PlayerNotes />} />
                <Route path="squad-presets" element={<SquadPresets />} />
                <Route path="match/:matchId" element={<MatchDetail />} />

                {/* Marketing & Content */}
                <Route path="content" element={<ContentManagement user={user} />} />
                <Route path="events" element={<EventsManagement />} />

                {/* Finance */}
                <Route path="payments" element={<PaymentsOverview />} />
                <Route path="investors" element={<InvestorsManagement />} />

                {/* System */}
                <Route path="players" element={<PlayersManagement />} />
                <Route path="staff" element={<StaffPlayerManagement user={user} isSuperAdmin={superAdmin} />} />
                <Route path="analytics" element={<UserAnalytics />} />
                <Route path="activity-log" element={<ActivityLog />} />

                {/* Super Admin Only */}
                {superAdmin && (
                  <Route path="users" element={<UserManagement />} />
                )}
                {superAdmin && (
                  <Route path="super" element={<SuperAdminOverview />} />
                )}

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  loading: state.auth?.loading,
});

const mapDispatchToProps = {
  setUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
