import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationManager } from '../NotificationManager';

describe('NotificationManager', () => {
  it('renders nothing when no notifications', () => {
    const { container } = render(<NotificationManager notifications={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders success notification', () => {
    const notifications = [
      { id: '1', message: 'Success message', type: 'success' as const }
    ];
    
    render(<NotificationManager notifications={notifications} />);
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    const notification = screen.getByText('Success message').parentElement;
    expect(notification).toHaveClass('notification-success');
  });

  it('renders error notification', () => {
    const notifications = [
      { id: '1', message: 'Error message', type: 'error' as const }
    ];
    
    render(<NotificationManager notifications={notifications} />);
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    const notification = screen.getByText('Error message').parentElement;
    expect(notification).toHaveClass('notification-error');
  });

  it('renders info notification', () => {
    const notifications = [
      { id: '1', message: 'Info message', type: 'info' as const }
    ];
    
    render(<NotificationManager notifications={notifications} />);
    
    expect(screen.getByText('Info message')).toBeInTheDocument();
    const notification = screen.getByText('Info message').parentElement;
    expect(notification).toHaveClass('notification-info');
  });

  it('renders multiple notifications', () => {
    const notifications = [
      { id: '1', message: 'First message', type: 'success' as const },
      { id: '2', message: 'Second message', type: 'error' as const },
      { id: '3', message: 'Third message', type: 'info' as const }
    ];
    
    render(<NotificationManager notifications={notifications} />);
    
    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
    expect(screen.getByText('Third message')).toBeInTheDocument();
  });

  it('uses correct icon for each notification type', () => {
    const notifications = [
      { id: '1', message: 'Success', type: 'success' as const },
      { id: '2', message: 'Error', type: 'error' as const },
      { id: '3', message: 'Info', type: 'info' as const }
    ];
    
    const { container } = render(<NotificationManager notifications={notifications} />);
    
    expect(container.querySelector('.win95-icon-check')).toBeInTheDocument();
    expect(container.querySelector('.win95-icon-error')).toBeInTheDocument();
    expect(container.querySelector('.win95-icon-info')).toBeInTheDocument();
  });
});