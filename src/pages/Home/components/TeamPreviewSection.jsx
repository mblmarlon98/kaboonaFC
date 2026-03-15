import React, { Component, createRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../../../services/supabase';

gsap.registerPlugin(ScrollTrigger);

// Skeleton Loader for Coach Cards
const CoachCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-[3/4] bg-white/10 rounded-2xl mb-4" />
    <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
    <div className="h-4 bg-white/10 rounded w-1/2" />
  </div>
);

const ROLE_DISPLAY = {
  owner: { label: 'Owner', color: 'text-yellow-300' },
  manager: { label: 'Manager', color: 'text-blue-400' },
  coach: { label: 'Coach', color: 'text-accent-gold' },
};

class TeamPreviewSection extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.cardsRef = createRef();
    this.state = {
      staff: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchStaff();
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

  fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, roles, profile_image_url');

      if (error) {
        console.warn('Could not fetch staff profiles:', error);
      }

      const staffRoles = ['owner', 'manager', 'coach'];
      const rolePriority = { owner: 0, manager: 1, coach: 2 };

      const staffMembers = (data || [])
        .filter((p) => {
          if (Array.isArray(p.roles)) return p.roles.some((r) => staffRoles.includes(r));
          return staffRoles.includes(p.role);
        })
        .map((p) => {
          const bestRole = this.getBestRole(p, staffRoles);
          return {
            id: p.id,
            name: p.full_name || 'Staff Member',
            role: ROLE_DISPLAY[bestRole]?.label || bestRole,
            roleKey: bestRole,
            image_url: p.profile_image_url,
          };
        })
        .sort((a, b) => (rolePriority[a.roleKey] ?? 99) - (rolePriority[b.roleKey] ?? 99));

      // Show up to 3 staff members
      this.setState({ staff: staffMembers.slice(0, 3), loading: false }, () => {
        this.initScrollAnimation();
      });
    } catch (error) {
      console.error('Error fetching staff:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  getBestRole = (profile, staffRoles) => {
    const priority = ['owner', 'manager', 'coach', 'admin'];
    if (Array.isArray(profile.roles)) {
      for (const r of priority) {
        if (profile.roles.includes(r)) return r;
      }
      return profile.roles.find((r) => staffRoles.includes(r)) || profile.role;
    }
    return profile.role;
  };

  renderStaffCard = (member) => {
    const roleColor = ROLE_DISPLAY[member.roleKey]?.color || 'text-white/60';

    return (
      <div key={member.id} className="group relative">
        <div className="relative overflow-hidden rounded-2xl bg-surface-dark-elevated border border-white/5 hover:border-accent-gold/30 transition-all duration-500">
          {/* Image Container */}
          <div className="aspect-[3/4] relative overflow-hidden">
            {member.image_url ? (
              <img
                src={member.image_url}
                alt={member.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-surface-dark-hover to-surface-dark flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-4xl font-display font-bold text-white/30">
                    {member.name.charAt(0)}
                  </span>
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className={`text-sm font-semibold uppercase tracking-wider ${roleColor} mb-2`}>
                {member.role}
              </p>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                {member.name}
              </h3>

            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { staff, loading } = this.state;
    const c = this.props.content || {};
    const badge = c.badge || 'OUR STAFF';
    const heading = c.heading || 'Meet Our Team';
    const description = c.description || 'The people who lead, manage, and coach Kaboona FC to success.';

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
              {badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              {heading}
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          {/* Staff Cards */}
          <div
            ref={this.cardsRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {loading
              ? Array(3).fill(0).map((_, i) => (
                  <div key={i}><CoachCardSkeleton /></div>
                ))
              : staff.length > 0
              ? staff.map((member) => this.renderStaffCard(member))
              : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-white/40">No staff members assigned yet. Add them in the admin panel.</p>
                </div>
              )
            }
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
