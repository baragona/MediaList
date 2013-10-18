#!/usr/bin/python

import dbaccess
import ConfigLoader
import sqlite3 as lite

import json
import re
import os
import subprocess

from twisted.web import server, resource, http
from twisted.internet import reactor

import mimetypes

class HelloResource(resource.Resource):
    isLeaf = True
    numberRequests = 0
    
    def render_GET(self, request):
        self.numberRequests += 1
        request.setHeader("content-type", "text/plain")
        request.setHeader("Access-Control-Allow-Origin","*")
        
        args = request.args
        print request.path
        
        filepath = re.sub(r'^/','',request.path)
        print filepath
        if request.path == '/do':
            if 'action' in args:
                action = args['action'][0]
                print action
                if action == 'getLibrary':
                    
                    con = dbaccess.connect()
                    con.row_factory = lite.Row
                    cur = con.cursor()
                    cur.execute("select * from library")
                    rows = map(dbaccess.dict_from_row,cur.fetchall())
                    return json.dumps(rows)
                if action == 'openFile':
                    fileId=args['fileId'][0]
                    con = dbaccess.connect()
                    cur = con.cursor()
                    cur.execute("select path from library where id = ?",[fileId])
                    path=cur.fetchone()[0];
                    result=subprocess.check_output(['open','-a',ConfigLoader.getConfig()['openVideosWith'],path])
                    return 'opened'
                if action == 'getConfigSchemaJSON':
                    return ConfigLoader.getConfigSchemaJSON()
                else:
                    return 'WTF'
            else:
                return '{}'
        elif os.path.exists(filepath):
            request.setHeader("content-type", mimetypes.guess_type(filepath)[0])
            if request.setLastModified(os.path.getmtime(filepath)) == http.CACHED:
                return ''
            else:
                f=file(filepath)
                return f.read()
        else:
            return 'Unknown command'
        
        return "I am request #" + str(self.numberRequests) + "\n"+request.uri

reactor.listenTCP(31415, server.Site(HelloResource()))
reactor.run()


