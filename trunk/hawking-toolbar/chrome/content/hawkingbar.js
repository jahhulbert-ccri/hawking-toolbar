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
var SoundBlaster = null;
//calls the setup function once the browser has set up
addEvent(window, "load", HawkingTrackerSetup, true);

//default move/engage values
var DEFAULT_MOVE_EVENT = 65;
var DEFAULT_ENGAGE_EVENT=76;

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

ContextList.prototype = {
	getCurrent: function(){
		//returns the clickable currently pointed to (and highlighted)
		//	if(this.ContextRoot.hidden)
		//		this.ContextRoot.hidden = false;
		if(this.ContextLinks.length==0 || this.ContextPosition<0)
			this.Setup();
		return this.ContextLinks[this.ContextPosition];
	},	
	next: function(){
		//moves pointer to the next clickable and highlights, returns nothing
		if(this.ContextLinks.length==0 || this.ContextPosition<0 || this.ContextPosition>this.ContextLinks.length){
			this.Setup();
			this.ContextPosition = this.ContextLinks.length; //sets it to one past the end.
		}
		var iterations = 0;
		do{
			if(iterations>this.ContextLinks.length)
				break;
			iterations++;
	  		this.ContextPosition++;
	  		if(this.ContextPosition>=this.ContextLinks.length)
				this.ContextPosition = 0;
		}while(!ObjectIsVisible(this.getCurrent()));
	},
	prev: function(){
		//move pointer to previous clickable
		if(this.ContextLinks.length==0 || this.ContextPosition<0){
			this.Setup();
			this.ContextPosition = 1;
		}
		var iterations = 0;
		do{
			if(iterations>this.ContextLinks.length)
				break;
			iterations++;
	  		this.ContextPosition--;
	  		if(this.ContextPosition<0)
	  		  	this.ContextPosition = this.ContextLinks.length-1;
	  	}while(!ObjectIsVisible(this.getCurrent()));
	},
	Setup: function(){
	  //find all the clickables in this.ContextRoot to this.ContextLinks
	  //and sets this.ContextPosition = 0
	  this.WindowLocation=window.content.document.location;
	  this.ContextLinks = []; //clears out the old array
	  this.FindLinks(this.ContextRoot, this.ContextLinks);
	  this.ContextPosition = 0;
	},
	
	/*
	 * FindLinks(node, arr)
	 * This function looks through the dom starting at the node given to it
	 * and recursively fills the array "arr" with nodes which satisfy the
	 * "clickable" criteria specified within. There are still a few
	 * bugs to be worked out with regard to javascript assigned "onclick" events
	 * This will detect <a href> tags, <input> and <submit> tags, or any node with
	 * an "onclick=" or "oncommand=" attribute. It will NOT detect elements which
	 * are given onclick functions by javascript as this does not appear in the 
	 * "onclick" attribute of the node. As of right now, we know of no way to
	 * test for such a function. Commented out within is an attempt which does not work.
	 */
	FindLinks: function (node, arr){
		//if there is nothing in this node, it doesn't exist, or has no children
		//firefox randomly adds #text nodes into the dom which don't have any attributes
		//and in fact cause a "getAttribute" to fail. if we see a #text or #comment get out
		if(!node || node.nodeName=="#text" || node.nodeName=="#comment"){
			return;
		}
		/* 
		 * We should look for the following:
		 * <a> tags with href attribute defined
		 * any node with an onclick event attatched
		 * <input> tags with type="submit" or "button"
		 */
		if((node.nodeName=="A" && node.getAttribute('href')) || node.getAttribute('onclick') || node.getAttribute('oncommand') || (node.nodeName=="INPUT" && node.getAttribute("type") && node.getAttribute("type")=="submit")){
			arr.push(node);
			//return; //should we quit after the first clickable thing we find?
		}
		/*
		 * this is trying to discover javascript assigned onclick events
		 * it does not succeed however.
		else{
			try{
				if(typeof node.onclick =='function'){
					alert("Has a javascript function: "+node.nodeName)
					arr.push(node);
				}
			 }
		 catch(e){}
		}
		*/
		//check inside  frames and iframes
		if(node.nodeName=="FRAME" || node.nodeName=="IFRAME"){
			try{
				this.FindLinks(node.contentDocument.getElementsByTagName("body")[0], arr);
			}catch(exception){}
			//sometimes weird stuff happens, nothing we can do, just skip whatever was in that iframe
			return;
		}
		
		//check for images or event captures later
		if(!node.childNodes || node.childNodes.length==0){
			//it has no children, and isn't itself clickable, so return;
			return;
		}
		//it has child nodes we should now check
		for(var i=0; i<node.childNodes.length; i++){
			this.FindLinks(node.childNodes[i], arr);
		}//end of for loop
	}//end of findlinks
}

/*
 * HawkingTrackerSetup()
 * this is the setup function which determines how the toolbar starts up
 * based on preferences. It disables the toolbar if that is set, it
 * sets up in Literacy Mode if needed, etc.
 */
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
	SoundBlaster = new htbSoundManager();
	htbButtonHover(ContextManager.getCurrent());
	if(htbGetPref("StartAsOff")){
		//if the always start as off setting is on, set disabled
		htbSetPref("disabled", false, "Bool");
	}
	var dis = htbGetPref("disabled");
	var button = document.getElementById("HawkingToggleActivity");
	if(button){
		if(dis)
			button.label = "Disable Hawking Toolbar";
		else
			button.label = "Enable Hawking Toolbar";
	}

	var mode = htbGetPref("autoMode");
	if(mode){
		htbEnableAuto();
	}
	//transforms window events into move and engage
	var simple = htbGetPref("literacybar");
	if(simple){
		//show the subbar for the literacy center simple toolbar
		Scope("HawkingSBLiteracy");
		//set attribute
		var mItem = document.getElementById("htbLiteracyMenuItem");
		if(mItem)
			mItem.setAttribute("checked", "true");
	}
	addEvent(window, "keydown", htbActionTransform, true);
	addEvent(window, "click", htbActionTransform, true);
	//removes the event from window.onload so it is not called every time
	window.removeEventListener("load", HawkingTrackerSetup, true);
	addEvent(window, "load", htbResetPageContext, true); //reloads the context every time a new page loads
}

/*
 * UnScope()
 * This function should take care of leaving the toolbar you're in
 * so the toolbars you're leaving are hidden appropriately, and
 * your previous toolbar's status is restored.
 */
function UnScope(){
	if(!ContextManager)
		return;
	ContextManager.getContext().ContextRoot.hidden = true;
	ContextManager.ExitContext();
	ContextManager.getContext().ContextRoot.hidden = false;
	ReLight();
}
/*
 * Scope(idstr)
 * This function takes care of moving into a subtoolbar, hiding the parent
 * toolbar and showing the new one you wish to enter.
 */
function Scope(idstr){
	//takes in idstring, we'll document.getElementById it
	//and if it exists, we'll open scope
	var obj = $(idstr); //$ used to be document.getElementById
	if(!obj)return;
	if(!ContextManager)
		return;
	ContextManager.getContext().ContextRoot.hidden = true;
	obj.hidden = false;
	ContextManager.EnterContext(obj);
	ReLight();
}
/* ReLight()
 * This function is called when you switch between toolbar contexts 
 * so you can see which button you're currently returned to/entered on
 */
function ReLight(){
	htbButtonHover(ContextManager.getCurrent());
//used to have a "times" parameter
//before we had the css highlighting, we
//needed to focus on it multiple times
//	if(times>5)
//		return;
//	setTimeout("ReLight("+parseInt(times+1)+")", 100);
}

/*
 * htbActionTransform(ev)
 * this function should not be passed a parameter since it is
 * an event listenter. It looks at the preferences to
 * determine if the event it just saw (click or keydown) was
 * mapped to a toolbar action (either move or engage)
 * if so, it will do the appropriate action and *try* to
 * prevent the event object from propogating any further through
 */
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
		SoundBlaster.playSound("nothin");
		var simple = htbGetPref("literacybar");
		if(simple){
			HawkingPageClick();
		}
		else{
			ClickObject(ContextManager.getCurrent());
		}
		knackerEvent(ev);
		ev.preventDefault();
		ev.stopPropagation();
		ev.returnValue = false;
		ev.cancelBubble = true;
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
		knackerEvent(ev);
		ev.preventDefault();
		ev.stopPropagation();
		ev.returnValue = false;
		ev.cancelBubble = true;
		return false;
	}
	return true;
}
/*
 * this is a helper function to the htbActionTransform method
 * which will return true or false depending on whether the
 * action it is passed is mapped to a "move" event by the hawking toolbar
 */
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
//      var loc = new htbHighlighter().getViewOffset(obj, true);
//      if(loc.x<1 || loc.y<1)
//      	return false;
	      
      obj = obj.parentNode;
    }
  }
  catch(e){
    return false;
  }
//  alert("Visible: "+obj.nodeName);
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
			if(nobj && nobj.nodeName != "BR" && nobj.nodeName != "HR"){// && nobj.nodeName=="IMG"){
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
		alert("I tried to highlight, but you gave me nothing"); //this could be a sound
		return;
	}
	Highlighter.highlight(obj);
	//var re = window.content.document.getElementById('navRealestate');
	//if(!re) alert("re not found");
	//alert("top offset: "+re.offsetTop+"\nleft offset: "+re.offsetLeft+"\noffset height:"+re.offsetHeight);
	
	htbScrollToObj(obj);
}

/**
 * htbScrollToObj
 * Description: function takes an object and positions it in the center of the screen using scrolling
 * Arg: object to center
 */
function htbScrollToObj(obj){
	/**
	  * compute screen height and width of screen holding object accounting for frames if needed.
	  */
	var screenHeight;
	var screenWidth;
	if(window.frameElement) {
		screenHeight = window.frameElement.content.innerHeight;
		screenWidth = window.frameElement.content.innerWidth;
	}
	else {
		screenHeight = window.content.innerHeight;
		screenWidth = window.content.innerWidth;
	}
	
	//variables maxX and maxY are the total document height
	var maxX = window.content.scrollMaxX;
	var maxY = window.content.scrollMaxY;
	
	//variables to store position to which we will scroll
	var scrollToX;
	var scrollToY;
	
	/**
	  * if object offsets are available, compute pixel position on screen
	  */
	if(obj.offsetTop && obj.offsetLeft) {		
		
		var yPos = obj.offsetTop;
		var xPos = obj.offsetLeft;
		
		/**
		  * loop up to document body and find offset of object by adding values of offset parents
		  */
		var temp = obj;
		while(temp != window.content.document.body){
			temp = temp.offsetParent;
			yPos+=temp.offsetTop;
			xPos+=temp.offsetLeft;
		}
		
		//set values in scroll to
		scrollToY = yPos-(screenHeight/2);
		scrollToX = xPos-(screenWidth/2);
	}
	/**
	  * if object offsets are not available, use firefox function scrollIntoView to scroll
	  * and then center using half of screen width.
	  */
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
	
	if(scrollToX < screenWidth){
		scrollToX = 0;
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
	//this should be added after the page has loaded so we get the new body
	var canEscape = htbGetPref("literacybarEscape");
	if(canEscape==true && $("HawkingToolBar").hidden==true){
		//this should implement the brilliant idea to escape
		//from literacy mode every click if the setting is set
		htbToggleLiteracy();
	}
//moved to the window.onload function htbResetPageContext
//	PageContext = new ContextList(window.content.document.body);
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
	var button = document.getElementById("HawkingToggleActivity");
	if(dis==true){
		htbSetPref("disabled", false, "Bool");
		if(button)
		button.label = "Enable Hawking Toolbar";
//		else
//		alert("disabled");
	}
	else{
		htbSetPref("disabled", true, "Bool");
		if(button)
		button.label = "Disable Hawking Toolbar";
//		else
//		alert("activated");
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
		UnScope();//leave the literacy bar
		if(mItem)
			mItem.setAttribute("checked", "false");
	}
	else{
		//reduce to literacy center feature
		htbSetPref("literacybar", true, "Bool");
		Scope("HawkingSBLiteracy");
		if(mItem)
			mItem.setAttribute("checked", "true");
	}
}

function htbBack(){
	window.content.history.back();
}

function htbForward(){
	window.content.history.forward();
}

function htbReload(){
	window.content.location.href = window.content.location.href;
}

/*
 * htbResetPageContext()
 * this should reset position of the link clicker every time a new page is loaded
 * this is necessary so when a page with frames is clicked, the new content is 
 * loaded into the findlinks so you can click the newly loaded content rather than
 * what was in the previous frame.
 */
function htbResetPageContext(){
	PageContext = new ContextList(window.content.document.body);
	//this should also clear the highlighter.
}