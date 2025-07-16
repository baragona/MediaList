import React, { useState, useMemo, useEffect, memo, useCallback, useRef } from 'react';
import type { LibraryItem } from '../types/electron';
import { SquishyText } from './SquishyText';
import { GRID_CONSTANTS, FILE_SIZE_UNITS } from '../constants';
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
      role="row"
      aria-selected={isSelected}
      aria-label={`${item.basename}, ${formatSize(item.size)}, modified ${formatDate(item.modified)}`}
    >
      <div className="grid-cell name" style={{ width: `${columnWidths.name}%` }} title={item.path} role="gridcell">
        <span className={`win95-icon ${getFileIcon(item.basename)}`} aria-hidden="true"></span>
        <SquishyText text={item.basename} className="grid-cell-text" />
      </div>
      <div className="grid-cell size" style={{ width: `${columnWidths.size}%` }} role="gridcell">
        {formatSize(item.size)}
      </div>
      <div className="grid-cell modified" style={{ width: `${columnWidths.modified}%` }} role="gridcell">
        {formatDate(item.modified)}
      </div>
    </div>
  );
});

export function MediaGrid({ items, onItemClick }: MediaGridProps) {
  const [sortKey, setSortKey] = useState<SortKey>('basename');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<{ name: number; size: number; modified: number }>({
    ...GRID_CONSTANTS.DEFAULT_COLUMN_WIDTHS
  });
  const [resizing, setResizing] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);

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

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!sortedItems.length) return;

    const currentIndex = selectedId ? sortedItems.findIndex(item => item.id === selectedId) : -1;
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newIndex = currentIndex < sortedItems.length - 1 ? currentIndex + 1 : currentIndex;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = sortedItems.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (selectedId) {
          const item = sortedItems.find(item => item.id === selectedId);
          if (item) onItemClick(item);
        }
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < sortedItems.length) {
      const newItem = sortedItems[newIndex];
      setSelectedId(newItem.id);
      
      // Scroll selected item into view
      const rowTop = newIndex * GRID_CONSTANTS.ROW_HEIGHT;
      const rowBottom = rowTop + GRID_CONSTANTS.ROW_HEIGHT;
      const scrollContainer = scrollContainerRef.current;
      
      if (scrollContainer) {
        const containerTop = scrollContainer.scrollTop;
        const containerBottom = containerTop + scrollContainer.clientHeight;
        
        if (rowTop < containerTop) {
          scrollContainer.scrollTop = rowTop;
        } else if (rowBottom > containerBottom) {
          scrollContainer.scrollTop = rowBottom - scrollContainer.clientHeight;
        }
      }
    }
  }, [sortedItems, selectedId, onItemClick]);

  const formatSize = useCallback((bytes: number): string => {
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${FILE_SIZE_UNITS[unitIndex]}`;
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
    const startIndex = Math.floor(scrollTop / GRID_CONSTANTS.ROW_HEIGHT) - GRID_CONSTANTS.OVERSCAN;
    const endIndex = Math.ceil((scrollTop + containerHeight) / GRID_CONSTANTS.ROW_HEIGHT) + GRID_CONSTANTS.OVERSCAN;
    
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
      
      <div 
        className="grid-body" 
        onScroll={handleScroll} 
        ref={scrollContainerRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-label="Media files grid"
        aria-rowcount={sortedItems.length}
      >
        {/* Spacer for correct scrollbar */}
        <div style={{ height: sortedItems.length * GRID_CONSTANTS.ROW_HEIGHT }}>
          {/* Container for visible items */}
          <div style={{ 
            transform: `translateY(${visibleRange.start * GRID_CONSTANTS.ROW_HEIGHT}px)`,
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