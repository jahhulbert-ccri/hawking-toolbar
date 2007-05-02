/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Initial Developers of the Original Code are John Foushee, Andrew Hulbert,
 * and Brian Louden
 *
 * The current homepage for the FireHawk Toolbar and updates
 * http://code.google.com/p/hawking-toolbar/ 
 *
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
 
 /* addEvent
  * this function abstracts adding events to objects so if the method changes, it can be changes in a single place
  * simply adds an "on"+eventType event listener to element which calls the function lamdaFunction when triggered
  * useCapture specifies the style the event is captured, either bubbling up from the window through all the parents of the node
  * or capturing it the first moment it appears. For example if you wish to add function CaptureClick() as an onclick event  to node "obj"
  * call addEvent(obj, "click", CaptureClick, true); Note that you do NOT add parenthesis after CaptureClick because you are passing a
  * reference to the function, not calling it.
 */
function addEvent(element, eventType, lamdaFunction, useCapture) {
     if (element.addEventListener) {
        element.addEventListener(eventType, lamdaFunction, useCapture);
        return true;
    }
}

/* 
 * Should disable an event from propagating any further through the DOM
 * to trigger any other event listeners
 */
function knackerEvent(eventObject) {
    if (eventObject && eventObject.stopPropagation) {
        eventObject.stopPropagation();
    }
    if (window.event && window.event.cancelBubble ) {
        window.event.cancelBubble = true;
    }
    
    if (eventObject && eventObject.preventDefault) {
        eventObject.preventDefault();
    }
    if (window.event) {
        window.event.returnValue = false;
    }
    if(eventObject.preventCapture)
    	eventObject.preventCapture();
    if(eventObject.preventBubble)
    	eventObject.preventBubble();
}

/*
 * htbCountRealChildren(parent)
 * This function returns the number of non-text and nont-comment children it contains
 * this is necessary for the htbGetRealHighlight function to determine whether it should
 * pass the highlighter the object or look for a more appropriate object to highlight 
*/
function htbCountRealChildren(parent){
	var count = 0;
	if(parent && parent.childNodes){
		for(var i=0; i<parent.childNodes.length; i++){
			if(parent.childNodes[i].nodeName!="#text" && parent.childNodes[i].nodeName!="#comment")
				count++;
		}
	}
	return count;
}
/*
 * htbGetFirstRealChildren(parent)
 * This function returns the first non-text non-comment node in parent, usually used after
 * htbCountRealChildren(parent) to assist the htbGetRealHighlight function
*/
function htbGetFirstRealChild(parent){
	if(parent && parent.childNodes){
		for(var i=0; i<parent.childNodes.length; i++){
			if(parent.childNodes[i].nodeName!="#text" && parent.childNodes[i].nodeName!="#comment")
				return parent.childNodes[i];
		}
	}
	return false;
}

/**
 * htbDirectory class
 * This class serves as a directory class that can be created from a Firefox NsiFile object
 * to allow developers to get files and other directories with greater ease than the regular method
 * of enumerating and picking files.
 */
var htbDirectory = Class.create();
htbDirectory.prototype = {
	_nsiFile:false,
	
	/**
	 * initialize(nsiFile)
	 * override prototype function to initialize class
	 */
	
	initialize: function(nsiFile){
		if(nsiFile.isDirectory()){
			this._nsiFile=nsiFile;
		}
		//else alert("nsi file is not dir");
	},
	
	/**
	 * getNsiFile(fileName)
	 * takes a string filename and tries to find an Nsi File in the directory with the same name and extension provided
	 * and returns an Nsi File matching that name if it is found
	 */
	getNsiFile: function(fileName){
		if(!this._nsiFile){
			return false;
		}
		var file_enum=this._nsiFile.directoryEntries;
		while(file_enum.hasMoreElements()){
			var temp=file_enum.getNext().QueryInterface(Components.interfaces.nsIFile);
			if(temp.leafName==fileName){
				return temp;
			}
		}
		return false;
	},
	
	/**
	 * getHtbDirectory(dirName)
	 * searches for an NsiFile which is a directory with the same name as the inbound string and then creates a new instance
	 * of an HtbDirectory and returns it if it finds the nsi file with the same name
	 */
	getHtbDirectory: function(dirName){
		if(!this._nsiFile) return false;
		var file_enum=this._nsiFile.directoryEntries;
		while(file_enum.hasMoreElements()){
			var temp=file_enum.getNext().QueryInterface(Components.interfaces.nsIFile);
			if(temp.leafName==dirName && temp.isDirectory()){
				return new htbDirectory(temp);
			}
		}
		return false;
	},

	/**
	 * getName()
	 * returns the name of this htbDirectory
	 */
	getName: function(){
		if(!this._nsiFile) return false;
		return this._nsiFile.leafName;
	},
	
	/**
	 * getArrayOfFilesAsNsi()
	 * returns an array of Nsi Files that are files, not directories in the current htb directory
	 */
	getArrayOfFilesAsNsi: function(){
		if(!this._nsiFile) return false;
		var ret_array = new Array();
		var file_enum=this._nsiFile.directoryEntries;
		while(file_enum.hasMoreElements()){
			var temp=file_enum.getNext().QueryInterface(Components.interfaces.nsIFile);
			if(temp.isFile()){
				ret_array.push(temp);
			}
		}
		return ret_array;
	},
	
	/**
	 * getArrayOfDirsAsNsi()
	 * returns an array of directories as nsi files that are found in the current htb directory
	 */
	getArrayOfDirsAsNsi: function(){
		if(!this._nsiFile) return false;
		var ret_array = new Array();
		var file_enum=this._nsiFile.directoryEntries;
		while(file_enum.hasMoreElements()){
			var temp=file_enum.getNext().QueryInterface(Components.interfaces.nsIFile);
			if(temp.isDirectory()){
				ret_array.push(temp);
			}
		}
		return ret_array;
	},
	
	/**
	 * getArrayOfNsiFiles()
	 * returns all Nsi files (files and directories) found in the current htb directory
	 */
	getArrayOfNsiFiles: function(){
		if(!this._nsiFile) return false;
		var ret_array = new Array();
		var file_enum=this._nsiFile.directoryEntries;
		while(file_enum.hasMoreElements()){
			var temp=file_enum.getNext().QueryInterface(Components.interfaces.nsIFile);
			ret_array.push(temp);
		}
		return ret_array;
	},
	/*
	getArrayOfExt: function(ext,extLength){
		if(!this._nsiFile) return false;
		var ret_array = new Array();
		var file_enum=this._nsiFile.directoryEntries;
		while(file_enum.hasMoreElements()){
			var temp=file_enum.getNext().QueryInterface(Components.interfaces.nsIFile);
			var name=temp.leafName;
			var text=substring(temp.length-extLength,temp.length);
			alert(name);
			if(temp.substring(temp.length-extLength-1,temp.length-extLength)=="." && name==ext){
				ret_array.push(temp);
			}
		}
		return ret_array;
	}*/
	
	
}
