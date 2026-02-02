import React, { Component } from 'react';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import GlorySection from './components/GlorySection';
import TrainingGroundSection from './components/TrainingGroundSection';
import TeamPreviewSection from './components/TeamPreviewSection';
import CTASection from './components/CTASection';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
    };
  }

  componentDidMount() {
    // Trigger loaded state after mount for animations
    this.setState({ isLoaded: true });

    // Scroll to top on mount
    window.scrollTo(0, 0);
  }

  render() {
    return (
      <div className="bg-surface-dark min-h-screen">
        {/* Hero Section - Full viewport banner */}
        <HeroSection />

        {/* About Section - Club introduction */}
        <AboutSection />

        {/* Glory Section - Stats, tables, achievements */}
        <GlorySection />

        {/* Training Ground Section - Location and facilities */}
        <TrainingGroundSection />

        {/* Team Preview Section - Coaches preview */}
        <TeamPreviewSection />

        {/* CTA Section - Join Training + Become a Fan */}
        <CTASection />
      </div>
    );
  }
}

export default Home;
