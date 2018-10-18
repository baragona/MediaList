#!/usr/bin/python

import dbaccess
import ConfigLoader
import pathsplit


import sqlite3 as lite
import struct, fcntl
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
                if action == 'saveConfig':
                    jscfg = args['newConfigJSON'][0]
                    print jscfg
                    config = json.loads(jscfg)
                    ConfigLoader.saveConfig(config)
                    return 'saved'
                if action == 'getFilesInPath':
                    path = args['path'][0]
                    if os.path.isdir(path):

                        files = os.listdir(path)
                        fdata=[]
                        for fpath in files:
                            if fpath.startswith('.'):
                                continue
                            thispath = os.path.join(path,fpath)
                            type = 'file'
                            if pathsplit.isapp(thispath):
                                type='app'
                            elif os.path.isdir(thispath):
                                type='dir'

                            readable = os.access(thispath,os.R_OK)
                            fdata.append({
                                'name':fpath,
                                'type':type,
                                'readable':readable
                            })
                        return json.dumps(fdata)
                    else:
                        return 'not a directory'
                if action == 'splitPath':
                    path = args['path'][0]

                    return json.dumps(pathsplit.os_path_split_asunder(path))


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
            request.setResponseCode(404)
            return 'Unknown command'

        return "I am request #" + str(self.numberRequests) + "\n"+request.uri

def start_listening():
    lockfile = open('.demon-43595', 'w')
    fcntl.flock(lockfile, fcntl.LOCK_EX | fcntl.LOCK_NB)


    reactor.listenTCP(43590, server.Site(HelloResource()))

def do_event_loop():
    reactor.run()


if __name__ == "__main__":
    start_listening()
    do_event_loop()
