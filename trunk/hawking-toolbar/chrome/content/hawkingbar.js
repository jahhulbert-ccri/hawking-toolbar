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
 * The Initial Developer of the Original Code is Parakey Inc.
 *
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *     Joe Hewitt <joe@joehewitt.com>
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

 
 //variables
var ContextManager = null;
var Highlighter = null;
addEvent(window, "load", HawkingTrackerSetup, true);
var DEFAULT_MOVE_EVENT = "A";
var DEFAULT_ENGAGE_EVENT="L";

//default scroll varaibles
var DEFAULT_VERTICAL_SCROLL = 200;
var DEFAULT_HORIZONTAL_SCROLL = 200;
 
//this is probably the better way to go.
function HawkingToolbarTracker(toolbar){
	//this function should be called on window load. It should assign
	//the first element in the context array to the toolbar document.getElementById('HawkingBar-Toolbar')
	//and it should initialize the index to -1
	if(!toolbar){
		alert("ERROR: Unable to locate the Hawking Toolbar in firefox");
		return;
	}
	this.ContextArray = [new ContextList(toolbar)];//essentially a stack
				//we only look at the top (end) ContextList
	this.ExitContext = function(){
		//this removes the top context
		if(this.ContextArray<=1){
			//we are at the basic toolbar level, exiting here would leave us with nothing
			//this should never come up (our toolbar shouldn't have an 'x' but just in case...
			return;
		}
		htbButtonBlur(this.getContext().getCurrent());
		this.ContextArray.pop(); //removes the last array entry
		htbButtonHover(this.getContext().getCurrent()); //back to where we used to be
	}
	this.EnterContext = function(ncon){
		//this adds a new context 'ncon' to the end of ContextArray
		htbButtonBlur(this.getContext().getCurrent());
		this.ContextArray.push(new ContextList(ncon));
		htbButtonHover(this.getContext().getCurrent());
	}
	this.next = function(){
		//moves to next clickable
		htbButtonBlur(this.getContext().getCurrent());
		this.getContext().next();
		htbButtonHover(this.getContext().getCurrent());
	}
	this.prev = function(){
		//moves to previous clickable
		htbButtonBlur(this.getContext().getCurrent());
		this.getContext().prev();
		htbButtonHover(this.getContext().getCurrent());
	}
	this.getCurrent = function(){
	   //returns the current clickable in the current scope
	   //or null if nothing
		return this.getContext().getCurrent();
	}
	this.getContext = function(){
    //this returns the current context pointed to
    return this.ContextArray[this.ContextArray.length-1];
  }
}

function ContextList(root){
	//this object should store 
	this.ContextRoot = root;
	this.WindowLocation = "about:blank"; //window location of this context
	this.ContextLinks = []; //array of all links in this context
	this.ContextPosition = -1;  //where we are in this array
}
ContextList.prototype.getCurrent = function(){
  //returns the clickable currently pointed to (and highlighted)
//	if(this.ContextRoot.hidden)
//		this.ContextRoot.hidden = false;
	if(this.ContextLinks.length==0 || this.ContextPosition<0)
		this.Setup();
	return this.ContextLinks[this.ContextPosition];
}

ContextList.prototype.next = function(){
  //moves pointer to the next clickable and highlights, returns nothing
	if(this.ContextLinks.length==0 || this.ContextPosition<0 || this.ContextPosition>this.ContextLinks.length){
		this.Setup();
		this.ContextPosition = this.ContextLinks.length; //sets it to one past the end.
//		alert("done with setup "+this.ContextLinks.length);
	}
//	else{
		var iterations = 0;
		do{
			if(iterations>this.ContextLinks.length)
				break;
			iterations++;
  			this.ContextPosition++;
  			if(this.ContextPosition>=this.ContextLinks.length)
  		  	this.ContextPosition = 0;
		}
		while(!ObjectIsVisible(this.getCurrent()));
//	}
}
ContextList.prototype.prev = function(){
  //move pointer to previous clickable
	if(this.ContextLinks.length==0 || this.ContextPosition<0){
		this.Setup();
		this.ContextPosition = 1;
	}
//	else{
		var iterations = 0;
		do{
			if(iterations>this.ContextLinks.length)
				break;
			iterations++;
  			this.ContextPosition--;
  			if(this.ContextPosition<0)
  		  		this.ContextPosition = this.ContextLinks.length-1;
  		}while(!ObjectIsVisible(this.getCurrent()));
//	}
}
ContextList.prototype.Setup = function(){
  //find all the clickables in this.ContextRoot to this.ContextLinks
  //and sets this.ContextPosition = 0
  this.WindowLocation=window.content.document.location;
  this.ContextLinks = []; //clears out the old array
  FindLinks(this.ContextRoot, this.ContextLinks);
  this.ContextPosition = 0;
}

function FindLinks(node, arr){
	//if there is nothing in this node, it doesn't exist, or has no children
	//firefox randomly adds #text nodes into the dom which don't have any attributes
	//and in fact cause a "getAttribute" to fail if called on it
	//for this reason, if we see a #text or #comment get out
	if(!node || node.nodeName=="#text" || node.nodeName=="#comment"){
		return;
	}
	/*
		We should look for the following:
			<a> tags with href attribute defined
			any node with an onclick event attatched
			<input> tags with type="submit"
	*/
	if((node.nodeName=="A" && node.getAttribute('href')) || node.getAttribute('onclick') || node.getAttribute('oncommand') || (node.nodeName=="INPUT" && node.getAttribute("type") && node.getAttribute("type")=="submit")){
		arr.push(node);
//		alert("this node is valid: "+node.nodeName);
//		return;
	}
/*	else{
	 try{
      if(typeof node.onclick =='function')
	     arr.push(node);
	 }
	 catch(e){}
	}
*/
	//check inside  frames and iframes
  if(node.nodeName=="FRAME" || node.nodeName=="IFRAME"){
    try{
      FindLinks(node.contentDocument.getElementsByTagName("body")[0], arr);
    }
    catch(exception){
      //sometimes weird stuff happens, nothing we can do, just skip whatever was in that iframe
    }
//    alert("made it");
    return;
  }
	
	//check for images or event captures later
	if(!node.childNodes || node.childNodes.length==0){
		//it has no children, and isn't itself clickable, so return;
		return;
	}
	//it has child nodes we should now check
	for(var i=0; i<node.childNodes.length; i++){
		FindLinks(node.childNodes[i], arr);
	}
}


//used to be called on page load		htbButtonHover(ContextManager.getCurrent());
//this is the setup function which determines how the toolbar starts up
function HawkingTrackerSetup(){
	var tb = document.getElementById("HawkingToolBar");
	if(!tb){
		setTimeout("HawkingTrackerSetup()", 1000); //not ready, wait 1 second
		return;
	}
	//this should only be called once
	this.done = true;
	ContextManager = new HawkingToolbarTracker(tb);
	Highlighter = new htbHighlighter();
	htbButtonHover(ContextManager.getCurrent());

	var mode = htbGetPref("autoMode");
	if(mode){
		htbEnableAuto();
	}
	//transforms window events into move and engage
	var simple = htbGetPref("literacybar");
	if(simple){
		//simple toolbar, hide the htb
		tb.hidden = true;
		//show the subbar for the literacy center simple toolbar
		var literacyTB = document.getElementById("HawkingSBLiteracy");
		if(literacyTB) {
			literacyTB.hidden = false;		
		}
		//set attribute
		var mItem = document.getElementById("htbLiteracyMenuItem");
		if(mItem)
			mItem.setAttribute("checked", "true");
	}
	addEvent(window, "keydown", htbActionTransform, true);
	addEvent(window, "click", htbActionTransform, true);
	//removes the event from window.onload so it is not called every time
	window.removeEventListener("load", HawkingTrackerSetup, true);
}
function UnScope(){
	if(!ContextManager)
		return;
	ContextManager.getContext().ContextRoot.hidden = true;
	ContextManager.ExitContext();
	ContextManager.getContext().ContextRoot.hidden = false;
	ReLight(0);
}
function Scope(idstr){
	//takes in idstring, we'll document.getElementById it
	//and if it exists, we'll open scope
	var obj = document.getElementById(idstr);
	if(!obj)return;
	if(!ContextManager)
		return;
	ContextManager.getContext().ContextRoot.hidden = true;
	obj.hidden = false;
	ContextManager.EnterContext(obj);
	ReLight(0);
}
function ReLight(times){
	// this function focuses on the current
	// button many times in a row since it doesn't
	//
	htbButtonHover(ContextManager.getCurrent());
	if(times>5)
		return;
	setTimeout("ReLight("+parseInt(times+1)+")", 100);
}
//window.onkeydown = htbActionTransform;
function htbActionTransform(ev){
	//this function captures key presses
	//and translates them into clicks
	var dis = htbGetPref("disabled");
	if(dis==false){
		return true; //toolbar disabled, normal action allowed
	}

//	var ev = ev || window.event;
	if(!ev || ev.ignoreMe) return false;
//	alert("transforming action");
	if (htbIsEventClick(ev)) {
	//engage
		var simple = htbGetPref("literacybar");
		if(simple){
			HawkingPageClick();
		}
		else{
			ClickObject(ContextManager.getCurrent());
		}
		if(ev.preventDefault)
			ev.preventDefault();
		ev.stopPropagation();
		ev.returnValue = false;
		return false;
	}
	else if(htbIsEventMove(ev)){
	//move
		var simple = htbGetPref("literacybar");
		if(simple){
			HawkingPageNext();
		}
		else{
			ContextManager.next();
		}
		if(ev.preventDefault)
			ev.preventDefault();
		ev.stopPropagation();
		ev.returnValue = false;
		return false;
	}
	return true;
}

function htbIsEventMove(ev){
//takes in an event object and determines if it matches
//the move characteristic of an event
/*
	var moveEvent = htbGetPref("moveEvent");
	if(!moveEvent)
		moveEvent = DEFAULT_MOVE_EVENT;
	if(!ev || !ev.which) return false;
	return (String.fromCharCode(ev.which) == moveEvent);
*/
	var moveClick = htbGetPref("moveAct"); //true if click, false if keypress
	var moveVal = htbGetPref("moveVal"); //value of the action
	var etype = ev.type;//either 'click' or 'keydown'
	if(moveClick && etype=="click" && moveVal==ev.button){
		//they clicked. was it right/left?
		return true;
	}
	else if(!moveClick && etype=="keydown" && moveVal==ev.which){
		//this should be the only other kind, but just in case...
		//now figure out which button was pressed (don't worry about shift/ctrl)
		return true;
	}
	return false;
}

function htbIsEventClick(ev){
//takes in an event object and determines if it matches
//the click characteristic of an event
/*
	var engageEvent = htbGetPref("engageEvent");
	if(!engageEvent)
		engageEvent = DEFAULT_ENGAGE_EVENT;
	if(!ev || !ev.which) return false;
	return (String.fromCharCode(ev.which) == engageEvent);
*/
	var engageClick = htbGetPref("engageAct"); //true if click, false if keypress
	var engageVal = htbGetPref("engageVal"); //value of the action
	var etype = ev.type;//either 'click' or 'keydown'
	if(engageClick && etype=="click" && engageVal==ev.button){
		//they clicked. was it right/left?
		return true;
	}
	else if(!engageClick && etype=="keydown" && engageVal==ev.which){
		//this should be the only other kind, but just in case...
		//now figure out which button was pressed (don't worry about shift/ctrl)
		return true;
	}
	return false;
}

function ObjectIsVisible(obj){
//obj.style.display is not sufficient due to
//style sheets having display: none; properties
//which the .style function does not detect.
  if(!obj) return false;
  try{
  	while(obj){
      var disp = window.content.document.defaultView.getComputedStyle(obj, null).getPropertyValue("display");
      var vis = window.content.document.defaultView.getComputedStyle(obj, null).getPropertyValue("visibility");
      if(disp=="none" || vis=="hidden"){
        return false;
      }
  
      if(!obj.parentNode || obj.parentNode.nodeName=="HTML" || obj.parentNode.nodeName=="BODY"){
        break;
      }
      
      obj = obj.parentNode;
    }
  }
  catch(e){
    return false;
  }
  return true;
}

function ClickObject(object){
	//pass this function the object you want to click
	if(!object){
    		alert("you clicked, but i saw no object");
    		return;
  }
	if(object.getAttribute("oncommand")){
		object.doCommand();
	}
	else{
		var evObj = document.createEvent('MouseEvents');
		evObj.initEvent( "click", true, true );
		evObj.ignoreMe = true;
		object.dispatchEvent(evObj);
	}
}

function htbFindRealHighlight(obj){
	if(!obj){
		return null;
	}
  	if(obj.nodeName=="A"){
		if(obj.childNodes && htbCountRealChildren(obj)==1){
			var nobj = htbGetFirstRealChild(obj);
			if(nobj){// && nobj.nodeName=="IMG"){
	  			return nobj;
	  		}
	  	}
//		if(obj.parentNode && htbCountRealChildren(obj.parentNode)==1){
			/*  if the <a> is in something all by itself, highlight that instead;
			    this is to counteract the annoying "no-highlight" bug when we find an
			    <a> tag inside a <div> with an id so it appears as a clickable logo
			*/
//			return obj.parentNode;
//		}
	}
	return obj;
}


function Highlight(realObj){
	var obj = htbFindRealHighlight(realObj);
	if(!obj){
		alert("I tried to highlight, but you gave me nothing");
		return;
	}
	Highlighter.highlight(obj);
	/*
//  	alert("looking at: "+obj.nodeName);
	var oStyle = "";
	if(obj.style && obj.style.border)
		oStyle = obj.style.border;
	
	//get border color and width from preferences and set defaults in case of failure
	var borderColor = htbGetPref("borderHighlightColor");
	if(!borderColor)
		borderColor="#f00";
	var borderWidth = htbGetPref("borderHighlightWidth");
	if(!borderWidth)
		borderWidth="5";
	
	obj.style.border = "solid "+borderColor+" "+borderWidth+"px";
	obj.setAttribute("old_style", oStyle);
	//obj.focus();
	*/
	if(obj.scrollIntoView)
		obj.scrollIntoView();
}

function htbScrollToObj(obj){

	var screenHeight;
	var screenWidth;
	if(window.frameElement) {
		alert('frame element');
		screenHeight = window.frameElement.content.innerHeight;
		screenWidth = window.frameElement.content.innerWidth;
	}
	else {
		screenHeight = window.content.innerHeight;
		screenWidth = window.content.innerWidth;
	}
		
	var maxX = window.content.scrollMaxX;
	var maxY = window.content.scrollMaxY;
	
	var scrollToX;
	var scrollToY;
	
	if(obj.offsetTop && obj.offsetLeft) {
		//alert('in');
		var yPos = obj.offsetTop;
		var xPos = obj.offsetLeft;
		//if (obj.parentNode.nodeName=="LI")
			//alert('li found');
		
		//alert(maxX +','+maxY);
		scrollToX = xPos-(screenWidth/4);
		scrollToY = yPos-(screenHeight/4)
	}
	else{
	
		if(obj.scrollIntoView) {
			obj.scrollIntoView();
		}
		
		var scrolledX;
		var scrolledY;
		
		if(window.frameElement) {
			alert('frame element');
			scrolledX = window.frameElement.content.pageXOffset;
			scrolledY = window.frameElement.content.pageYOffset;
		}
		else {
			scrolledX = window.content.pageXOffset;
			scrolledY = window.content.pageYOffset;
		}
		
		//alert('scroll into view');
		
		
		scrollToX = scrolledX-(screenWidth/2);
		scrollToY = scrolledY-(screenHeight/2);

	}
	
	if(window.frameElement){
		window.frameElement.content.scrollTo(scrollToX,scrollToY);
	}
	else{
		window.content.scrollTo(scrollToX,scrollToY);
	}
}

function unHighlight(realObj){
	var obj = htbFindRealHighlight(realObj);
	if(!obj){ //nothing to unhighlight
		return;
	}
	Highlighter.unhighlight(obj);
/*
	var oStyle = "";
	if(obj.getAttribute("old_style"))
		oStyle = obj.getAttribute("old_style");
	if(obj.style && obj.style.border)
		obj.style.border = oStyle;
*/	
}


function HawkingBarGoHome(){
    window.content.document.location = "http://code.google.com/p/hawking-toolbar";
//    window.content.focus();
}
var PageContext = null;
function HawkingPageNext(){
	//first check if we have instantiated PageContext or if the PageContext's location
	//does not match the current page's location (they have since clicked a link and gone
	//to a new page)
	if(!PageContext || PageContext.WindowLocation!=window.content.document.location){
//		alert("page reset or new");
		PageContext = new ContextList(window.content.document.body);
	}
	else	
		unHighlight(PageContext.getCurrent());
	PageContext.next();
	Highlight(PageContext.getCurrent());
//	alert("looking at "+PageContext.getCurrent().nodeName);
//	alert("done");
}
function HawkingPagePrev(){
	//first check if we have instantiated PageContext or if the PageContext's location
	//does not match the current page's location (they have since clicked a link and gone
	//to a new page)
	if(!PageContext || PageContext.WindowLocation!=window.content.document.location){
//		alert("page reset or new");
		PageContext = new ContextList(window.content.document.body);
	}
	else
		unHighlight(PageContext.getCurrent());
	PageContext.prev();
	Highlight(PageContext.getCurrent());
//	alert("looking at "+PageContext.getCurrent().nodeName);
//	alert("done");
}
function HawkingPageClick(){
	ClickObject(PageContext.getCurrent());
}

function OpenPrefs(ev){
	alert("These are the preferences");
	return;
}

function htbScrollWindow(horizontal,vertical){
	window.content.scrollBy(horizontal,vertical);
}
function htbScrollDown(){
	var amt = htbGetPref('verticalScrollAmt')
	if(!amt) {
		amt = DEFAULT_VERTICAL_SCROLL;
	}
	htbScrollWindow(0,amt);
}

function htbScrollUp(){
	var amt = htbGetPref('verticalScrollAmt')
	if(!amt) {
		amt = DEFAULT_VERTICAL_SCROLL;
	}
	htbScrollWindow(0,(-1*amt));
}
function htbScrollLeft(){
	var amt = htbGetPref('horizontalScrollAmt')
	if(!amt) {
		amt = DEFAULT_HORIZONTAL_SCROLL;
	}
	htbScrollWindow((-1*amt),0);
}

function htbScrollRight(){
	var amt = htbGetPref('horizontalScrollAmt')
	if(!amt) {
		amt = DEFAULT_HORIZONTAL_SCROLL;
	}
	htbScrollWindow(amt,0);
}

function htbButtonHover(obj){
	if(!obj || !obj.style)
		return;
	obj.focus();
	obj.style.color = 'red';
	obj.className = "over";
}

function htbButtonBlur(obj){
	if(!obj || !obj.style)
		return;
	obj.style.color = 'black';
//	obj.style.listStyleImage = "url('chrome://hawkingbar/skin/close_n.png')";
	obj.className = "";
//	if(obj.getAttribute && obj.getAttribute("high"))
//		alert("changed to "+obj.getAttribute("high"));
}

function htbToggleCapture(){
	var dis = htbGetPref("disabled");
	var button = document.getElementById("HawkingBarPrefs");
	if(dis==true){
		htbSetPref("disabled", false, "Bool");
		if(button)
		button.label = "Enable";
		else
		alert("disabled");
	}
	else{
		htbSetPref("disabled", true, "Bool");
		if(button)
		button.label = "Disable";
		else
		alert("activated");
	}
}


function htbToggleLiteracy(){
	var lbar = htbGetPref("literacybar");
	var mItem = document.getElementById("htbLiteracyMenuItem");
	var tb = document.getElementById("HawkingToolBar");
	var literacyTB = document.getElementById("HawkingSBLiteracy");
	if(lbar){
		//go back to full feature set
		htbSetPref("literacybar", false, "Bool");
		if(tb)
			tb.hidden = false;
		if(mItem)
			mItem.setAttribute("checked", "false");
		if(literacyTB)
			literacyTB.hidden=true;
	}
	else{
		//reduce to literacy center feature
		htbSetPref("literacybar", true, "Bool");
		if(tb)
			tb.hidden = true;
		if(mItem)
			mItem.setAttribute("checked", "true");
		if(literacyTB)
			literacyTB.hidden=false;
	}
}


