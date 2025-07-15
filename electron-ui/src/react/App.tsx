import React, { useState, useEffect } from 'react';
import { useElectronAPI } from './hooks/useElectronAPI';
import { MediaGrid } from './components/MediaGrid';
import { SearchBar } from './components/SearchBar';
import { Toolbar } from './components/Toolbar';
import { NotificationManager } from './components/NotificationManager';
import { ConfigDialog } from './components/ConfigDialog';
import type { LibraryItem } from './types/electron';
import './styles/app.css';

function App() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [filteredLibrary, setFilteredLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  
  console.log('App component rendering');
  console.log('window.electronAPI:', window.electronAPI);
  
  const { getLibrary, openFile, scanFiles } = useElectronAPI();

  // Load library on mount
  useEffect(() => {
    loadLibrary();
  }, []);

  // Filter library when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLibrary(library);
    } else {
      const filtered = library.filter(item =>
        item.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLibrary(filtered);
    }
  }, [searchTerm, library]);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const items = await getLibrary();
      setLibrary(items);
      setFilteredLibrary(items);
    } catch (error) {
      addNotification('Failed to load library', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = async (item: LibraryItem) => {
    const result = await openFile(item.id);
    if (!result.success) {
      addNotification(result.error || 'Failed to open file', 'error');
    }
  };

  const handleScan = async () => {
    addNotification('Scanning for media files...', 'info');
    const result = await scanFiles();
    
    if (result.success) {
      addNotification(`Scan complete. Found ${result.filesFound || 0} new files.`, 'success');
      await loadLibrary();
    } else {
      addNotification(result.error || 'Scan failed', 'error');
    }
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const filePath = (file as any).path;
      if (filePath) {
        await window.electronAPI.addFile(filePath);
      }
    }
    
    await loadLibrary();
    addNotification(`Added ${files.length} file(s) to library`, 'success');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      className="app"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="app-header">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <Toolbar 
          onScan={handleScan}
          onConfig={() => setConfigOpen(true)}
          itemCount={filteredLibrary.length}
        />
      </div>
      
      <div className="app-content">
        {loading ? (
          <div className="loading">Loading library...</div>
        ) : (
          <MediaGrid 
            items={filteredLibrary}
            onItemClick={handleOpenFile}
          />
        )}
      </div>

      {configOpen && (
        <ConfigDialog 
          onClose={() => setConfigOpen(false)}
          onSave={() => {
            addNotification('Configuration saved', 'success');
            setConfigOpen(false);
          }}
        />
      )}

      <NotificationManager notifications={notifications} />
    </div>
  );
}

export default App;