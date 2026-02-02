import React, { Component } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

class Layout extends Component {
  render() {
    const { children, darkMode, toggleDarkMode, user } = this.props;

    return (
      <div className="flex flex-col min-h-screen bg-surface-dark dark:bg-surface-dark">
        <Navbar
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          user={user}
        />
        <main className="flex-1 pt-16 md:pt-20">
          {children}
        </main>
        <Footer />
      </div>
    );
  }
}

export default Layout;
