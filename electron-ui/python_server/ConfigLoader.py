#!/usr/bin/python

import json
import pprint
import re
import copy

'''
defaults = {
    'LibraryRoots':[],
    'VideoFileExtensions':['avi','mp4','mkv','m4v'],
    'AudioFileExtensions':[],
    'MaxSearchDepth':7,
    'MinMovieSize':50*1024*1024,
    'MinAudioSize':300*1024,
    'openVideosWith':'/Applications/VLC.app'
}
'''

schema = {
  "order": [
    "LibraryRoots",
    "openVideosWith",
    "VideoFileExtensions",
    "AudioFileExtensions",
    "MaxSearchDepth",
    "MinMovieSize",
    "MinAudioSize"
  ],
  "properties": {
    "openVideosWith":{
      "default":'/Applications/VLC.app',
      'type':'string',
      'icon':'win95icons/Icon_61-0.png'
    },
    "AudioFileExtensions": {
      "default": [],
      "items": {
        "type": "string"
      },
      "type": "array",
      'icon':'win95icons/Icon_43-0.png'
    },
    "MinAudioSize": {
      "default": 300*1024,
      "type": "number",
      'icon':'win95icons/Icon_69-0.png'
    },
    "VideoFileExtensions": {
      "default": [
        "avi",
        "mp4",
        "mkv",
        "m4v"
      ],
      "items": {
        "type": "string"
      },
      "type": "array",
      'icon':'win95icons/Icon_43-0.png'
    },
    "MaxSearchDepth": {
      "default": 7,
      "type": "number",
      'icon':'win95icons/Icon_45-0.png'
    },
    "LibraryRoots": {
      "default": [      ],
      'icon':'win95icons/Icon_21-0.png',
      "items": {
        "type": "string"
      },
      "type": "array"
    },
    "MinMovieSize": {
      "default": 52428800,
      "type": "number",
      'icon':'win95icons/Icon_69-0.png'
    }
  }
}

defaults={}
for key in schema['properties']:
    defaults[key]=schema['properties'][key]['default']
    
def getConfigSchemaJSON():
    current=getConfig()
    sch=copy.deepcopy(schema)
    for  key in sch['properties']:
        it = sch['properties'][key]
        it['title']=keyNameToNiceName(key)
        it['default']=current[key]
    return json.dumps(sch)
    
'''
def getConfigSchemaJSON():
    current=getConfig()
    stringArrays=["LibraryRoots",'VideoFileExtensions','AudioFileExtensions']
    numbers=['MaxSearchDepth','MinMovieSize','MinAudioSize']
    keyToIcon={
        'LibraryRoots':'win95icons/Icon_21-0.png',
        'MaxSearchDepth':'win95icons/Icon_45-0.png',
        'VideoFileExtensions':'win95icons/Icon_43-0.png',
        'AudioFileExtensions':'win95icons/Icon_43-0.png',
        'MinMovieSize':'win95icons/Icon_69-0.png',
        'MinAudioSize':'win95icons/Icon_69-0.png',
    }
    schema={
        'order': [],
        'properties': {}
    }
    for key in stringArrays:
        schema['order'].append(key);
        schema['properties'][key]={
            "type": "array",
            "title": keyNameToNiceName(key),
            "default": current[key],
            "items": {
                "type": "string"    
                } 
            }
    for key in numbers:
        schema['order'].append(key);
        schema['properties'][key]={
            "type": "number",
            "title": keyNameToNiceName(key),
            "default": current[key]
            }
    for key in keyToIcon:
        schema['properties'][key]['icon']=keyToIcon[key];
    return json.dumps(schema)
'''

def keyNameToNiceName(key):
    return ' '.join(re.findall('[A-Z][^A-Z]*',key))

def getConfig():

    cfg={}
    file=None
    try:
        file = open('joobler_config.json')
    except IOError:
        print('couldnt open config file')
    if file:
        try:
            cfg = json.load(file)
        except ValueError:
            raise Exception('Configuration JSON file has some errors.')
        file.close()
    else:
        print('using defaults for everything')

    #print 'couldnt open config file'+e
    

    for key in defaults:
        if not key in cfg:
            cfg[key] = defaults[key]
            print('using defaults for config key ' + key)
    return cfg
    
def saveConfig(cfg):
    file = open('joobler_config.json','w')
    file.write(json.dumps(cfg,indent=4,sort_keys=True))
    file.close()
    
    
#If this script is run as a standalone
#Small test program
if __name__ == "__main__":
    pp = pprint.PrettyPrinter(indent=4)
    config = getConfig()
    pp.pprint(config)

    saveConfig(config)

