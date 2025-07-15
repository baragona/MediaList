import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { useElectronAPI } from '../hooks/useElectronAPI';
import './ConfigDialog.css';

interface ConfigDialogProps {
  onClose: () => void;
  onSave: () => void;
}

export function ConfigDialog({ onClose, onSave }: ConfigDialogProps) {
  const [config, setConfig] = useState<any>({});
  const [schema, setSchema] = useState<any>({});
  const { getConfigSchema, saveConfig } = useElectronAPI();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const schemaJSON = await getConfigSchema();
    try {
      const parsedSchema = JSON.parse(schemaJSON);
      setSchema(parsedSchema);
      
      // Extract current values from schema defaults
      const currentConfig: any = {};
      if (parsedSchema.properties) {
        Object.entries(parsedSchema.properties).forEach(([key, prop]: [string, any]) => {
          currentConfig[key] = prop.default;
        });
      }
      setConfig(currentConfig);
    } catch (error) {
      console.error('Failed to parse config schema:', error);
    }
  };

  const handleSave = async () => {
    // Clean up arrays by removing empty strings before saving
    const cleanedConfig = { ...config };
    Object.keys(cleanedConfig).forEach(key => {
      if (Array.isArray(cleanedConfig[key])) {
        cleanedConfig[key] = cleanedConfig[key].filter((item: string) => item.trim() !== '');
      }
    });
    
    await saveConfig(JSON.stringify(cleanedConfig));
    onSave();
  };

  const handleChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
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

  const renderField = (key: string, prop: any) => {
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
            value={value || 0}
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
          value={value || ''}
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
          x: window.innerWidth / 2 - 250,
          y: window.innerHeight / 2 - 200,
          width: 500,
          height: 400,
        }}
        minWidth={400}
        minHeight={300}
        dragHandleClassName="win95-window-titlebar"
        className="config-dialog-rnd"
      >
        <div className="config-dialog win95-window">
        <div className="win95-window-titlebar">
          <span className="titlebar-title">
            <span className="win95-icon win95-icon-gear"></span>
            Configuration
          </span>
          <div className="titlebar-buttons">
            <button className="titlebar-button titlebar-minimize" disabled>
              <span className="win95-icon win95-icon-minimize"></span>
            </button>
            <button className="titlebar-button titlebar-maximize" disabled>
              <span className="win95-icon win95-icon-maximize"></span>
            </button>
            <button className="titlebar-button titlebar-close" onClick={onClose}>
              <span className="win95-icon win95-icon-close"></span>
            </button>
          </div>
        </div>
        <div className="win95-window-content">
          <div className="config-form">
            {schema.properties && Object.entries(schema.properties).map(([key, prop]) => 
              renderField(key, prop)
            )}
          </div>
          <div className="config-buttons">
            <button className="win95-button" onClick={handleSave}>
              Save
            </button>
            <button className="win95-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
      </Rnd>
    </div>
  );
}