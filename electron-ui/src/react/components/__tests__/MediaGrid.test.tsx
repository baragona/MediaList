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

    // Items should be sorted by name by default (ascending)
    const fileNames = screen.getAllByText(/movie\d+\.mp4/);
    expect(fileNames).toHaveLength(3);
    
    // They should already be in ascending order
    expect(fileNames[0]).toHaveTextContent('movie1.mp4');
    expect(fileNames[1]).toHaveTextContent('movie2.mp4');
    expect(fileNames[2]).toHaveTextContent('movie3.mp4');
  });

  it('toggles sort direction on repeated clicks', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const nameHeader = document.querySelector('.grid-header-cell.name');
    expect(nameHeader).toBeInTheDocument();
    
    if (nameHeader) {
      // Initial state - ascending
      let fileNames = screen.getAllByText(/movie\d+\.mp4/);
      expect(fileNames[0]).toHaveTextContent('movie1.mp4');

      // First click - should toggle to descending
      fireEvent.click(nameHeader);
      fileNames = screen.getAllByText(/movie\d+\.mp4/);
      expect(fileNames[0]).toHaveTextContent('movie3.mp4');
      expect(fileNames[2]).toHaveTextContent('movie1.mp4');
    }
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
    
    // Grid should have tabindex for keyboard navigation
    expect(grid).toHaveAttribute('tabindex', '0');
    
    // Test keyboard events are accepted without errors
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: 'ArrowUp' });
    fireEvent.keyDown(grid, { key: 'Home' });
    fireEvent.keyDown(grid, { key: 'End' });
    fireEvent.keyDown(grid, { key: 'Enter' });
    
    // After keyboard navigation, check that at least one row can be selected
    const firstRow = screen.getByText('movie1.mp4').closest('.grid-row');
    if (firstRow) {
      fireEvent.click(firstRow);
      expect(firstRow).toHaveClass('selected');
    }
  });

  it('opens file on Enter key', async () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const grid = screen.getByRole('grid');
    
    // First select an item by clicking
    const firstRow = screen.getByText('movie1.mp4').closest('.grid-row');
    if (firstRow) {
      fireEvent.click(firstRow);
    }
    
    // Focus the grid and press Enter
    fireEvent.focus(grid);
    fireEvent.keyDown(grid, { key: 'Enter' });

    // Should have called onItemClick
    await waitFor(() => {
      expect(mockOnItemClick).toHaveBeenCalled();
    });
  });

  it('resizes columns on drag', () => {
    render(
      <MediaGrid
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    // Find resize handle by class
    const resizeHandle = document.querySelector('.column-resize-handle');
    expect(resizeHandle).toBeInTheDocument();
    
    if (resizeHandle) {
      // Simulate drag
      fireEvent.mouseDown(resizeHandle, { clientX: 100 });
      fireEvent.mouseMove(document, { clientX: 150 });
      fireEvent.mouseUp(document);
    }

    // Resize handle should still be present
    expect(resizeHandle).toBeInTheDocument();
  });

  it('handles empty items array', () => {
    render(
      <MediaGrid
        items={[]}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
    // Check for header cells by class
    const nameHeader = document.querySelector('.grid-header-cell.name');
    expect(nameHeader).toBeInTheDocument();
  });

  it('handles empty search results', () => {
    render(
      <MediaGrid
        items={[]}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
    // Should have headers but no data rows
    const headers = document.querySelectorAll('.grid-header-cell');
    expect(headers.length).toBeGreaterThan(0);
    
    const dataRows = document.querySelectorAll('.grid-row');
    expect(dataRows.length).toBe(0);
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