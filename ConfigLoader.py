#!/usr/bin/python

import json
import pprint
import re

defaults = {
    'LibraryRoots':[],
    'VideoFileExtensions':['avi','mp4','mkv','m4v'],
    'AudioFileExtensions':[],
    'MaxSearchDepth':7,
    'MinMovieSize':50*1024*1024,
    'MinAudioSize':300*1024,
    'openVideosWith':'/Applications/VLC.app'
}

def getConfigSchemaJSON():
    
    current=getConfig()
    stringArrays=["LibraryRoots",'VideoFileExtensions','AudioFileExtensions']
    numbers=['MaxSearchDepth','MinMovieSize','MinAudioSize']
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
    return json.dumps(schema)
    

def keyNameToNiceName(key):
    return ' '.join(re.findall('[A-Z][^A-Z]*',key))

def getConfig():

    cfg={}
    file=None
    try:
        file = open('joobler_config.json')
    except IOError:
        print 'couldnt open config file'
    if file:
        try:
            cfg = json.load(file)
        except ValueError:
            raise Exception('Configuration JSON file has some errors.')
        file.close()
    else:
        print 'using defaults for everything'

    #print 'couldnt open config file'+e
    

    for key in defaults:
        if not key in cfg:
            cfg[key] = defaults[key]
            print 'using defaults for config key '+key
    return cfg
    
def saveConfig(cfg):
    file = open('joobler_config.json','w')
    file.write(json.dumps(cfg,file,indent=4,sort_keys=True))
    file.close()
    
    
#If this script is run as a standalone
#Small test program
if __name__ == "__main__":
    pp = pprint.PrettyPrinter(indent=4)
    config = getConfig()
    pp.pprint(config)

    saveConfig(config)

