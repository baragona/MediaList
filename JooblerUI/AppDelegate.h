//
//  AppDelegate.h
//  JooblerUI
//
//  Created by Kevin Baragona on 10/6/13.
//  Copyright (c) 2013 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>

#import <Webkit/WKWebView.h>

@interface AppDelegate : NSObject <NSApplicationDelegate>

@property (assign) IBOutlet NSWindow *window;

@property (assign) IBOutlet WKWebView *webview;

@end
