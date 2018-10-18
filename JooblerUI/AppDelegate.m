//
//  AppDelegate.m
//  JooblerUI
//
//  Created by Kevin Baragona on 10/6/13.
//  Copyright (c) 2013 __MyCompanyName__. All rights reserved.
//

#import "AppDelegate.h"
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>

#include <python2.7/Python.h>
#include <pthread.h>

@implementation AppDelegate

@synthesize window = _window;
@synthesize webview = _webview;

id embedded_browser;

pthread_mutex_t mutex1 = PTHREAD_MUTEX_INITIALIZER;
void start_python(void * data);

void start_python(void * data){
    PyObject *pName, *pModule, *pDict, *pFunc;
    Py_SetProgramName("joobler-python");  /* optional but recommended */

    // Initialize the Python Interpreter
    Py_Initialize();
    //char * blah;
    //PySys_SetArgv(0, &blah); // must call this to get sys.argv and relative imports
    PyRun_SimpleString("import sys");
    PyRun_SimpleString("import os");
    PyRun_SimpleString("from os.path import expanduser");
    PyRun_SimpleString("os.chdir(expanduser('~')+'/Joobler')");

    PyRun_SimpleString("sys.path.append(expanduser('~')+'/Joobler')");
    // Build the name object
    pName = PyString_FromString("demon");

    // Load the module object
    pModule = PyImport_Import(pName);
    if(!pModule){
        fprintf(stderr, "Cant import demon\n");
        return;
    }
    // pDict is a borrowed reference 
    pDict = PyModule_GetDict(pModule);
    if(!pModule){
        fprintf(stderr, "Cant get Dict from module\n");
        return;
    }

    // pFunc is also a borrowed reference 
    pFunc = PyDict_GetItemString(pDict, "start_listening");
    if(!pFunc){
        fprintf(stderr, "Cant get start_listening() from dict\n");
        return;
    }
    if (PyCallable_Check(pFunc)) 
    {
        PyObject_CallObject(pFunc, NULL);
    } else 
    {
        PyErr_Print();
        return;
    }
    
    
    pthread_mutex_unlock( &mutex1 );
    
    
    pFunc = PyDict_GetItemString(pDict, "do_event_loop");
    if(!pFunc){
        fprintf(stderr, "Cant get do_event_loop from dict\n");
        return;
    }
    if (PyCallable_Check(pFunc)) 
    {
        PyObject_CallObject(pFunc, NULL);
    } else 
    {
        PyErr_Print();
        return;
    }
    
}

- (void)dealloc
{
    [super dealloc];
}

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
    // Insert code here to initialize your application
    /*
    NSLog([NSString stringWithFormat:@"%@/%@",NSHomeDirectory(),@"Joobler/demon.py" ]);
    setsid();
    if(chdir([[NSString stringWithFormat:@"%@/%@",NSHomeDirectory(),@"Joobler" ] cStringUsingEncoding:NSUTF8StringEncoding])){
        exit(errno);
    }
    //[NSTask launchedTaskWithLaunchPath:@"demon.py"   arguments:@[]];
    
    //system([[NSString stringWithFormat:@"%@/%@",NSHomeDirectory(),@"Joobler/demon.py" ] cStringUsingEncoding:NSUTF8StringEncoding]);
    


    */
    
    

    embedded_browser = _webview;
    pthread_mutex_lock( &mutex1 );
    pthread_t thread1;  /* thread variables */
    pthread_create (&thread1, NULL, (void *) &start_python, (void *) NULL);
    
    pthread_mutex_lock( &mutex1 );
    pthread_mutex_unlock( &mutex1 );
    
    
    //usleep(250000);
    [embedded_browser setMainFrameURL:@"http://localhost:43590/joobler.html"];
    //start_python();
    
    
}

- (void)trigger_embedded_browser
{
    
}



- (BOOL)applicationShouldHandleReopen:(NSApplication *)theApplication hasVisibleWindows:(BOOL)flag{
    [_window makeKeyAndOrderFront:self];
    return NO;
}

@end
