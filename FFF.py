#!/usr/bin/python


#Fast File Fingerprint

import os

import random
import math

import hashlib
import base64

import re
import pprint

def getRawFFF(filepath):
    file = open(filepath,'rb')#read,binary mode
    
    size = os.path.getsize(filepath)
    
    n_testpoints = 21
    testpoints = []
        
    for i in range(n_testpoints):
        it = math.floor((i*1.0/n_testpoints) * size)
        testpoints.append(it)
        
    testpoints.sort()
    #print testpoints
    testvals = ''
    
    for pt in testpoints:
        file.seek(pt)
        there = file.read(1)
        #print ord(there)
        testvals+=there
    file.close()
    b64 = base64.urlsafe_b64encode(testvals)    
    return b64
    

def getFFF(filepath):    
    size = os.path.getsize(filepath)
    b64 = getRawFFF(filepath)    
    fff = 'size:'+str(size)+':fffv1:'+b64
    
    return fff

def prepareFFFSet(list):
    sizes_to_fffs={}
    x = re.compile(r"size:(\d+):fffv(\d):(.+)")
    for fff in list:
        m = x.match(fff)
        if m:
            thissize=m.group(1)
            fffversion=m.group(2)
            thisfff=m.group(3)
            if int(fffversion) != 1:
                raise Exception('unknown FFF version:'+fffversion)
            if not thissize in sizes_to_fffs:
                sizes_to_fffs[thissize]=[]
            sizes_to_fffs[thissize].append(thisfff)
        else:
            raise Exception('couldnt parse the FFF: '+fff)
    #pprint.PrettyPrinter(indent=4).pprint(sizes_to_fffs)
    return sizes_to_fffs

def testFileAgainstFFFList(filepath, list):
    size = str(os.path.getsize(filepath))
    sizes_to_fffs=prepareFFFSet(list)
    
    if size in sizes_to_fffs:
        if getRawFFF(filepath) in sizes_to_fffs[size]:
            return 1
        else:
            print 'fff no match'
            return 0
    else:
        print 'size mismatch'
        return 0
