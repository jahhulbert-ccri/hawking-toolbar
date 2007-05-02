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
 
 // prefix for hawking toolbar preferences in mozilla pref service
const htbPrefPrefix = "extensions.hawking.";

/**
 *
 *
 */
function htbSetPref(name,value,type){
	if(!this.prefs){
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		if(!this.prefs) return;
	}
	if(type=='Int')
		this.prefs.setIntPref(htbPrefPrefix+name,value);
	else if(type=='Bool')
		this.prefs.setBoolPref(htbPrefPrefix+name,value);
	else if(type=='Char')
		this.prefs.setCharPref(htbPrefPrefix+name,value);
}

/**
 *
 *
 */
function htbGetPref(name){
	var prefix = htbPrefPrefix;
	if(!this.prefs){
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		if(!this.prefs) return "";
	}
	var gotten = "";
	if (this.prefs.getPrefType(prefix+name) == this.prefs.PREF_STRING){
		gotten = this.prefs.getCharPref(prefix+name);
	}
	else if (this.prefs.getPrefType(prefix+name) == this.prefs.PREF_BOOL){
		gotten = this.prefs.getBoolPref(prefix+name);
	}
	else if (this.prefs.getPrefType(prefix+name) == this.prefs.PREF_INT){
		gotten = this.prefs.getIntPref(prefix+name);
	}
	return gotten;
}

//@line 38 "/cygdrive/c/builds/tinderbox/Fx-Mozilla1.8-release/WINNT_5.2_Depend/mozilla/browser/components/preferences/security.js"
//this contains the functionality of the preferences pane
/**
 * classHawkingPane
 * hawking pane class which is the preferences pane in tools->options in firefox
 * contains the functionality of the preferences pane
 */
var classHawkingPane = {
	_pane: null,
	htbCapturing: false,
	htbCaptureWhich: "",
	htbCaptureTimeout: -1,
	
	/**
	 * init()
	 * called by xul file upon pane load, sets up the pane window
	 */
	init : function() {
		try{
			this._pane = document.getElementById("paneHawking");
			//this._populatePrefPane();
			this.htbFillActions();
			pwindow = $("BrowserPreferences");
			if(pwindow){
				addEvent(pwindow, "click", classHawkingPane.htbCaptureEventPref, false);
				addEvent(pwindow, "keydown", classHawkingPane.htbCaptureEventPref, false);
			}
			this.htbWriteSoundOptions("soundNext");
			this.htbWriteSoundOptions("soundPrev");
			this.htbWriteSoundOptions("soundClick");
		}
		catch(e){
//			alert(e.name+" - "+e.message);
		}
	},
	
	/**
	 * htbGetSoundFiles()
	 * gets sound files from the sounds directory and returns them as an array
	 */
	htbGetSoundFiles: function(){
		try{
			const id = "HawkingBar@google.com";
			var ext = Components.classes["@mozilla.org/extensions/manager;1"]
		                    .getService(Components.interfaces.nsIExtensionManager)
		                    .getInstallLocation(id)
		                    .getItemLocation(id);
							
			var ext_dir = new htbDirectory(ext);
			
			var sound_dir = ext_dir.getHtbDirectory("chrome").getHtbDirectory("content").getHtbDirectory("sounds");
			//alert(sound_dir.getName());

			var files = new Array();
			files = sound_dir.getArrayOfFilesAsNsi();
			
			/*var fileNames="";
			for(var x=0; x<files.length;x++){
				fileNames += files[x].leafName;
				fileNames+=",";
			}
			alert(fileNames);*/
			
			return files;
		}
		catch(e){FireHawk.htbAlert(e);}
	},
	
	/**
	 * htbWriteSoundOptions(menuListId)
	 * function writes sound choices from the sound directory
	 * so that users can choice different sounds for actions
	 */
	htbWriteSoundOptions: function(menuListId){
			var menuList = document.getElementById(menuListId);
			if(!menuList) {
				//alert('not found');
				return;
			}
			try{
				
				var files = this.htbGetSoundFiles();
				for(var x=0; x<files.length; x++){
					label = value = files[x].leafName;
					menuList.appendItem(label, value, "");
					//alert(label);
				}
				var pref = htbGetPref(menuListId);
				//alert(pref);
				menuList.value=pref;
			}
			catch(e){FireHawk.htbAlert(e);}
	},
	
	/**
	 * htbCaptureEventMove(ev)
	 * function captures the move event when called by htbCaptureEventPref()
	 */
	htbCaptureEventMove: function (ev){
		knackerEvent(ev);
		var ebut = document.getElementById("htbEngageButton");
		var mbut = document.getElementById("htbMoveButton");
		if(ebut.disabled || mbut.disabled)
			return;
		ebut.disabled =true;
		mbut.disabled =true;
		mbut.label = "Capturing Move...";
		htbCapturing = true;
		htbCaptureWhich = "move";
		htbCaptureTimeout = setTimeout("classHawkingPane.htbNothingCaptured();", 5000);
		return false;
	},
	
	/**
	 * htbCaptureEventEngage(ev)
	 * function captures the event when the user tries to set the engage event
	 * called by htbCaptureEventPref()
	 */
	htbCaptureEventEngage: function (ev){
		knackerEvent(ev);
		var ebut = document.getElementById("htbEngageButton");
		var mbut = document.getElementById("htbMoveButton");
		if(ebut.disabled || mbut.disabled) return;
		ebut.disabled =true;
		mbut.disabled =true;
		ebut.label = "Capturing Engage...";
		htbCapturing = true;
		htbCaptureWhich = "engage";
		htbCaptureTimeout = setTimeout("classHawkingPane.htbNothingCaptured();", 5000);
		return false;
	},

	/**
	 * htbNothingCaptured()
	 * alerts user if no event was captured while trying to set move or engage events in prefs
	 */
	htbNothingCaptured: function (){
		alert("No event was captured");
		htbResetCapture();
	},

	/**
	 * htbCaptureEventPref(ev)
	 * function first called when trying to set up an event...called by xul buttons
	 */
	htbCaptureEventPref: function (ev){
		if(!htbCapturing)
			return true;

		var act = "";
		var prefClick; //moveAct, engageAct (either true for a click or false for a keypress)
		var prefVal; //moveVal, engageVal (either the button number, or the keycode)
		var otherClick;
		var otherVal;
		if(htbCaptureWhich=="move"){
			prefClick = "moveAct";
			prefVal = "moveVal";
			otherClick = "engageAct";
			otherVal = "engageVal";
		}
		else if(htbCaptureWhich=="engage"){
			prefClick = "engageAct";
			prefVal = "engageVal";
			otherClick = "moveAct";
			otherVal = "moveVal";
		}
		else{
			return true;
		}
		knackerEvent(ev);

		otherClick = htbGetPref(otherClick);
		otherVal = htbGetPref(otherVal);
		var etype = ev.type;//either 'click' or 'keydown'
		if(etype=="click"){
			var button = ev.button;
			if(otherClick && button==otherVal){
				//trying to set it as the same preference, do not allow!
				classHawkingPane.htbDoneCapturing();
				alert("You are already using this key");
				return false;
			}
			//they clicked. was it right/left?
			htbSetPref(prefClick, true, "Bool");
			htbSetPref(prefVal, button, "Int"); //usually 0 for left, 1 for middle, 2 for right
			classHawkingPane.htbDoneCapturing();
			return false;
		}
		else if(etype=="keydown"){
			//this should be the only other kind, but just in case...
			//now figure out which button was pressed (don't worry about shift/ctrl)
			var key = ev.which;
			if(!otherClick && key==otherVal){
				//trying to set it as the same preference, do not allow!
				classHawkingPane.htbDoneCapturing();
				alert("You are already using this key");
				return false;
			}
			htbSetPref(prefClick, false, "Bool");
			htbSetPref(prefVal, key, "Int"); //store keycode of key pressed
			classHawkingPane.htbDoneCapturing();
			return false;
		}
		return true;
	},

	/**
	 * htbDoneCapturing()
	 * called after done capturing events
	 */
	htbDoneCapturing: function (){
		clearTimeout(htbCaptureTimeout);
		this.htbResetCapture();
	},

	/**
	 * htbResetCapture()
	 * resets all fields after capturing including button values and xul layout and stops capturing
	 */
	htbResetCapture: function (){
		htbCapturing = false;//done capturing
		var isMove = (htbCaptureWhich=="move");
		htbCaptureWhich = "";
		var trans = this.htbTranslateAction(isMove);
		if(isMove && $("VisualMoveEvent")){
			$("VisualMoveEvent").value = trans;
		}
		else if(!isMove && $("VisualEngageEvent")){
			$("VisualEngageEvent").value = trans;
		}
		document.getElementById("htbEngageButton").disabled =false;
		document.getElementById("htbMoveButton").disabled =false;
		document.getElementById("htbMoveButton").label = "Click Here To Set 'Move' Action";
		document.getElementById("htbEngageButton").label = "Click Here To Set 'Engage' Action";	
	},
	
	/**
	 * htbTranslateAction(isMove)
	 * translates the preferences into a description of what move and engage currently are
	 * to fill into the text box in the xul file
	 */
	htbTranslateAction: function (isMove){
		//this function should tranlate the preferences into a 
		//description of what the move and engage actions are currently set at
		var prefClick; //true if it was a mouseclick, false if keyboard
		var prefVal; //value of the action event
		var translated = "";
		if(isMove){
			prefClick = "moveAct";
			prefVal = "moveVal";
		}
		else{
			prefClick = "engageAct";
			prefVal = "engageVal";
		}
		var isClick = htbGetPref(prefClick); //boolean
		var val = htbGetPref(prefVal); //integer value
		if(isClick){
			if(val==0)
				translated = "Left Click";
			else if(val==1)
				translated = "Middle Click";
			else if(val==2)
				translated = "Right Click";
			else
				translated = "Unknown Click";
		}
		else{
//			if(val==""){
//				if(isMove)
//					val = 65; //A
//				else
//					val = 76; //L
//			}
			translated = String.fromCharCode(val);
		}	
		return translated;
	},

	/**
	 * htbFillActions()
	 * fills the text box with a visual representation of the event captured
	 */
	htbFillActions: function (){
		var trans = this.htbTranslateAction(true);
		if($("VisualMoveEvent")){
			$("VisualMoveEvent").value = trans;
		}
		trans = this.htbTranslateAction(false);
		if($("VisualEngageEvent")){
			$("VisualEngageEvent").value = trans;
		}
	}
};
