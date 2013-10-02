#!/usr/bin/python

import sqlite3 as lite
def connect():
        return lite.connect('joobler.db')


def dict_from_row(row):
    return dict(zip(row.keys(), row))
    
