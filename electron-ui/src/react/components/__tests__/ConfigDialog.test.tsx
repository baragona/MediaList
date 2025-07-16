import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigDialog } from '../ConfigDialog';
import { useElectronAPI } from '../../hooks/useElectronAPI';

// Mock the hooks
jest.mock('../../hooks/useElectronAPI');

// Mock console methods
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ConfigDialog', () => {
  const mockGetConfigSchema = jest.fn();
  const mockSaveConfig = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useElectronAPI as jest.Mock).mockReturnValue({
      getConfigSchema: mockGetConfigSchema,
      saveConfig: mockSaveConfig
    });

    // Default mock responses - use mockReturnValue for synchronous-like behavior
    mockGetConfigSchema.mockReturnValue(Promise.resolve(JSON.stringify({
      properties: {
        LibraryRoots: {
          type: 'array',
          items: { type: 'string' },
          description: 'Directories to scan for media files',
          default: ['/movies']
        },
        openVideosWith: {
          type: 'string',
          description: 'Path to video player application',
          default: '/usr/bin/vlc'
        },
        VideoFileExtensions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Supported video file extensions',
          default: ['.mp4', '.avi', '.mkv']
        },
        MinMovieSize: {
          type: 'number',
          description: 'Minimum file size in bytes',
          default: 1048576
        },
        MaxSearchDepth: {
          type: 'number',
          description: 'Maximum directory depth to search',
          default: 5
        }
      }
    })));
    mockSaveConfig.mockResolvedValue('success');
  });

  it('renders loading state initially', () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
  });

  it('loads and displays configuration schema', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });

    expect(mockGetConfigSchema).toHaveBeenCalled();
    
    // Check that config fields are rendered using their descriptions or finding by role
    await waitFor(() => {
      expect(screen.getByText('Directories to scan for media files')).toBeInTheDocument();
      expect(screen.getByText('Path to video player application')).toBeInTheDocument();
    });
  });

  it('handles schema loading error', async () => {
    mockGetConfigSchema.mockRejectedValue(new Error('Failed to load'));

    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });

    // Error is logged to console, but UI should still render (with empty config)
    expect(console.error).toHaveBeenCalledWith('Failed to parse config schema:', expect.any(Error));
  });

  it('updates config values on input change', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });

    // Find text inputs (not textareas)
    const inputs = screen.getAllByRole('textbox').filter(el => el.tagName === 'INPUT');
    expect(inputs.length).toBeGreaterThan(0);

    // Change the first text input
    const firstInput = inputs[0];
    fireEvent.change(firstInput, { target: { value: '/usr/bin/vlc' } });
    expect(firstInput).toHaveValue('/usr/bin/vlc');
  });

  it('saves configuration when Save button is clicked', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveConfig).toHaveBeenCalled();
    });
    
    // onSave should be called after successful save
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
    
    // onClose is NOT called automatically after save
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles save error gracefully', async () => {
    mockSaveConfig.mockRejectedValueOnce(new Error('Save failed'));

    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveConfig).toHaveBeenCalled();
    });
    
    // onSave should NOT be called when save fails
    expect(mockOnSave).not.toHaveBeenCalled();
    
    // Button should return to 'Save' state after error
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  it('closes dialog when Cancel button is clicked', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });

    // Find the Cancel button
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
    
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockSaveConfig).not.toHaveBeenCalled();
  });


  it('handles array type properties correctly', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });

    // Array properties should be rendered as textareas
    const textareas = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA');
    expect(textareas.length).toBeGreaterThan(0);
    
    // Check for array property descriptions
    expect(screen.getByText('Directories to scan for media files')).toBeInTheDocument();
    expect(screen.getByText('Supported video file extensions')).toBeInTheDocument();
  });

  it('handles number type properties correctly', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });

    // Number properties should be rendered as number inputs
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThan(0);
    
    // Check for number property descriptions
    expect(screen.getByText('Minimum file size in bytes')).toBeInTheDocument();
    expect(screen.getByText('Maximum directory depth to search')).toBeInTheDocument();
  });
});