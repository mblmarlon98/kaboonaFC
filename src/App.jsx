import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';

// Placeholder pages - will be implemented later
const OurTeam = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Our Team</h1></div>;
const Stats = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Stats</h1></div>;
const Shop = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Shop</h1></div>;
const FanPortal = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Fan Portal</h1></div>;
const Investors = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Investors</h1></div>;
const Login = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Login</h1></div>;
const Register = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Register</h1></div>;
const TrainingSignup = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Training Signup</h1></div>;
const Profile = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Profile</h1></div>;
const Admin = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Admin Dashboard</h1></div>;
const NotFound = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">404 - Not Found</h1></div>;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      darkMode: true, // Default to dark mode (Netflix style)
    };
  }

  componentDidMount() {
    // Check for saved preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      this.setState({ darkMode: savedMode === 'true' });
    }
    // Apply dark mode class
    this.applyDarkMode(savedMode === 'true' || savedMode === null);
  }

  applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  toggleDarkMode = () => {
    this.setState(
      (prevState) => ({ darkMode: !prevState.darkMode }),
      () => {
        localStorage.setItem('darkMode', this.state.darkMode);
        this.applyDarkMode(this.state.darkMode);
      }
    );
  };

  render() {
    const { darkMode } = this.state;

    return (
      <Layout
        darkMode={darkMode}
        toggleDarkMode={this.toggleDarkMode}
        user={null} // Will be connected to auth state later
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/our-team" element={<OurTeam />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/fan-portal" element={<FanPortal />} />
          <Route path="/investors" element={<Investors />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/training-signup" element={<TrainingSignup />} />

          {/* Protected Routes */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<Profile />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/*" element={<Admin />} />

          {/* Legal Routes */}
          <Route path="/terms" element={<div className="min-h-screen p-8"><h1 className="text-2xl font-display">Terms & Conditions</h1></div>} />
          <Route path="/privacy" element={<div className="min-h-screen p-8"><h1 className="text-2xl font-display">Privacy Policy</h1></div>} />
          <Route path="/refund" element={<div className="min-h-screen p-8"><h1 className="text-2xl font-display">Refund Policy</h1></div>} />
          <Route path="/cookies" element={<div className="min-h-screen p-8"><h1 className="text-2xl font-display">Cookie Policy</h1></div>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    );
  }
}

export default App;
