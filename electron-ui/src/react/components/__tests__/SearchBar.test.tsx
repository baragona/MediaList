import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder text', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    const input = screen.getByPlaceholderText('Search media files...');
    expect(input).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<SearchBar value="test query" onChange={() => {}} />);
    const input = screen.getByDisplayValue('test query');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<SearchBar value="" onChange={handleChange} />);
    
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'new search' } });
    
    expect(handleChange).toHaveBeenCalledWith('new search');
  });

  it('shows clear button when there is a value', () => {
    render(<SearchBar value="search term" onChange={() => {}} />);
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expect(clearButton).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    const clearButton = screen.queryByRole('button', { name: 'Clear search' });
    expect(clearButton).not.toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    const handleChange = jest.fn();
    render(<SearchBar value="search term" onChange={handleChange} />);
    
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    fireEvent.click(clearButton);
    
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('has proper accessibility attributes', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'Search media files by name or path');
    expect(input).toHaveAttribute('type', 'search');
  });
});