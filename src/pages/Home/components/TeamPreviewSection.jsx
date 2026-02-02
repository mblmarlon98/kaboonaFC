import React, { Component, createRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import supabase from '../../../services/supabase';

gsap.registerPlugin(ScrollTrigger);

// Skeleton Loader for Coach Cards
const CoachCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-[3/4] bg-white/10 rounded-2xl mb-4" />
    <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
    <div className="h-4 bg-white/10 rounded w-1/2" />
  </div>
);

class TeamPreviewSection extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.cardsRef = createRef();
    this.state = {
      coaches: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchCoaches();
  }

  componentWillUnmount() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  initScrollAnimation = () => {
    if (this.cardsRef.current) {
      gsap.fromTo(
        this.cardsRef.current.children,
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: this.sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  };

  fetchCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .order('display_order', { ascending: true })
        .limit(3);

      if (error && error.code !== 'PGRST116') {
        console.warn('Coaches data not available:', error);
      }

      // Mock data if Supabase is not configured
      const mockCoaches = [
        {
          id: 1,
          name: 'Coach Ahmad',
          role: 'Head Coach',
          bio: 'Former professional player with 15 years of coaching experience. Leading Kaboona FC to new heights.',
          image_url: null,
          achievements: ['UEFA B License', '3x League Champion'],
        },
        {
          id: 2,
          name: 'Coach David',
          role: 'Assistant Coach',
          bio: 'Specializes in tactical analysis and player development. Expert in modern football methodologies.',
          image_url: null,
          achievements: ['AFC C License', 'Youth Academy Director'],
        },
        {
          id: 3,
          name: 'Coach Sarah',
          role: 'Fitness Coach',
          bio: 'Sports science graduate ensuring our players are in peak physical condition throughout the season.',
          image_url: null,
          achievements: ['CSCS Certified', 'Performance Specialist'],
        },
      ];

      this.setState(
        {
          coaches: data || mockCoaches,
          loading: false,
        },
        () => {
          this.initScrollAnimation();
        }
      );
    } catch (error) {
      console.error('Error fetching coaches:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  renderCoachCard = (coach, index) => {
    const roleColors = {
      'Head Coach': 'text-accent-gold',
      'Assistant Coach': 'text-secondary-blue',
      'Fitness Coach': 'text-green-400',
    };

    return (
      <div
        key={coach.id || index}
        className="group relative"
      >
        <div className="relative overflow-hidden rounded-2xl bg-surface-dark-elevated border border-white/5 hover:border-accent-gold/30 transition-all duration-500">
          {/* Image Container */}
          <div className="aspect-[3/4] relative overflow-hidden">
            {coach.image_url ? (
              <img
                src={coach.image_url}
                alt={coach.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              // Placeholder Avatar
              <div className="w-full h-full bg-gradient-to-br from-surface-dark-hover to-surface-dark flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className={`text-sm font-semibold uppercase tracking-wider ${roleColors[coach.role] || 'text-white/60'} mb-2`}>
                {coach.role}
              </p>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                {coach.name}
              </h3>

              {/* Expandable Bio on Hover */}
              <div className="max-h-0 overflow-hidden group-hover:max-h-32 transition-all duration-500">
                <p className="text-white/60 text-sm leading-relaxed mb-3">
                  {coach.bio}
                </p>
                {coach.achievements && (
                  <div className="flex flex-wrap gap-2">
                    {coach.achievements.slice(0, 2).map((achievement, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/70"
                      >
                        {achievement}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { coaches, loading } = this.state;

    return (
      <section
        ref={this.sectionRef}
        className="py-20 md:py-32 bg-surface-dark relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-1/3 h-full opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-gold to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-accent-gold/10 text-accent-gold text-sm font-semibold tracking-wider rounded-full mb-6">
              COACHING STAFF
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Meet Our <span className="text-accent-gold">Team</span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Experienced professionals dedicated to developing talent and leading
              Kaboona FC to success.
            </p>
          </div>

          {/* Coach Cards */}
          <div
            ref={this.cardsRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {loading
              ? Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i}>
                      <CoachCardSkeleton />
                    </div>
                  ))
              : coaches.map((coach, index) => this.renderCoachCard(coach, index))}
          </div>

          {/* CTA to Our Team Page */}
          <div className="text-center mt-12">
            <Link
              to="/our-team"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-accent-gold/50 text-accent-gold font-semibold rounded-lg hover:bg-accent-gold hover:text-black transition-all duration-300 group"
            >
              View Full Team
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    );
  }
}

export default TeamPreviewSection;
