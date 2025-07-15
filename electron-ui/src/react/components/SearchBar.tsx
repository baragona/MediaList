import React from 'react';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="win95-input search-input"
        placeholder="Search media files..."
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        autoFocus
      />
      {value && (
        <button
          className="win95-button clear-button"
          onClick={() => onChange('')}
          title="Clear search"
        >
          <span className="win95-icon win95-icon-close"></span>
        </button>
      )}
    </div>
  );
}