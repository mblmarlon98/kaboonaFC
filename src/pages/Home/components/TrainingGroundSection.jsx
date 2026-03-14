import React, { Component, createRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

class TrainingGroundSection extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.imageRef = createRef();
    this.contentRef = createRef();
  }

  componentDidMount() {
    this.initAnimations();
  }

  componentWillUnmount() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  initAnimations = () => {
    if (this.imageRef.current) {
      gsap.to(this.imageRef.current, {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: this.sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    if (this.contentRef.current) {
      gsap.fromTo(
        this.contentRef.current.children,
        { opacity: 0, x: 50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.15,
          scrollTrigger: {
            trigger: this.sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  };

  render() {
    const c = this.props.content || {};
    const badge = c.badge || 'TRAINING GROUND';
    const title = c.title || '';
    const description = c.description || '';
    const trainingImage = c.image || null;
    const groundLabel = c.groundLabel || 'Training Ground';
    const features = [c.feature1, c.feature2, c.feature3, c.feature4].filter(Boolean);
    const lat = c.lat || '3.0673';
    const lng = c.lng || '101.6038';
    const latDir = parseFloat(lat) >= 0 ? 'N' : 'S';
    const lngDir = parseFloat(lng) >= 0 ? 'E' : 'W';
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    return (
      <section
        ref={this.sectionRef}
        className="py-20 md:py-32 bg-surface-dark-elevated relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image Container */}
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                {trainingImage ? (
                  <img
                    ref={this.imageRef}
                    src={trainingImage}
                    alt="Kaboona FC Training Ground"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div
                    ref={this.imageRef}
                    className="absolute inset-0 bg-gradient-to-br from-green-800 via-green-700 to-green-900"
                  >
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/40 rounded-full" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white/40" />
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-20 h-40 border-2 border-white/40 border-l-0" />
                      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-20 h-40 border-2 border-white/40 border-r-0" />
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-8 h-20 border-2 border-white/40 border-l-0" />
                      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-8 h-20 border-2 border-white/40 border-r-0" />
                    </div>
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                          90deg,
                          transparent,
                          transparent 20px,
                          rgba(255, 255, 255, 0.03) 20px,
                          rgba(255, 255, 255, 0.03) 40px
                        )`,
                      }}
                    />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/80 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg inline-block">
                    <p className="text-white/90 text-sm font-medium">
                      {groundLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -left-4 w-24 h-24 border-2 border-accent-gold/30 rounded-2xl -z-10" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent-gold/5 rounded-2xl -z-10" />
            </div>

            {/* Content */}
            <div ref={this.contentRef} className="order-1 lg:order-2">
              <span className="inline-block px-4 py-1 bg-accent-gold/10 text-accent-gold text-sm font-semibold tracking-wider rounded-full mb-6">
                {badge}
              </span>

              {title && <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                {title}
              </h2>}

              {description && <p className="text-lg text-white/60 leading-relaxed mb-8">
                {description}
              </p>}

              {features.length > 0 && <div className="space-y-4 mb-8">
                {features.map((text, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent-gold/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/70">{text}</span>
                  </div>
                ))}
              </div>}

              <div className="p-6 bg-surface-dark rounded-xl border border-white/5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-white/40 text-sm uppercase tracking-wider mb-2">
                      GPS Coordinates
                    </p>
                    <p className="text-white font-mono text-lg">
                      {lat}°{latDir},{' '}
                      {lng}°{lngDir}
                    </p>
                  </div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-accent-gold/10 text-accent-gold rounded-lg hover:bg-accent-gold/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View on Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default TrainingGroundSection;
