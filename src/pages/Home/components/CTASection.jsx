import React, { Component, createRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

class CTASection extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.cardsRef = createRef();
  }

  componentDidMount() {
    this.initAnimations();
  }

  componentWillUnmount() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  initAnimations = () => {
    if (this.cardsRef.current) {
      gsap.fromTo(
        this.cardsRef.current.children,
        { opacity: 0, y: 50, rotationY: -15 },
        {
          opacity: 1,
          y: 0,
          rotationY: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: this.sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  };

  render() {
    const ctaCards = [
      {
        id: 'join-training',
        title: 'Join Training',
        subtitle: 'Become a Player',
        description:
          'Ready to take your game to the next level? Join our training sessions and become part of the Kaboona FC family.',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        ),
        link: '/training-signup',
        buttonText: 'Sign Up Now',
        gradient: 'from-accent-gold/20 via-accent-gold/10 to-transparent',
        borderColor: 'border-accent-gold/30 hover:border-accent-gold',
        iconColor: 'text-accent-gold',
        buttonStyle: 'bg-accent-gold text-black hover:bg-accent-gold-light',
      },
      {
        id: 'become-fan',
        title: 'Become a Fan',
        subtitle: 'Join the Community',
        description:
          'Support Kaboona FC from the stands! Get exclusive content, match updates, and be part of our growing fanbase.',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        ),
        link: '/fan-portal',
        buttonText: 'Join Fan Portal',
        gradient: 'from-secondary-blue/20 via-secondary-blue/10 to-transparent',
        borderColor: 'border-secondary-blue/30 hover:border-secondary-blue',
        iconColor: 'text-secondary-blue',
        buttonStyle: 'bg-secondary-blue text-white hover:bg-secondary-blue-light',
      },
    ];

    return (
      <section
        ref={this.sectionRef}
        className="py-20 md:py-32 bg-surface-dark-elevated relative overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-gold/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-blue/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-white/5 text-white/60 text-sm font-semibold tracking-wider rounded-full mb-6">
              GET INVOLVED
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Join the <span className="text-accent-gold">Pride</span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Whether you want to play or support from the sidelines, there's a
              place for you at Kaboona FC.
            </p>
          </div>

          {/* CTA Cards */}
          <div
            ref={this.cardsRef}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {ctaCards.map((card) => (
              <div
                key={card.id}
                className={`group relative p-8 md:p-10 rounded-3xl bg-gradient-to-br ${card.gradient} border ${card.borderColor} transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}
              >
                {/* Card Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`${card.iconColor} mb-6`}>{card.icon}</div>

                  {/* Subtitle */}
                  <p className="text-white/50 text-sm uppercase tracking-wider mb-2">
                    {card.subtitle}
                  </p>

                  {/* Title */}
                  <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-white/60 leading-relaxed mb-8">
                    {card.description}
                  </p>

                  {/* Button */}
                  <Link
                    to={card.link}
                    className={`inline-flex items-center gap-2 px-6 py-3 ${card.buttonStyle} font-semibold rounded-lg transition-all duration-300 group/btn`}
                  >
                    {card.buttonText}
                    <svg
                      className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-white">
                    <circle cx="80" cy="20" r="60" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Stats Banner */}
          <div className="mt-20 p-8 rounded-2xl bg-surface-dark border border-white/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '100+', label: 'Active Members' },
                { value: '50+', label: 'Training Sessions' },
                { value: '3', label: 'Competitive Teams' },
                { value: '1', label: 'United Community' },
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl md:text-4xl font-display font-bold text-accent-gold mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/50 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default CTASection;
