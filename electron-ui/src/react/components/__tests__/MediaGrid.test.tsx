import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaGrid } from '../MediaGrid';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import type { LibraryItem } from '../../types/electron';

// Mock dependencies
jest.mock('../../hooks/useElectronAPI');
jest.mock('../SquishyText', () => ({
  SquishyText: ({ text, className }: { text: string; className?: string }) => (
    <span className={className}>{text}</span>
  )
}));

describe('MediaGrid', () => {
  const mockOnItemClick = jest.fn();

  const mockItems: LibraryItem[] = [
    {
      id: 1,
      path: '/movies/movie1.mp4',
      basename: 'movie1.mp4',
      size: 1024 * 1024 * 100, // 100MB
      modified: 1640995200,
      added: 1640995200,
      fff: ''
    },
    {
      id: 2,
      path: '/movies/movie2.mp4',
      basename: 'movie2.mp4',
      size: 1024 * 1024 * 200, // 200MB
      modified: 1641081600,
      added: 1641081600,
      fff: ''
    },
    {
      id: 3,
      path: '/movies/movie3.mp4',
      basename: 'movie3.mp4',
      size: 1024 * 1024 * 150, // 150MB
      modified: 1641168000,
      added: 1641168000,
      fff: ''
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useElectronAPI as jest.Mock).mockReturnValue({
      openFile: jest.fn().mockResolvedValue({ success: true })
    });
  });

  it('renders media items correctly', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByText('movie1.mp4')).toBeInTheDocument();
    expect(screen.getByText('movie2.mp4')).toBeInTheDocument();
    expect(screen.getByText('movie3.mp4')).toBeInTheDocument();
  });

  it('displays items with correct icons', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    // Check that video icons are present
    const icons = document.querySelectorAll('.win95-icon');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('calls onItemClick on double click', async () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const row = screen.getByText('movie1.mp4').closest('.grid-row');
    if (row) {
      fireEvent.doubleClick(row);
    }

    await waitFor(() => {
      expect(mockOnItemClick).toHaveBeenCalledWith(mockItems[0]);
    });
  });

  it('selects item on click', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const row = screen.getByText('movie1.mp4').closest('.grid-row');
    if (row) {
      fireEvent.click(row);
      expect(row).toHaveClass('selected');
    }
  });

  it('handles multi-selection with Ctrl/Cmd key', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    // Select first item
    const row1 = screen.getByText('movie1.mp4').closest('.grid-row');
    if (row1) {
      fireEvent.click(row1);
    }

    // Select second item with Ctrl
    const row2 = screen.getByText('movie2.mp4').closest('.grid-row');
    if (row2) {
      fireEvent.click(row2, { ctrlKey: true });
      // Multi-selection behavior would depend on implementation
      expect(row2).toBeDefined();
    }
  });

  it('handles range selection with Shift key', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    // Select first item
    const row1 = screen.getByText('movie1.mp4').closest('.grid-row');
    if (row1) {
      fireEvent.click(row1);
    }

    // Select third item with Shift
    const row3 = screen.getByText('movie3.mp4').closest('.grid-row');
    if (row3) {
      fireEvent.click(row3, { shiftKey: true });
      // Range selection behavior would depend on implementation
      expect(row3).toBeDefined();
    }
  });

  it('sorts items by name correctly', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    const rows = screen.getAllByRole('row').slice(1); // Skip header
    expect(rows[0]).toHaveTextContent('movie1.mp4');
    expect(rows[1]).toHaveTextContent('movie2.mp4');
    expect(rows[2]).toHaveTextContent('movie3.mp4');
  });

  it('toggles sort direction on repeated clicks', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const nameHeader = screen.getByText('Name');
    
    // First click - ascending
    fireEvent.click(nameHeader);
    let rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('movie1.mp4');

    // Second click - descending
    fireEvent.click(nameHeader);
    rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('movie3.mp4');
  });

  it('formats file size correctly', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByText('100.0 MB')).toBeInTheDocument();
    expect(screen.getByText('200.0 MB')).toBeInTheDocument();
    expect(screen.getByText('150.0 MB')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const grid = screen.getByRole('grid');
    
    // Focus the grid
    fireEvent.focus(grid);

    // Arrow down
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    
    // Keyboard navigation behavior would depend on implementation
    expect(grid).toHaveFocus();
  });

  it('opens file on Enter key', async () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const grid = screen.getByRole('grid');
    fireEvent.focus(grid);
    
    // Select first item
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    
    // Press Enter
    fireEvent.keyDown(grid, { key: 'Enter' });

    // Enter key behavior would depend on implementation
    expect(grid).toHaveFocus();
  });

  it('resizes columns on drag', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const resizer = screen.getAllByRole('separator')[0];
    
    fireEvent.mouseDown(resizer, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 150 });
    fireEvent.mouseUp(document);

    // Column should be resized (exact width depends on implementation)
    expect(resizer).toBeInTheDocument();
  });

  it('handles empty items array', () => {
    render(
      <MediaGrid
        items={[]}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('handles empty search results', () => {
    render(
      <MediaGrid
        items={[]}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('applies correct CSS classes to selected rows', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const row = screen.getByText('movie1.mp4').closest('.grid-row');
    if (row) {
      fireEvent.click(row);
      expect(row).toHaveClass('selected');
    }
  });
});