import React, { useState, useMemo, useEffect, memo, useCallback, useRef } from 'react';
import type { LibraryItem } from '../types/electron';
import { SquishyText } from './SquishyText';
import './MediaGrid.css';

interface MediaGridProps {
  items: LibraryItem[];
  onItemClick: (item: LibraryItem) => void;
}

type SortKey = 'basename' | 'size' | 'modified';
type SortDirection = 'asc' | 'desc';

// Memoized row component for better performance
interface GridRowProps {
  item: LibraryItem;
  isSelected: boolean;
  columnWidths: { name: number; size: number; modified: number };
  onSelect: (id: number) => void;
  onDoubleClick: (item: LibraryItem) => void;
  getFileIcon: (basename: string) => string;
  formatSize: (bytes: number) => string;
  formatDate: (timestamp: number) => string;
}

const GridRow = memo<GridRowProps>(({ 
  item, 
  isSelected, 
  columnWidths, 
  onSelect, 
  onDoubleClick,
  getFileIcon,
  formatSize,
  formatDate
}: GridRowProps) => {
  return (
    <div
      className={`grid-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(item.id)}
      onDoubleClick={() => onDoubleClick(item)}
    >
      <div className="grid-cell name" style={{ width: `${columnWidths.name}%` }} title={item.path}>
        <span className={`win95-icon ${getFileIcon(item.basename)}`}></span>
        <SquishyText text={item.basename} className="grid-cell-text" />
      </div>
      <div className="grid-cell size" style={{ width: `${columnWidths.size}%` }}>
        {formatSize(item.size)}
      </div>
      <div className="grid-cell modified" style={{ width: `${columnWidths.modified}%` }}>
        {formatDate(item.modified)}
      </div>
    </div>
  );
});

// Virtual scrolling constants
const ROW_HEIGHT = 20; // Approximate height of each row
const OVERSCAN = 5; // Render extra rows for smoother scrolling

export function MediaGrid({ items, onItemClick }: MediaGridProps) {
  const [sortKey, setSortKey] = useState<SortKey>('basename');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState({
    name: 60,  // percentage
    size: 20,  // percentage
    modified: 20  // percentage
  });
  const [resizing, setResizing] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortKey) {
        case 'basename':
          comparison = a.basename.localeCompare(b.basename);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'modified':
          comparison = a.modified - b.modified;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [items, sortKey, sortDirection]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey, sortDirection]);

  const handleDoubleClick = useCallback((item: LibraryItem) => {
    onItemClick(item);
  }, [onItemClick]);

  const handleSelect = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const formatSize = useCallback((bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  const formatDate = useCallback((timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  }, []);

  const handleMouseDown = (column: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(column);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing) return;
    
    requestAnimationFrame(() => {
      const gridEl = document.querySelector('.grid-scroll-container');
      if (!gridEl) return;
      
      const rect = gridEl.getBoundingClientRect();
      const totalWidth = rect.width;
      const mouseX = e.clientX - rect.left;
      const percentage = (mouseX / totalWidth) * 100;
      
      switch (resizing) {
        case 'name':
          const newNameWidth = Math.max(20, Math.min(80, percentage));
          const remainingWidth = 100 - newNameWidth;
          setColumnWidths(prev => ({ 
            name: newNameWidth,
            size: prev.size / (prev.size + prev.modified) * remainingWidth,
            modified: prev.modified / (prev.size + prev.modified) * remainingWidth
          }));
          break;
        case 'size':
          const currentNameWidth = columnWidths.name;
          const newSizeWidth = Math.max(10, Math.min(40, percentage - currentNameWidth));
          const modifiedWidth = 100 - currentNameWidth - newSizeWidth;
          setColumnWidths(prev => ({ 
            name: currentNameWidth,
            size: newSizeWidth,
            modified: modifiedWidth
          }));
          break;
      }
    });
  }, [resizing, columnWidths.name]);

  const handleMouseUp = () => {
    setResizing(null);
  };

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, handleMouseMove]);

  // Set up container height observer
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateContainerHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateContainerHeight();

    resizeObserverRef.current = new ResizeObserver(updateContainerHeight);
    resizeObserverRef.current.observe(container);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Handle scroll with RAF for smooth performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
    });
  }, []);

  // Calculate visible range for virtualization
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN;
    const endIndex = Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN;
    
    return {
      start: Math.max(0, startIndex),
      end: Math.min(sortedItems.length, endIndex)
    };
  }, [scrollTop, containerHeight, sortedItems.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return sortedItems.slice(visibleRange.start, visibleRange.end);
  }, [sortedItems, visibleRange]);

  const getFileIcon = useCallback((basename: string): string => {
    const ext = basename.split('.').pop()?.toLowerCase() || '';
    
    // Video formats
    if (['avi', 'wmv', 'asf'].includes(ext)) return 'win95-icon-avi';
    if (['mp4', 'm4v', 'mov', 'qt'].includes(ext)) return 'win95-icon-mov';
    if (['mpg', 'mpeg', 'mpe', 'm2v'].includes(ext)) return 'win95-icon-mpg';
    if (['mkv', 'webm', 'flv', 'vob', 'ogv', 'ogg'].includes(ext)) return 'win95-icon-video';
    
    // Default video icon
    return 'win95-icon-video';
  }, []);

  return (
    <div className="media-grid">
      <div className="grid-scroll-container">
        <div className="grid-header">
        <div 
          className="grid-header-cell name"
          style={{ width: `${columnWidths.name}%` }}
          onClick={() => handleSort('basename')}
        >
          Name {sortKey === 'basename' && (sortDirection === 'asc' ? '▲' : '▼')}
          <div className="column-resize-handle" onMouseDown={handleMouseDown('name')} />
        </div>
        <div 
          className="grid-header-cell size"
          style={{ width: `${columnWidths.size}%` }}
          onClick={() => handleSort('size')}
        >
          Size {sortKey === 'size' && (sortDirection === 'asc' ? '▲' : '▼')}
          <div className="column-resize-handle" onMouseDown={handleMouseDown('size')} />
        </div>
        <div 
          className="grid-header-cell modified"
          style={{ width: `${columnWidths.modified}%` }}
          onClick={() => handleSort('modified')}
        >
          Modified {sortKey === 'modified' && (sortDirection === 'asc' ? '▲' : '▼')}
        </div>
      </div>
      
      <div className="grid-body" onScroll={handleScroll} ref={scrollContainerRef}>
        {/* Spacer for correct scrollbar */}
        <div style={{ height: sortedItems.length * ROW_HEIGHT }}>
          {/* Container for visible items */}
          <div style={{ 
            transform: `translateY(${visibleRange.start * ROW_HEIGHT}px)`,
            willChange: 'transform'
          }}>
            {visibleItems.map((item, index) => (
              <GridRow
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                columnWidths={columnWidths}
                onSelect={handleSelect}
                onDoubleClick={handleDoubleClick}
                getFileIcon={getFileIcon}
                formatSize={formatSize}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}