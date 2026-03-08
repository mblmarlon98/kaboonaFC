import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRIES, getFlagUrl } from '../../data/countries';

/**
 * Country selector with flags and search functionality
 */
class CountrySelect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      searchQuery: '',
      highlightedIndex: 0,
    };
    this.dropdownRef = React.createRef();
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = (event) => {
    if (this.dropdownRef.current && !this.dropdownRef.current.contains(event.target)) {
      this.setState({ isOpen: false });
    }
  };

  getFilteredCountries = () => {
    const { searchQuery } = this.state;
    if (!searchQuery) return COUNTRIES;
    const lowerQuery = searchQuery.toLowerCase();
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(lowerQuery));
  };

  handleSelect = (country) => {
    const { onChange, name } = this.props;
    if (onChange) {
      onChange({ target: { name, value: country.code } });
    }
    this.setState({ isOpen: false, searchQuery: '' });
  };

  handleKeyDown = (e) => {
    const filtered = this.getFilteredCountries();
    const { highlightedIndex, isOpen } = this.state;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        this.setState({ isOpen: true });
      } else {
        this.setState({
          highlightedIndex: Math.min(highlightedIndex + 1, filtered.length - 1),
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.setState({
        highlightedIndex: Math.max(highlightedIndex - 1, 0),
      });
    } else if (e.key === 'Enter' && isOpen && filtered[highlightedIndex]) {
      e.preventDefault();
      this.handleSelect(filtered[highlightedIndex]);
    } else if (e.key === 'Escape') {
      this.setState({ isOpen: false });
    }
  };

  render() {
    const { value, placeholder = 'Select your nationality', className = '', disabled } = this.props;
    const { isOpen, searchQuery, highlightedIndex } = this.state;
    const filteredCountries = this.getFilteredCountries();
    const selectedCountry = value ? COUNTRIES.find((c) => c.code === value) : null;

    return (
      <div className="relative" ref={this.dropdownRef}>
        {/* Selected Value / Input */}
        <div
          className={`w-full px-4 py-3 bg-surface-dark-elevated border border-white/20 rounded-lg text-white cursor-pointer flex items-center gap-3 transition-colors ${
            isOpen ? 'border-accent-gold ring-1 ring-accent-gold' : 'hover:border-white/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          onClick={() => !disabled && this.setState({ isOpen: !isOpen })}
        >
          {selectedCountry ? (
            <>
              <img
                src={getFlagUrl(selectedCountry.code)}
                alt={selectedCountry.name}
                className="w-6 h-4 object-cover rounded-sm"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="flex-1">{selectedCountry.name}</span>
            </>
          ) : (
            <span className="flex-1 text-white/40">{placeholder}</span>
          )}
          <svg
            className={`w-5 h-5 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-2 w-full bg-surface-dark-elevated border border-white/20 rounded-lg shadow-2xl overflow-hidden"
            >
              {/* Search Input */}
              <div className="p-2 border-b border-white/10">
                <input
                  ref={this.inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => this.setState({ searchQuery: e.target.value, highlightedIndex: 0 })}
                  onKeyDown={this.handleKeyDown}
                  placeholder="Search countries..."
                  className="w-full px-3 py-2 bg-surface-dark border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-accent-gold"
                  autoFocus
                />
              </div>

              {/* Countries List */}
              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country, index) => (
                    <div
                      key={country.code}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                        index === highlightedIndex
                          ? 'bg-accent-gold/20 text-accent-gold'
                          : 'text-white hover:bg-white/5'
                      } ${value === country.code ? 'bg-accent-gold/10' : ''}`}
                      onClick={() => this.handleSelect(country)}
                      onMouseEnter={() => this.setState({ highlightedIndex: index })}
                    >
                      <img
                        src={getFlagUrl(country.code)}
                        alt={country.name}
                        className="w-6 h-4 object-cover rounded-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="text-sm">{country.name}</span>
                      {value === country.code && (
                        <svg className="w-4 h-4 ml-auto text-accent-gold" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-white/40 text-sm">No countries found</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
}

export default CountrySelect;
