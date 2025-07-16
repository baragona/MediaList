import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Processing files..." />);
    expect(screen.getByText('Processing files...')).toBeInTheDocument();
  });

  it('has proper accessibility role', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with correct CSS classes', () => {
    const { container } = render(<LoadingSpinner />);
    
    expect(container.querySelector('.loading-spinner-container')).toBeInTheDocument();
    expect(container.querySelector('.win95-window')).toBeInTheDocument();
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    expect(container.querySelector('.win95-hourglass')).toBeInTheDocument();
  });

  it('has aria-hidden on visual spinner', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });
});