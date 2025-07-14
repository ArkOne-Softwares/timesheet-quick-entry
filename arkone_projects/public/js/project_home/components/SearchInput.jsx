import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

export default function SearchInput({ 
  value, 
  onChange, 
  onSearch, 
  searchFunction,
  placeholder = "Search...", 
  options = [], 
  loading: propLoading = false,
  displayField = "name",
  valueField = "name",
  clearable = true,
  disabled = false,
  className = "",
  getDisplayText,
  getSubText,
  onSelect
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [searchOptions, setSearchOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search query
  useEffect(() => {
    const currentOptions = searchFunction ? searchOptions : options;
    if (currentOptions && currentOptions.length > 0) {
      if (searchQuery.trim() && !searchFunction) {
        const filtered = currentOptions.filter(option => 
          (option[displayField] || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredOptions(filtered);
      } else {
        setFilteredOptions(currentOptions);
      }
    } else {
      setFilteredOptions([]);
    }
  }, [options, searchOptions, searchQuery, displayField, searchFunction]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger search when query changes
  useEffect(() => {
    if (searchFunction && searchQuery.trim()) {
      const debounceTimer = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await searchFunction(searchQuery);
          setSearchOptions(results || []);
        } catch (error) {
          console.error('Search error:', error);
          setSearchOptions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else if (onSearch && searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, onSearch, searchFunction]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    setIsOpen(true);
    setUserTyping(true);
    
    // If input is cleared and there's a value, clear the selection
    if (!newQuery.trim() && value) {
      onChange('');
    }
  };

  const handleOptionSelect = (option) => {
    if (onSelect) {
      onSelect(option);
    } else {
      const selectedValue = option[valueField];
      onChange(selectedValue);
    }
    
    const displayText = getDisplayText ? getDisplayText(option) : (option[displayField] || option[valueField]);
    setSearchQuery(displayText);
    setIsOpen(false);
    setUserTyping(false);
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    setIsOpen(false);
    setUserTyping(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // If there's a value and user clicks to edit, clear the input for typing
    if (value && searchQuery) {
      setUserTyping(true);
      setSearchQuery('');
    }
    
    // Don't load initial options if user is focused and there's already text
    // This prevents overriding user input when they click to edit
    if (searchFunction && !searchQuery && !value) {
      // Load initial options for searchFunction only when there's no value
      const loadInitialOptions = async () => {
        setLoading(true);
        try {
          const results = await searchFunction('');
          setSearchOptions(results || []);
        } catch (error) {
          console.error('Initial search error:', error);
          setSearchOptions([]);
        } finally {
          setLoading(false);
        }
      };
      loadInitialOptions();
    } else if (onSearch && !searchQuery && !value) {
      onSearch(''); // Load initial options only when there's no value
    }
  };

  // Set display value from selected value
  useEffect(() => {
    if (!userTyping) {
      const currentOptions = searchFunction ? searchOptions : options;
      if (value && currentOptions.length > 0) {
        const selectedOption = currentOptions.find(option => option[valueField] === value);
        if (selectedOption) {
          const displayText = getDisplayText ? getDisplayText(selectedOption) : (selectedOption[displayField] || value);
          setSearchQuery(displayText);
        }
      } else if (!value) {
        setSearchQuery('');
      }
    }
  }, [value, options, searchOptions, valueField, displayField, getDisplayText, searchFunction, userTyping]);

  return (
    <div className={`search-input-container ${className}`} ref={dropdownRef}>
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="search-input"
        />
        <div className="search-input-icons">
          {(loading || propLoading) && <div className="search-loading-spinner"></div>}
          {!loading && !propLoading && <FaSearch className="search-icon" />}
          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="search-clear-btn"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="search-dropdown">
          {(loading || propLoading) && (
            <div className="search-dropdown-item loading">
              <div className="search-loading-spinner"></div>
              Loading...
            </div>
          )}
          
          {!loading && !propLoading && filteredOptions.length === 0 && searchQuery && (
            <div className="search-dropdown-item no-results">
              No results found for "{searchQuery}"
            </div>
          )}
          
          {!loading && !propLoading && filteredOptions.length === 0 && !searchQuery && (
            <div className="search-dropdown-item no-results">
              Type to search...
            </div>
          )}
          
          {!loading && !propLoading && filteredOptions.map((option, index) => (
            <div
              key={option[valueField] || index}
              className={`search-dropdown-item ${value === option[valueField] ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="option-text">
                {getDisplayText ? getDisplayText(option) : (option[displayField] || option[valueField])}
              </div>
              {getSubText && getSubText(option) && (
                <div className="option-subtext">
                  {getSubText(option)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
