const htbPrefPrefix = "extensions.hawking.";

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
var classHawkingPane = {
	_pane: null,
	htbCapturing: false,
	htbCaptureWhich: "",
	htbCaptureTimeout: -1,
	//init function called by XUL file upon pane load
	//this will set up the window
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
		}
		catch(e){
//			alert(e.name+" - "+e.message);
		}
	},
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

	htbNothingCaptured: function (){
		alert("No event was captured");
		htbResetCapture();
	},

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

	htbDoneCapturing: function (){
		clearTimeout(htbCaptureTimeout);
		this.htbResetCapture();
	},


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
		document.getElementById("htbMoveButton").label = "Set 'Move' Action";
		document.getElementById("htbEngageButton").label = "Set 'Engage' Action";	
	},

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

/*
var htbCapturing = false;
var htbCaptureWhich = "";
var htbCaptureTimeout;

function htbSetCapturing(b){
	//b should be boolean
	htbCapturing = b;
}


function htbCaptureEventMove(ev){
	var ebut = document.getElementById("htbEngageButton");
	var mbut = document.getElementById("htbMoveButton");
	if(ebut.disabled || mbut.disabled) return;
	ebut.disabled =true;
	mbut.disabled =true;
	mbut.label = "Capturing Move...";
	knackerEvent(ev);
//	ev.preventDefault();
//	ev.stopPropagation();
	htbSetCapturing(true);
	htbCaptureWhich = "move";
	htbCaptureTimeout = setTimeout("htbNothingCaptured();", 5000);
	return false;
}
function htbCaptureEventEngage(ev){
	var ebut = document.getElementById("htbEngageButton");
	var mbut = document.getElementById("htbMoveButton");
	if(ebut.disabled || mbut.disabled) return;
	ebut.disabled =true;
	mbut.disabled =true;
	ebut.label = "Capturing Engage...";

	knackerEvent(ev);
//	ev.preventDefault();
//	ev.stopPropagation();
	htbSetCapturing(true);
	htbCaptureWhich = "engage";
	htbCaptureTimeout = setTimeout("htbNothingCaptured();", 5000);
	return false;
}

function htbNothingCaptured(){
	alert("No event was captured");
	htbResetCapture();
}


function htbCaptureEventPref(ev){
	if(!htbCapturing)return true;
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
			htbDoneCapturing();
			alert("You are already using this key");
			return false;
		}
		//they clicked. was it right/left?
		htbSetPref(prefClick, true, "Bool");
		htbSetPref(prefVal, button, "Int"); //usually 0 for left, 1 for middle, 2 for right
		htbDoneCapturing();
		return false;
	}
	else if(etype=="keydown"){
		//this should be the only other kind, but just in case...
		//now figure out which button was pressed (don't worry about shift/ctrl)
		var key = ev.which;
		if(!otherClick && key==otherVal){
			//trying to set it as the same preference, do not allow!
			htbDoneCapturing();
			alert("You are already using this key");
			return false;
		}
		htbSetPref(prefClick, false, "Bool");
		htbSetPref(prefVal, key, "Int"); //store keycode of key pressed
		htbDoneCapturing();
		return false;
	}
	return true;
}

function htbDoneCapturing(){
	clearTimeout(htbCaptureTimeout);
	htbResetCapture();
}
//htbSetPref("name", "value", "type");
//htbGetPref("name")

function htbResetCapture(){
	htbSetCapturing(false);//done capturing
	var isMove = (htbCaptureWhich=="move");
	htbCaptureWhich = "";
	var trans = htbTranslateAction(isMove);
	if(isMove && $("VisualMoveEvent")){
		$("VisualMoveEvent").value = trans;
	}
	else if(!isMove && $("VisualEngageEvent")){
		$("VisualEngageEvent").value = trans;
	}
	document.getElementById("htbEngageButton").disabled =false;
	document.getElementById("htbMoveButton").disabled =false;
	document.getElementById("htbMoveButton").label = "Set 'Move' Action";
	document.getElementById("htbEngageButton").label = "Set 'Engage' Action";	
}

function htbTranslateAction(isMove){
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
		if(val==""){
			if(isMove)
				val = 65; //A
			else
				val = 76; //L
		}
		translated = String.fromCharCode(val);
	}	
	return translated;
}

function htbFillActions(){
	var trans = htbTranslateAction(true);
	if($("VisualMoveEvent")){
		$("VisualMoveEvent").value = trans;
	}
	trans = htbTranslateAction(false);
	if($("VisualEngageEvent")){
		$("VisualEngageEvent").value = trans;
	}
}*/