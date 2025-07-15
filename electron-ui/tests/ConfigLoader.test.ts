import fs from 'fs';
import { getConfig, saveConfig, getConfigSchemaJSON } from '../src/ConfigLoader';

jest.mock('fs');

describe('ConfigLoader', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should load config from file', () => {
      const mockConfig = {
        LibraryRoots: ['/path/to/media'],
        openVideosWith: '/Applications/VLC.app',
        VideoFileExtensions: ['mp4', 'avi', 'mkv'],
        MaxSearchDepth: 5,
        MinMovieSize: 100000000
      };
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      const config = getConfig();
      
      expect(mockFs.readFileSync).toHaveBeenCalledWith('data/medialist_config.json', 'utf8');
      expect(config).toEqual(mockConfig);
    });

    it('should return default config if file read fails', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const config = getConfig();
      
      expect(config).toHaveProperty('LibraryRoots');
      expect(config).toHaveProperty('openVideosWith');
      expect(config).toHaveProperty('VideoFileExtensions');
      expect(Array.isArray(config.LibraryRoots)).toBe(true);
    });

    it('should merge partial config with defaults', () => {
      const partialConfig = {
        LibraryRoots: ['/custom/path'],
        MinMovieSize: 50000000
      };
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(partialConfig));
      
      const config = getConfig();
      
      expect(config.LibraryRoots).toEqual(['/custom/path']);
      expect(config.MinMovieSize).toBe(50000000);
      expect(config.openVideosWith).toBeDefined(); // Should have default value
      expect(config.VideoFileExtensions).toBeDefined(); // Should have default value
    });
  });

  describe('saveConfig', () => {
    it('should write config to file', () => {
      const config = {
        LibraryRoots: ['/path/to/media'],
        openVideosWith: '/Applications/VLC.app',
        VideoFileExtensions: ['mp4', 'avi'],
        AudioFileExtensions: ['mp3', 'flac'],
        MaxSearchDepth: 10,
        MinMovieSize: 200000000,
        MinAudioSize: 1000000
      };
      
      saveConfig(config);
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'data/medialist_config.json',
        JSON.stringify(config, null, 2)
      );
    });
  });

  describe('getConfigSchemaJSON', () => {
    it('should return config schema with descriptions', () => {
      const schemaJSON = getConfigSchemaJSON();
      const schema = JSON.parse(schemaJSON);
      
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('LibraryRoots');
      expect(schema.properties).toHaveProperty('openVideosWith');
      expect(schema.properties).toHaveProperty('VideoFileExtensions');
      
      expect(schema.properties.LibraryRoots).toHaveProperty('description');
      expect(schema.properties.LibraryRoots).toHaveProperty('type', 'array');
      expect(schema.properties.LibraryRoots).toHaveProperty('default');
      
      expect(schema.properties.openVideosWith).toHaveProperty('description');
      expect(schema.properties.openVideosWith).toHaveProperty('type', 'string');
      
      expect(schema.properties.MinMovieSize).toHaveProperty('type', 'number');
    });
  });
});