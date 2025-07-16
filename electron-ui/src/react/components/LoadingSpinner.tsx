import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner-container" role="status">
      <div className="win95-window loading-spinner-box">
        <div className="loading-spinner-content">
          <div className="loading-spinner win95-hourglass" aria-hidden="true"></div>
          <p className="loading-message">{message}</p>
        </div>
      </div>
    </div>
  );
}