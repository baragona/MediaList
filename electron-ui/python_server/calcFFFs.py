#!/usr/bin/python

import os
import re
import sqlite3 as lite
import time
import multiprocessing

import dbaccess
import ConfigLoader
import FFF

config = ConfigLoader.getConfig()





def handleRow(row):
    print "calculating "+row['path']
    fff = FFF.getFFF(row['path'])
    cur = con.cursor()
    cur.execute("update library set fff = ? where id = ?", [fff,row['id']])
    con.commit()
    
con = dbaccess.connect()
con.row_factory = lite.Row
cur = con.cursor()

cur.execute("select id,path from library where fff = 'pending'")
rows = cur.fetchall()
#print rows

map(handleRow,rows)





print 'Done'
