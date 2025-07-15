import React, { useRef, useLayoutEffect, useState } from 'react';
import { useSquishyText } from '../hooks/useSquishyText';

interface SquishyTextProps {
  text: string;
  className?: string;
  title?: string;
}

export function SquishyText({ text, className = '', title }: SquishyTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const { style } = useSquishyText(text, containerWidth, '11px', '"Lucida Grande", "Lucida Sans Unicode", Geneva, Verdana, sans-serif', 'grid-cell-text');

  useLayoutEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={className} title={title} style={{ overflow: 'hidden' }}>
      <span style={style}>{text}</span>
    </div>
  );
}