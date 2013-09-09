#!/usr/bin/python

import ConfigParser
Config = ConfigParser.ConfigParser()
Config
Config.read("jooblerconfig.ini")
for section in Config.sections():
    print section+':'
    for option in Config.options(section):
        print '\t'+option+':'+Config.get(section,option)

