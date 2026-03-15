import React, { Component, createRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../../../services/supabase';

gsap.registerPlugin(ScrollTrigger);

class AboutSection extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.contentRef = createRef();
    this.state = {
      realStats: null,
    };
  }

  componentDidMount() {
    this.fetchRealStats();
    if (this.contentRef.current) {
      gsap.fromTo(
        this.contentRef.current.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          scrollTrigger: {
            trigger: this.sectionRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  }

  fetchRealStats = async () => {
    try {
      const c = this.props.content || {};
      const [membersRes, playersRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).contains('roles', ['player']),
      ]);

      this.setState({
        realStats: [
          { value: c.stat1Value || 'Est. 2025', label: c.stat1Label || 'Founded' },
          { value: membersRes.count || 0, label: 'Members' },
          { value: playersRes.count || 0, label: 'Players' },
        ],
      });
    } catch (err) {
      console.warn('Could not fetch real stats:', err);
    }
  };

  componentWillUnmount() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  render() {
    const c = this.props.content || {};
    const badge = c.badge || 'ABOUT THE CLUB';
    const title = c.title || 'Kaboona FC';
    const location = c.location || '';
    const description = c.description || '';
    const image = c.image || null;
    const stats = this.state.realStats || [
      { value: c.stat1Value || '', label: c.stat1Label || '' },
      { value: c.stat2Value || '', label: c.stat2Label || '' },
      { value: c.stat3Value || '', label: c.stat3Label || '' },
      { value: c.stat4Value || '', label: c.stat4Label || '' },
    ];

    return (
      <section
        ref={this.sectionRef}
        className="py-20 md:py-32 bg-surface-dark-elevated relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
          <div className="absolute inset-0 bg-gradient-to-l from-accent-gold to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div ref={this.contentRef} className={image ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center' : 'text-center'}>
            {/* Text Content */}
            <div className={image ? '' : ''}>
              <span className="inline-block px-4 py-1 bg-accent-gold/10 text-accent-gold text-sm font-semibold tracking-wider rounded-full mb-6">
                {badge}
              </span>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
                Home of{' '}
                <span className="text-accent-gold">{title}</span>
              </h2>

              <p className="text-xl md:text-2xl text-white/70 mb-8 font-light">
                {location}
              </p>

              <div className={image ? '' : 'max-w-3xl mx-auto'}>
                <p className="text-lg text-white/60 leading-relaxed mb-8">
                  {description}
                </p>

                {stats.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="p-6 bg-surface-dark rounded-xl border border-white/5 hover:border-accent-gold/30 transition-colors duration-300"
                    >
                      <div className="text-3xl md:text-4xl font-display font-bold text-accent-gold mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm text-white/50 uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
            </div>

            {/* Optional Image */}
            {image && (
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                  <img src={image} alt={title} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 border-2 border-accent-gold/30 rounded-2xl -z-10" />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }
}

export default AboutSection;
