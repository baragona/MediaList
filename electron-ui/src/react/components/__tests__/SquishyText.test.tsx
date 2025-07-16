import React from 'react';
import { render, screen } from '@testing-library/react';
import { SquishyText } from '../SquishyText';
import { useSquishyText } from '../../hooks/useSquishyText';

// Mock the useSquishyText hook
jest.mock('../../hooks/useSquishyText');

describe('SquishyText', () => {
  const mockUseSquishyText = useSquishyText as jest.MockedFunction<typeof useSquishyText>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock return value
    mockUseSquishyText.mockReturnValue({
      style: {
        letterSpacing: '-0.5px',
        wordSpacing: '-1px',
        transform: 'scaleX(0.9)',
        transformOrigin: 'left center',
        display: 'inline-block',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginRight: '-5px'
      },
      ref: { current: null }
    });
  });

  it('renders text content correctly', () => {
    render(<SquishyText text="Test content" />);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SquishyText text="Test" className="custom-class" />);
    const textElement = screen.getByText('Test');
    expect(textElement.parentElement).toHaveClass('custom-class');
  });

  it('sets title attribute when provided', () => {
    render(<SquishyText text="Test" title="Custom title" />);
    const container = screen.getByText('Test').parentElement;
    expect(container).toHaveAttribute('title', 'Custom title');
  });

  it('does not set title when not provided', () => {
    render(<SquishyText text="Test text" />);
    const container = screen.getByText('Test text').parentElement;
    expect(container).not.toHaveAttribute('title');
  });

  it('calls useSquishyText with correct parameters', () => {
    render(<SquishyText text="Test text" />);
    
    // Check that the hook was called with the expected parameters
    expect(mockUseSquishyText).toHaveBeenCalledWith(
      'Test text',
      0, // containerWidth starts at 0
      '11px', // SQUISHY_TEXT_CONSTANTS.FONT_SIZE
      '"Lucida Grande", "Lucida Sans Unicode", Geneva, Verdana, sans-serif', // SQUISHY_TEXT_CONSTANTS.FONT_FAMILY
      'grid-cell-text' // className
    );
  });

  it('applies styles from useSquishyText hook', () => {
    render(<SquishyText text="Test" />);
    const textSpan = screen.getByText('Test');
    
    expect(textSpan).toHaveStyle({
      letterSpacing: '-0.5px',
      wordSpacing: '-1px',
      transform: 'scaleX(0.9)',
      transformOrigin: 'left center',
      display: 'inline-block',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginRight: '-5px'
    });
  });

  it('handles empty text', () => {
    const { container } = render(<SquishyText text="" />);
    // Should render without crashing, even with empty text
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
    // The span should be empty but present
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('');
  });

  it('handles very long text', () => {
    const longText = 'This is a very long text that would normally overflow the container';
    render(<SquishyText text={longText} />);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });
});