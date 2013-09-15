#!/usr/bin/python

import json
import pprint

def getConfig():
    defaults = {
        'LibraryRoots':[],
        'VideoFileExtensions':[],
        'AudioFileExtensions':[],
        'MaxSearchDepth':[],
        'MinMovieSize':[],
        'MinAudioSize':[],

    }
    cfg={}
    try:
        file = open('joobler_config.json')
        cfg = json.load(file)
        file.close()
    except:
        print 'couldnt open config file'
    

    for key in defaults:
        if not key in cfg:
            cfg[key] = defaults[key]
            print 'using defaults for config key '+key
    return cfg
    
def saveConfig(cfg):
    file = open('joobler_config.json','w')
    json.dump(cfg,file,indent=4)
    file.close()
    

pp = pprint.PrettyPrinter(indent=4)
pp.pprint(getConfig())

saveConfig(getConfig())
