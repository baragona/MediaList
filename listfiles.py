#!/usr/bin/python

import os
import re
import sqlite3 as lite
import subprocess



library_root = '/Volumes/iJules/Users/Julian/Movies'
movie_filetypes = ['avi','mp4','mkv','m4v']
movie_minsize = 50*1024*1025#50 mb minimum for movie files
max_search_depth = 7


con = None

try:
    con = lite.connect('joobler.db')
except lite.Error, e:
    
    print "Error %s:" % e.args[0]
    sys.exit(1)


os.chdir(library_root)

def isTooBoring(counts):
    if counts[0]==0 and counts[1] > 5:
        return 1
    return 0

def listdir(root,depth,parentCounts):
    nInteresting=0
    nBoring=0
    subdirs = []
    try:
        babies = os.listdir(root)
    except:
        print "couldn't list contents for "+root
        return;    
    for files in babies:
        thispath = os.path.join(root,files)
        pathMinusExt, fileExtension = os.path.splitext(thispath)
        fileName = os.path.basename(thispath)
        fileExtension = re.sub('^.','',fileExtension)
        
        
        
        #print fileExtension
        if re.compile(r"\..*").match(fileName):
            #print "File is a dotfile"
            nBoring+=1
            continue
        if os.path.isdir(thispath):
            subdirs.append(thispath)
        elif os.path.isfile(thispath):
            size = os.path.getsize(thispath);
            if size < movie_minsize:
                print "Too small, skipping "
                nBoring+=1
                continue
            if fileExtension in movie_filetypes:
                #print(thispath)
                type = subprocess.check_output(['file','--separator','SEPARATOR!',thispath])
                print(type)
                x = re.compile(r".+SEPARATOR! (.+)")
                m = x.match(type)
                if m:
                    type = m.group(1)
                    #print type;
                    nInteresting+=1
                else:
                    print "ugh weird output from file command?"
            #else:
                #print "bad: "+fileExtension
        else:
            print "some kind of weird file"
    
    #now look at all the subdirs
    #print subdirs
    for dir in subdirs:
        #if the parent was really boring, and this directory is boring too, then dont look any deeper
        if isTooBoring(parentCounts) and isTooBoring([nInteresting,nBoring]):
            print dir
            print "the parent was too boring to bother looking any deeper"
            continue
            
        if depth+1 <= max_search_depth:        
            listdir(dir,depth+1,[nInteresting,nBoring])
        else:
            print dir
            print "not going any deeper"
    

listdir('.',1,[0,0])

