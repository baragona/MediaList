import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { useElectronAPI } from '../hooks/useElectronAPI';
import type { ConfigSchema, MediaListConfig, ConfigSchemaProperty } from '../types/electron';
import { CONFIG_DIALOG_DEFAULTS } from '../constants';
import './ConfigDialog.css';

interface ConfigDialogProps {
  onClose: () => void;
  onSave: () => void;
}

export function ConfigDialog({ onClose, onSave }: ConfigDialogProps) {
  const [config, setConfig] = useState<MediaListConfig>({
    LibraryRoots: [],
    openVideosWith: '',
    VideoFileExtensions: [],
    MinMovieSize: 0,
    MaxSearchDepth: 0
  });
  const [schema, setSchema] = useState<ConfigSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { getConfigSchema, saveConfig } = useElectronAPI();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const schemaJSON = await getConfigSchema();
      const parsedSchema = JSON.parse(schemaJSON) as ConfigSchema;
      setSchema(parsedSchema);
      
      // Extract current values from schema defaults
      const currentConfig: MediaListConfig = {
        LibraryRoots: [],
        openVideosWith: '',
        VideoFileExtensions: [],
        MinMovieSize: 0,
        MaxSearchDepth: 0
      };
      
      if (parsedSchema.properties) {
        Object.entries(parsedSchema.properties).forEach(([key, prop]) => {
          currentConfig[key] = prop.default;
        });
      }
      setConfig(currentConfig);
    } catch (error) {
      console.error('Failed to parse config schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Clean up arrays by removing empty strings before saving
      const cleanedConfig = { ...config };
      Object.keys(cleanedConfig).forEach(key => {
        if (Array.isArray(cleanedConfig[key])) {
          cleanedConfig[key] = cleanedConfig[key].filter((item: string) => item.trim() !== '');
        }
      });
      
      await saveConfig(JSON.stringify(cleanedConfig));
      onSave();
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string | string[] | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getFieldIcon = (icon: string): string => {
    // Convert from relative path to just the icon filename
    const iconName = icon.split('/').pop() || '';
    const iconMap: { [key: string]: string } = {
      'Icon_61-0.png': 'win95-icon-app',
      'Icon_43-0.png': 'win95-icon-file',
      'Icon_69-0.png': 'win95-icon-size',
      'Icon_45-0.png': 'win95-icon-depth',
      'Icon_21-0.png': 'win95-icon-folder',
    };
    return iconMap[iconName] || 'win95-icon-file';
  };

  const renderField = (key: string, prop: ConfigSchemaProperty) => {
    const value = config[key];
    
    if (prop.type === 'array') {
      return (
        <div key={key} className="config-field">
          <div className="config-field-header">
            {prop.icon && <span className={`win95-icon ${getFieldIcon(prop.icon)}`}></span>}
            <label className="config-label">{prop.title || key}:</label>
          </div>
          <textarea
            className="win95-input config-textarea"
            value={Array.isArray(value) ? value.join('\n') : ''}
            onChange={(e) => handleChange(key, e.target.value.split('\n'))}
            rows={5}
          />
          <div className="config-description">{prop.description}</div>
        </div>
      );
    }
    
    if (prop.type === 'number') {
      return (
        <div key={key} className="config-field">
          <div className="config-field-header">
            {prop.icon && <span className={`win95-icon ${getFieldIcon(prop.icon)}`}></span>}
            <label className="config-label">{prop.title || key}:</label>
          </div>
          <input
            type="number"
            className="win95-input"
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
          />
          <div className="config-description">{prop.description}</div>
        </div>
      );
    }
    
    return (
      <div key={key} className="config-field">
        <div className="config-field-header">
          {prop.icon && <span className={`win95-icon ${getFieldIcon(prop.icon)}`}></span>}
          <label className="config-label">{prop.title || key}:</label>
        </div>
        <input
          type="text"
          className="win95-input"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleChange(key, e.target.value)}
        />
        <div className="config-description">{prop.description}</div>
      </div>
    );
  };

  return (
    <div className="config-dialog-overlay">
      <Rnd
        default={{
          x: window.innerWidth / 2 - CONFIG_DIALOG_DEFAULTS.width / 2,
          y: window.innerHeight / 2 - CONFIG_DIALOG_DEFAULTS.height / 2,
          width: CONFIG_DIALOG_DEFAULTS.width,
          height: CONFIG_DIALOG_DEFAULTS.height,
        }}
        minWidth={CONFIG_DIALOG_DEFAULTS.minWidth}
        minHeight={CONFIG_DIALOG_DEFAULTS.minHeight}
        dragHandleClassName="win95-window-titlebar"
        className="config-dialog-rnd"
      >
        <div className="config-dialog win95-window" role="dialog" aria-labelledby="config-dialog-title" aria-modal="true">
        <div className="win95-window-titlebar">
          <span className="titlebar-title" id="config-dialog-title">
            <span className="win95-icon win95-icon-gear" aria-hidden="true"></span>
            Configuration
          </span>
          <div className="titlebar-buttons">
            <button className="titlebar-button titlebar-minimize" disabled aria-label="Minimize">
              <span className="win95-icon win95-icon-minimize" aria-hidden="true"></span>
            </button>
            <button className="titlebar-button titlebar-maximize" disabled aria-label="Maximize">
              <span className="win95-icon win95-icon-maximize" aria-hidden="true"></span>
            </button>
            <button className="titlebar-button titlebar-close" onClick={onClose} aria-label="Close configuration dialog">
              <span className="win95-icon win95-icon-close" aria-hidden="true"></span>
            </button>
          </div>
        </div>
        <div className="win95-window-content">
          {loading ? (
            <div className="config-loading">Loading configuration...</div>
          ) : (
            <>
              <div className="config-form">
                {schema?.properties && Object.entries(schema.properties).map(([key, prop]) => 
                  renderField(key, prop)
                )}
              </div>
              <div className="config-buttons">
                <button 
                  className="win95-button" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="win95-button" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </Rnd>
    </div>
  );
}