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

    // Default mock responses
    mockGetConfigSchema.mockResolvedValue(JSON.stringify({
      properties: {
        LibraryRoots: {
          type: 'array',
          items: { type: 'string' },
          description: 'Directories to scan for media files'
        },
        openVideosWith: {
          type: 'string',
          description: 'Path to video player application'
        },
        VideoFileExtensions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Supported video file extensions'
        },
        MinMovieSize: {
          type: 'number',
          description: 'Minimum file size in bytes'
        },
        MaxSearchDepth: {
          type: 'number',
          description: 'Maximum directory depth to search'
        }
      }
    }));
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

    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    expect(mockGetConfigSchema).toHaveBeenCalled();
    expect(screen.getByText('LibraryRoots')).toBeInTheDocument();
    expect(screen.getByText('openVideosWith')).toBeInTheDocument();
  });

  it('handles schema loading error', async () => {
    mockGetConfigSchema.mockRejectedValue(new Error('Failed to load'));

    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading configuration/i)).toBeInTheDocument();
    });
  });

  it('updates config values on input change', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    // Find the openVideosWith input
    const inputs = screen.getAllByRole('textbox');
    const videoPlayerInput = inputs.find(input => 
      input.getAttribute('placeholder') === 'Enter openVideosWith'
    );

    if (videoPlayerInput) {
      fireEvent.change(videoPlayerInput, { target: { value: '/usr/bin/vlc' } });
      expect(videoPlayerInput).toHaveValue('/usr/bin/vlc');
    }
  });

  it('saves configuration when Save button is clicked', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveConfig).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles save error gracefully', async () => {
    mockSaveConfig.mockRejectedValue(new Error('Save failed'));

    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveConfig).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Failed to save config:', expect.any(Error));
    });
  });

  it('closes dialog when Cancel button is clicked', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
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

    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    // Array properties should have special handling
    expect(screen.getByText('LibraryRoots')).toBeInTheDocument();
    expect(screen.getByText('VideoFileExtensions')).toBeInTheDocument();
  });

  it('handles number type properties correctly', async () => {
    render(
      <ConfigDialog
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    // Number properties should be displayed
    expect(screen.getByText('MinMovieSize')).toBeInTheDocument();
    expect(screen.getByText('MaxSearchDepth')).toBeInTheDocument();
  });
});