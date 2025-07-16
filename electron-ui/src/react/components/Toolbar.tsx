import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
  onScan: () => void;
  onConfig: () => void;
  itemCount: number;
}

export function Toolbar({ onScan, onConfig, itemCount }: ToolbarProps) {
  return (
    <nav className="toolbar" role="navigation" aria-label="Main toolbar">
      <div className="toolbar-buttons">
        <button 
          className="win95-button win95-raised" 
          onClick={onScan}
          aria-label="Scan files for new media"
          title="Scan configured directories for media files"
        >
          <span className="win95-icon win95-icon-scan" aria-hidden="true"></span>
          Scan Files
        </button>
        <button 
          className="win95-button win95-raised" 
          onClick={onConfig}
          aria-label="Open configuration settings"
          title="Configure library paths and settings"
        >
          <span className="win95-icon win95-icon-gear" aria-hidden="true"></span>
          Configuration
        </button>
      </div>
      <div className="toolbar-info" role="status" aria-live="polite">
        <span className="item-count win95-sunken" aria-label={`Library contains ${itemCount} items`}>
          {itemCount} items
        </span>
      </div>
    </nav>
  );
}