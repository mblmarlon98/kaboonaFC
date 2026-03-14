import React, { Component } from 'react';
import { supabase } from '../../services/supabase';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import GlorySection from './components/GlorySection';
import TrainingGroundSection from './components/TrainingGroundSection';
import TeamPreviewSection from './components/TeamPreviewSection';
import CTASection from './components/CTASection';
import SponsorsSection from './components/SponsorsSection';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      siteContent: {},
    };
  }

  async componentDidMount() {
    this.setState({ isLoaded: true });
    window.scrollTo(0, 0);

    try {
      const { data } = await supabase.from('site_content').select('key, value');
      if (data) {
        const siteContent = {};
        data.forEach((row) => { siteContent[row.key] = row.value || {}; });
        this.setState({ siteContent });
      }
    } catch (err) {
      console.error('Error fetching site content:', err);
    }
  }

  render() {
    const { siteContent } = this.state;

    return (
      <div className="bg-surface-dark min-h-screen">
        <HeroSection content={siteContent.hero} />
        <AboutSection content={siteContent.about} />
        <GlorySection content={siteContent.glory} />
        <TrainingGroundSection content={siteContent.training} />
        <TeamPreviewSection content={siteContent.team_preview} />
        <CTASection content={siteContent.cta} />
        <SponsorsSection />
      </div>
    );
  }
}

export default Home;
