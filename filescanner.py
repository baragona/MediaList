#!/usr/bin/python

import os
import re
import sqlite3 as lite
import subprocess
import time

import ConfigLoader

import dbaccess

config = ConfigLoader.getConfig()


library_root = config['LibraryRoots'][0]
movie_filetypes = config['VideoFileExtensions']
movie_minsize = config['MinMovieSize']
max_search_depth = config['MaxSearchDepth']


con = dbaccess.connect()

def dropLibrary():
    cur = con.cursor()    
    cur.execute("Drop table if exists library")
    con.commit()
def createLibrary():
    cur = con.cursor()    
    cur.execute("CREATE TABLE IF NOT EXISTS library (id INTEGER PRIMARY KEY,  path TEXT , basename, size integer, modified integer, added integer,fff text)")
    cur.execute(" create unique index path on library (path)")
    cur.execute(" create index fff on library (fff)")
    cur.execute(" create index size on library (size)")
    cur.execute(" create index modified on library (modified)")
    cur.execute(" create index added on library (added)")
    con.commit()
def dumpLibrary():
    cur = con.cursor() 
    cur.execute("SELECT * FROM library")

    rows = cur.fetchall()

    for row in rows:
        print row
    print "End dump"
dumpLibrary()
dropLibrary()
createLibrary();

os.chdir(library_root)

def foundMediaFile(path):
    cur = con.cursor()
    realpath = os.path.realpath(path)
    basename = os.path.basename(path)
    size = os.path.getsize(path)
    modified = int(os.path.getmtime(path))
    added = int(time.time())
    fff = 'pending'
    cur.execute("insert or ignore into library (path,basename,size,modified,added,fff) values (?,?,?,?,?,?)", [realpath,basename,size,modified,added,fff])
    con.commit()
    print "inserted"

def isTooBoring(counts):
    if counts[0]==0 and counts[1] > 5:
        return 1
    return 0

def listdir(root,depth,parentCounts):
    nInteresting=0
    nBoring=0
    subdirs = []
    try:
        babies = os.listdir(unicode(root))
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
        if os.path.islink(thispath):
            print 'Symbolic link!'
            nBoring+=1
            continue
        if os.path.isdir(thispath):
            subdirs.append(thispath)
        elif os.path.isfile(thispath):
            size = os.path.getsize(thispath);
            if size < movie_minsize:
                #print "Too small, skipping "
                nBoring+=1
                continue
            if fileExtension in movie_filetypes:
                print(thispath)
                nInteresting+=1
                foundMediaFile(thispath);
#                 type = subprocess.check_output(['file','--separator','SEPARATOR!',thispath])
#                 #print(type)
#                 x = re.compile(r".+SEPARATOR! (.+)")
#                 m = x.match(type)
#                 if m:
#                     type = m.group(1)
#                     #print type;
# 
#                 else:
#                     print "ugh weird output from file command?"
            #else:
                #print "bad: "+fileExtension
        else:
            print "some kind of weird file "+thispath
    
    #now look at all the subdirs
    #print subdirs
    for dir in subdirs:
        #if the parent was really boring, and this directory is boring too, then dont look any deeper
        if isTooBoring(parentCounts) and isTooBoring([nInteresting,nBoring]):
            #print dir
            #print "the parent was too boring to bother looking any deeper"
            continue
            
        if depth+1 <= max_search_depth:        
            listdir(dir,depth+1,[nInteresting,nBoring])
        else:
            print dir
            print "MAXDEPTHnot going any deeper"
    

listdir('.',1,[0,0])

