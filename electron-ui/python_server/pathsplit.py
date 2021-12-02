#!/usr/bin/python

import os.path


# http://stackoverflow.com/questions/4579908/cross-platform-splitting-of-path-in-python
def os_path_split_asunder(fullpath, debug=False):
    drive, path = os.path.splitdrive(fullpath)
    parts = []
    if drive:
        parts.append(drive)
    while True:
        newpath, tail = os.path.split(path)
        if debug:
            print(repr(path), (newpath, tail))
        if newpath == path:
            assert not tail
            if path: parts.append(path)
            break
        parts.append(tail)
        path = newpath
    parts.reverse()
    return parts


def isapp(path):
    return os.path.isdir(path) and path.endswith('.app')


if __name__ == "__main__":
    print(os_path_split_asunder('/Volumes/Data/A Torrent Download'))
