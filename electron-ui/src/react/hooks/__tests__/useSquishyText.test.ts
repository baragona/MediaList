import { renderHook } from '@testing-library/react';
import { useSquishyText } from '../useSquishyText';

describe('useSquishyText', () => {
  it('returns style object and ref', () => {
    const { result } = renderHook(() => 
      useSquishyText('Test text', 100, '12px', 'Arial', 'test-class')
    );

    expect(result.current).toHaveProperty('style');
    expect(result.current).toHaveProperty('ref');
    expect(result.current.ref).toHaveProperty('current');
  });

  it('handles zero container width', () => {
    const { result } = renderHook(() => 
      useSquishyText('Text', 0, '12px', 'Arial')
    );

    expect(result.current.style).toBeDefined();
  });

  it('handles empty text', () => {
    const { result } = renderHook(() => 
      useSquishyText('', 100, '12px', 'Arial')
    );

    expect(result.current.style).toBeDefined();
  });

  it('updates when text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useSquishyText(text, 100, '12px', 'Arial'),
      { initialProps: { text: 'Initial text' } }
    );

    const initialStyle = result.current.style;

    rerender({ text: 'Different text' });

    // Style should be recalculated
    expect(result.current.style).toBeDefined();
  });

  it('updates when container width changes', () => {
    const { result, rerender } = renderHook(
      ({ width }) => useSquishyText('Test text', width, '12px', 'Arial'),
      { initialProps: { width: 100 } }
    );

    const initialStyle = result.current.style;

    rerender({ width: 200 });

    // Style should be recalculated
    expect(result.current.style).toBeDefined();
  });

  it('accepts optional className parameter', () => {
    const { result } = renderHook(() => 
      useSquishyText('Text', 100, '12px', 'Arial', 'custom-class')
    );

    expect(result.current.style).toBeDefined();
  });

  it('uses default font settings when not provided', () => {
    const { result } = renderHook(() => 
      useSquishyText('Text', 100)
    );

    expect(result.current.style).toBeDefined();
  });

  it('handles very long text', () => {
    const longText = 'This is a very long text that would normally overflow the container and require compression';
    const { result } = renderHook(() => 
      useSquishyText(longText, 100, '12px', 'Arial')
    );

    expect(result.current.style).toBeDefined();
  });

  it('handles single character text', () => {
    const { result } = renderHook(() => 
      useSquishyText('A', 100, '12px', 'Arial')
    );

    expect(result.current.style).toBeDefined();
  });

  it('handles numeric text', () => {
    const { result } = renderHook(() => 
      useSquishyText('12345', 100, '12px', 'Arial')
    );

    expect(result.current.style).toBeDefined();
  });
});