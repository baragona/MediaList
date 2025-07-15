import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
  onScan: () => void;
  onConfig: () => void;
  itemCount: number;
}

export function Toolbar({ onScan, onConfig, itemCount }: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-buttons">
        <button className="win95-button win95-raised" onClick={onScan}>
          <span className="win95-icon win95-icon-scan"></span>
          Scan Files
        </button>
        <button className="win95-button win95-raised" onClick={onConfig}>
          <span className="win95-icon win95-icon-gear"></span>
          Configuration
        </button>
      </div>
      <div className="toolbar-info">
        <span className="item-count win95-sunken">{itemCount} items</span>
      </div>
    </div>
  );
}