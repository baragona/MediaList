import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../Toolbar';

describe('Toolbar', () => {
  const mockOnScan = jest.fn();
  const mockOnConfig = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders scan and config buttons', () => {
    render(<Toolbar onScan={mockOnScan} onConfig={mockOnConfig} itemCount={0} />);
    
    expect(screen.getByRole('button', { name: 'Scan files for new media' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open configuration settings' })).toBeInTheDocument();
  });

  it('displays item count', () => {
    render(<Toolbar onScan={mockOnScan} onConfig={mockOnConfig} itemCount={42} />);
    
    expect(screen.getByText('42 items')).toBeInTheDocument();
  });

  it('calls onScan when scan button is clicked', () => {
    render(<Toolbar onScan={mockOnScan} onConfig={mockOnConfig} itemCount={0} />);
    
    const scanButton = screen.getByRole('button', { name: 'Scan files for new media' });
    fireEvent.click(scanButton);
    
    expect(mockOnScan).toHaveBeenCalledTimes(1);
  });

  it('calls onConfig when config button is clicked', () => {
    render(<Toolbar onScan={mockOnScan} onConfig={mockOnConfig} itemCount={0} />);
    
    const configButton = screen.getByRole('button', { name: 'Open configuration settings' });
    fireEvent.click(configButton);
    
    expect(mockOnConfig).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<Toolbar onScan={mockOnScan} onConfig={mockOnConfig} itemCount={10} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main toolbar');
    
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    
    const itemCount = screen.getByText('10 items');
    expect(itemCount).toHaveAttribute('aria-label', 'Library contains 10 items');
  });

  it('displays correct button text', () => {
    render(<Toolbar onScan={mockOnScan} onConfig={mockOnConfig} itemCount={0} />);
    
    expect(screen.getByText('Scan Files')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });
});