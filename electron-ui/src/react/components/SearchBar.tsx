import React from 'react';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar" role="search">
      <label htmlFor="search-input" className="visually-hidden">
        Search media files
      </label>
      <input
        id="search-input"
        type="search"
        className="win95-input search-input"
        placeholder="Search media files..."
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        autoFocus
        aria-label="Search media files by name or path"
      />
      {value && (
        <button
          className="win95-button clear-button"
          onClick={() => onChange('')}
          title="Clear search"
          aria-label="Clear search"
        >
          <span className="win95-icon win95-icon-close" aria-hidden="true"></span>
        </button>
      )}
    </div>
  );
}