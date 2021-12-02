#!/usr/bin/python

import fcntl
import json
import os
import re
import sqlite3 as lite
import subprocess

from twisted.internet import reactor
from twisted.web import server, resource

import ConfigLoader
import dbaccess
import pathsplit


class HelloResource(resource.Resource):
    isLeaf = True
    numberRequests = 0

    def render_GET(self, request):
        self.numberRequests += 1
        request.setHeader("content-type", "text/plain")
        request.setHeader("Access-Control-Allow-Origin","*")

        args = request.args
        print(request.path)

        filepath = re.sub(rb'^/',b'',request.path).decode('utf-8')
        print(filepath)
        if request.path == b'/do':
            if b'action' in args:
                action = args[b'action'][0].decode('utf-8')
                print(action)
                if action == 'getLibrary':

                    con = dbaccess.connect()
                    con.row_factory = lite.Row
                    cur = con.cursor()
                    cur.execute("select * from library")
                    rows = list(map(dbaccess.dict_from_row,cur.fetchall()))
                    return json.dumps(rows).encode('utf-8')
                if action == 'openFile':
                    fileId=int(args[b'fileId'][0].decode('utf-8'))
                    con = dbaccess.connect()
                    cur = con.cursor()
                    cur.execute("select path from library where id = ?",[fileId])
                    path=cur.fetchone()[0]
                    result=subprocess.check_output(['open','-a',ConfigLoader.getConfig()['openVideosWith'],path])
                    return 'opened'
                if action == 'getConfigSchemaJSON':
                    return ConfigLoader.getConfigSchemaJSON().encode('utf-8')
                if action == 'saveConfig':
                    jscfg = args[b'newConfigJSON'][0]
                    print(jscfg)
                    config = json.loads(jscfg)
                    ConfigLoader.saveConfig(config)
                    return b'saved'
                if action == 'getFilesInPath':
                    path = args[b'path'][0].decode('utf-8')
                    if os.path.isdir(path):

                        files = os.listdir(path)
                        fdata=[]
                        for fpath in files:
                            fpath = fpath
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
                        return json.dumps(fdata).encode('utf-8')
                    else:
                        return b'not a directory'
                if action == 'splitPath':
                    path = args[b'path'][0]

                    return json.dumps(pathsplit.os_path_split_asunder(path)).encode('utf-8')


                else:
                    return b'WTF'
            else:
                return b'{}'
        else:
            request.setResponseCode(404)
            return b'Unknown command'

def start_listening():
    lockfile = open('.demon-43595', 'w')
    fcntl.flock(lockfile, fcntl.LOCK_EX | fcntl.LOCK_NB)


    reactor.listenTCP(43590, server.Site(HelloResource()))

def do_event_loop():
    reactor.run()


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.realpath(__file__)))

    start_listening()
    do_event_loop()
