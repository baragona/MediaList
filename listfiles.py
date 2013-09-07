#!/usr/bin/python

import os
import re

library_root = '/Volumes/Data/A Torrent Download'
movie_filetypes = ['avi','mp4','mkv']

os.chdir(library_root)

def listdir(root):
    for files in os.listdir(root):
        thispath = os.path.join(root,files)
        fileName, fileExtension = os.path.splitext(thispath)
        print fileExtension
        if os.path.isdir(thispath):
            listdir(thispath)
        else:
            if fileExtension in movie_filetypes:
               print(thispath)

listdir('.')

