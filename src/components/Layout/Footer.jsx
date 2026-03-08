import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Footer extends Component {
  render() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
      club: [
        { to: '/our-team', label: 'Our Team' },
        { to: '/stats', label: 'Stats' },
        { to: '/investors', label: 'Investors' },
      ],
      shop: [
        { to: '/fan-portal', label: 'Fan Portal' },
        { to: '/shop', label: 'Shop' },
      ],
      join: [
        { to: '/training-signup', label: 'Join Training' },
        { to: '/register', label: 'Create Account' },
      ],
      legal: [
        { to: '/terms', label: 'Terms' },
        { to: '/privacy', label: 'Privacy' },
        { to: '/refund', label: 'Refund' },
        { to: '/cookies', label: 'Cookie Policy' },
      ],
    };

    return (
      <footer className="bg-surface-dark-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Logo & Tagline */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="inline-block">
                <img src="/kaboona-logo.png" alt="Kaboona FC" className="h-16 w-auto" />
              </Link>
              <p className="mt-3 text-sm text-white/60">
                Kaboona Football Club
              </p>
            </div>

            {/* Club Links */}
            <div>
              <h3 className="text-sm font-semibold text-accent-gold uppercase tracking-wider mb-4">
                Club
              </h3>
              <ul className="space-y-3">
                {footerLinks.club.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop Links */}
            <div>
              <h3 className="text-sm font-semibold text-accent-gold uppercase tracking-wider mb-4">
                Shop
              </h3>
              <ul className="space-y-3">
                {footerLinks.shop.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Join Links */}
            <div>
              <h3 className="text-sm font-semibold text-accent-gold uppercase tracking-wider mb-4">
                Join
              </h3>
              <ul className="space-y-3">
                {footerLinks.join.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-semibold text-accent-gold uppercase tracking-wider mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              {/* Copyright */}
              <p className="text-sm text-white/40">
                &copy; {currentYear} Kaboona FC. All rights reserved.
              </p>

              {/* Social Links */}
              <div className="flex items-center space-x-4">
                {/* Instagram */}
                <a
                  href="https://instagram.com/kaboonafc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Instagram"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* Twitter/X */}
                <a
                  href="https://twitter.com/kaboonafc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Twitter"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
}

export default Footer;
