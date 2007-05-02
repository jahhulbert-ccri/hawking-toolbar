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
 
/**
 * FireHawk 
 * Main toolbar class/var that contains the toolbar code similar to the main() class in a java program
 * This variable implements the ContextManager, Highlighter and other classes and serves
 * as the main controller of the toolbar code.
 */
var FireHawk = {
	//add more defaults to this object. Not sure why these can't be in preferences but for now, here is where they reside
	defaults: {
		DEFAULT_VERTICAL_SCROLL: 200,
		DEFAULT_HORIZONTAL_SCROLL: 200
	},
	autoInterval: null,
	ErrorBox: null,
	Contextmanager: null,
	Highlighter: null,
	SoundBlaster: null,
	PageContext: null,
	
	/**
	 * FireHawkSetup()
	 * this is the setup function which determines how the toolbar starts up
	 * based on preferences. It disables the toolbar if that is set, it
	 * sets up in Literacy Mode if needed, etc.
	 * this function also initializes the class member variables
	 */
	initialize: function(){
		//this will perform all the setting up needed
		try{
			//this should only be called once
			this.ContextManager = new ContextManager($("HawkingToolBar"));
			this.Highlighter = new htbHighlighter();
			this.SoundBlaster = new htbSoundManager();
			this.htbButtonHover(this.ContextManager.getCurrent());
			this.ErrorBox = this.htbMakeEbox();
			this.ContextManager.getContext().ContextRoot.appendChild(this.ErrorBox);
			if(htbGetPref("StartAsOn")){
				//if the always start as off setting is on, set enabled
				htbSetPref("hawkingEnabled", true, "Bool");
			}
			var dis = htbGetPref("hawkingEnabled");
			this.htbSetEnableMenuItemText(!dis,"htbLiteracyMenuItem");
			//if you were in auto mode or have it set to always be there on startup
			var mode = (htbGetPref("autoMode") || htbGetPref("StartInAuto"));
			if(mode){
				this.htbEnableAuto();
			}
			//transforms window events into move and engage
			//if you last were in litercay mode, or you have it set to always start in literacy mode
			var simple = (htbGetPref("literacybar") || htbGetPref("StartAsLiteracy"));
			if(simple){
				//show the subbar for the literacy center simple toolbar
				this.Scope("HawkingSBLiteracy");
				//set attribute
				var mItem = document.getElementById("htbLiteracyMenuItem");
				if(mItem)
					mItem.setAttribute("checked", "true");
			}
		}catch(e){
			this.htbAlert(e.name+" - "+e.message)
		}
	},
	
	/**
	 * UnScope()
	 * This function should take care of leaving the toolbar you're in
	 * so the toolbars you're leaving are hidden appropriately, and
	 * your previous toolbar's status is restored.
	 */
	UnScope: function (){
		if(!this.ContextManager)
			return;
		if(!htbGetPref("soundoff"))
			this.SoundBlaster.playSound("soundExit"); //pass it a preference which has a string value of the file you want to play
											 //if no such preference is set, it defaults to bark.wav
		this.ContextManager.getContext().ContextRoot.hidden = true;
		this.ContextManager.ExitContext();
		this.ContextManager.getContext().ContextRoot.hidden = false;
		this.htbButtonHover(this.ContextManager.getCurrent());
		this.ContextManager.getContext().ContextRoot.appendChild(this.ErrorBox);

	//		this.ReLight();
	},
	
	/**
	 * Scope(idstr)
	 * This function takes care of moving into a subtoolbar, hiding the parent
	 * toolbar and showing the new one you wish to enter.
	 */
	Scope: function (idstr){
		//takes in idstring, we'll document.getElementById it
		//and if it exists, we'll open scope
		var obj = $(idstr); //$ used to be document.getElementById
		if(!obj)return;
		if(!this.ContextManager)
			return;
		if(!htbGetPref("soundoff"))
			this.SoundBlaster.playSound("soundEnter"); //pass it a preference which has a string value of the file you want to play
											 //if no such preference is set, it defaults to bark.wav
	
		this.ContextManager.getContext().ContextRoot.hidden = true;
		obj.hidden = false;
		this.ContextManager.EnterContext(obj);
		this.htbButtonHover(this.ContextManager.getCurrent());
		this.ContextManager.getContext().ContextRoot.appendChild(this.ErrorBox);

//		this.ReLight();
	},
	
	/* *
	 * ReLight()
	 * This function is called when you switch between toolbar contexts 
	 * so you can see which button you're currently returned to/entered on
	 */
	/*
	ReLight: function () {
		this.htbButtonHover(this.ContextManager.getCurrent());
		//used to have a "times" parameter
		//before we had the css highlighting, we
		//needed to focus on it multiple times
		if(times>5)
			return;
		setTimeout("ReLight("+parseInt(times+1)+")", 100);
	},*/
	
	/**
	 * ClickObject(object)
	 * This function performs the command associated with an object and if it is not found
	 * the function attemps to click the object.
	 */
	ClickObject: function (object){
		//pass this function the object you want to click
		if(!object){
			this.htbAlert("There is nothing to click");
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
	},
	
	/**
	 * Highlight(obj) 
	 * This function calls the highlighter class and passes it the object it received
	 * as an argument to be highlighted. Function throws an error if the object does not 
	 * exist. If the object to highlight does exist, it calls the highlighter class to 
	 * highlight the object.
	 */
	Highlight: function (obj){
		
		if(!obj){
			this.htbAlert("Nothing to highlight"); //this could be a sound
			return;
		}
		this.Highlighter.highlight(obj);
	},
	
	/**
	 * unHighlight(obj)
	 * This function is called when an object is unhighlighted such as when the user
	 * wants to move to the next link. It passes the object to the unhighlight function
	 * of the highlighter to perform any functionality the highlighter class implements.
	 */
	unHighlight: function (obj){
		
		if(!obj){ //nothing to unhighlight
			return;
		}
		this.Highlighter.unhighlight(obj);
	},
	
	/**
	 * HawkingBarGoHome()
	 * Used for development to access FireHawk homepage
	 */
	HawkingBarGoHome: function (){
	    window.content.document.location = "http://code.google.com/p/hawking-toolbar";
	    //window.content.focus();
	},
	
	/**
	 * HawkingPageNext()
	 * This function will move the highlighter to the next link within the page.
	 */
	HawkingPageNext: function (){
		//first check if we have instantiated PageContext or if the PageContext's location
		//does not match the current page's location (they have since clicked a link and gone
		//to a new page)
		var myloc = "";
		try{
			myloc = window.content.document.location;
		}
		catch(e){}
		if(!this.PageContext || this.PageContext.Old || this.PageContext.WindowLocation!=myloc){
			//alert("page reset or new");
			this.PageContext = new ContextList(window.content.document.body);
		}
		else{
			this.unHighlight(this.PageContext.getCurrent());
		}
		this.PageContext.next();
		this.Highlight(this.PageContext.getCurrent());
		//alert("looking at "+PageContext.getCurrent().nodeName);
		//alert("done");
	},
	
	/**
	 * HawkingPagePrev()
	 * This function moves the highligter to the previous link in the page the user is viewing.
	 * If on the first link, it treats it as a circular list and moves to the last link
	 */
	HawkingPagePrev: function (){
		//first check if we have instantiated PageContext or if the PageContext's location
		//does not match the current page's location (they have since clicked a link and gone
		//to a new page)
		
		var myloc = "";
		try{
			myloc = window.content.document.location;
		}
		catch(e){}
		if(!this.PageContext || this.PageContext.Old || this.PageContext.WindowLocation!=myloc){
			//alert("page reset or new");
			this.PageContext = new ContextList(window.content.document.body);
		}
		else {
			this.unHighlight(PageContext.getCurrent());
		}
		this.PageContext.prev();
		if(!htbGetPref("soundoff")) {
			this.SoundBlaster.playSound("soundPrev");
		}
	
		this.Highlight(this.PageContext.getCurrent());
		//alert("looking at "+PageContext.getCurrent().nodeName);
		//alert("done");
	},
	
	/**
	 * HawkingPageClick()
	 * this function performs a click on the currently highlighted link within a pagecontext that the user is viewing
	 */
	HawkingPageClick: function (){
		this.ClickObject(this.PageContext.getCurrent());
		this.PageContext.Old = true;
		//this should be added after the page has loaded so we get the new body
		var canEscape = htbGetPref("literacybarEscape");
		if(canEscape==true && $("HawkingSBLiteracy").hidden==false){
			//this should implement the brilliant idea to escape
			//from literacy mode every click if the setting is set
			this.htbToggleLiteracy();
		}
		if(!htbGetPref("soundoff")){
			this.SoundBlaster.playSound("soundClick");
		}
	
	//moved to the window.onload function htbResetPageContext
	//	this.PageContext = new ContextList(window.content.document.body);
	},
	
	/**
	 * htbScrollWindow(horizontal,vertical)
	 * Function scrolls the window by a given amount
	 */
	htbScrollWindow: function (horizontal,vertical){
		window.content.scrollBy(horizontal,vertical);
	},
	
	/**
	 * htbScrollDown()
	 * Function scrolls down by a defined amount when activated by the hawking scroll subtoolbar
	 */
	htbScrollDown: function (){
		var amt = htbGetPref('verticalScrollAmt')
		if(!amt) {
			amt = this.defaults.DEFAULT_VERTICAL_SCROLL;
		}
		this.htbScrollWindow(0,amt);
	},
	
	/**
	 * htbScrollUp()
	 * Function scrolls up by a defined amount when activated by the hawking scroll subtoolbar
	 */
	htbScrollUp: function (){
		var amt = htbGetPref('verticalScrollAmt')
		if(!amt) {
			amt = this.defaults.DEFAULT_VERTICAL_SCROLL;
		}
		this.htbScrollWindow(0,(-1*amt));
	},
	
	/**
	 * htbScrollLeft()
	 * Function scrolls left by a defined amount when activated by the hawking scroll subtoolbar
	 */
	htbScrollLeft: function (){
		var amt = htbGetPref('horizontalScrollAmt')
		if(!amt) {
			amt = this.defaults.DEFAULT_HORIZONTAL_SCROLL;
		}
		this.htbScrollWindow((-1*amt),0);
	},
	
	/**
	 * htbScrollRight()
	 * Function scrolls right by a defined amount when activated by the hawking scroll subtoolbar
	 */
	htbScrollRight: function (){
		var amt = htbGetPref('horizontalScrollAmt')
		if(!amt) {
			amt = this.defaults.DEFAULT_HORIZONTAL_SCROLL;
		}
		this.htbScrollWindow(amt,0);
	},
	
	/**
	 * htbButtonHover(obj)
	 * this function is called when a button on a toolbar is selected to perform the hover event
	 */
	htbButtonHover: function (obj){
		if(!obj || !obj.style)
			return;
		obj.focus();
		obj.style.color = 'red';
		obj.className = "over";
	},
	
	/**
	 * htbButtonBlur(obj)
	 * this function is called when a toolbar button is deselected and performs is blur() functionality
	 */
	htbButtonBlur: function (obj){
		if(!obj || !obj.style)
			return;
		obj.style.color = 'black';
		obj.className = "";
		/*if(obj.getAttribute && obj.getAttribute("high")) {
			alert("changed to "+obj.getAttribute("high"));
		}*/
	},
	
	/**
	 * htbToggleCapture()
	 * this function effectively disables or enables the toolbar for usage (not in the sense of disabling a firefox extension)
	 * by setting the toolbar to capture or not capture events by the mouse, keyboard, or input switch
	 */
	htbToggleCapture: function (){
		var dis = htbGetPref("hawkingEnabled");
		this.htbSetEnableMenuItemText(dis,"htbLiteracyMenuItem");
		if(dis==true){
			htbSetPref("hawkingEnabled", false, "Bool");
			if(button)
			button.label = "Enable Hawking Toolbar";
			//else
			//alert("disabled");
		}
		else{
			htbSetPref("hawkingEnabled", true, "Bool");
			if(button)
			button.label = "Disable Hawking Toolbar";
			//else
			//alert("activated");
		}
	},
	
	/**
	 * htbToggleLiteracy()
	 * This function toggles simple or literacy mode. In this mode, the user can only iterate throught the links
	 * on a webpage instead of through a toolbar context
	 */
	htbToggleLiteracy: function (){
		var lbar = htbGetPref("literacybar");
		var mItem = document.getElementById("htbLiteracyMenuItem");
		//var tb = document.getElementById("HawkingToolBar");
		//var literacyTB = document.getElementById("HawkingSBLiteracy");
		if(lbar){
			//go back to full feature set
			htbSetPref("literacybar", false, "Bool");
			this.UnScope();//leave the literacy bar
			if(mItem)
				mItem.setAttribute("checked", "false");
		}
		else{
			//reduce to literacy center feature
			htbSetPref("literacybar", true, "Bool");
			this.Scope("HawkingSBLiteracy");
			if(mItem)
				mItem.setAttribute("checked", "true");
		}
	},
	
	/**
	 * htbBack()
	 * This function changes the current window location to the previous page in the browser's history
	 
	htbBack: function (){
		window.content.history.back();
	},
	
	/**
	 * htbForward()
	 * This function changes the current window location to the next page in the browser's history
	 
	htbForward: function (){
		window.content.history.forward();
	},
	
	/**
	 * htbReload()
	 * This function refreshes the current page based on its href property.
	 
	htbReload: function (){
		try{
			window.content.location.href = window.content.location.href;
		}catch(e){}
	},
	*/
	/*
	 * htbResetPageContext()
	 * this should reset position of the link clicker every time a new page is loaded
	 * this is necessary so when a page with frames is clicked, the new content is 
	 * loaded into the findlinks so you can click the newly loaded content rather than
	 * what was in the previous frame.
	 */
	htbResetPageContext: function (){
		this.PageContext = new ContextList(window.content.document.body);
		//this should also clear the highlighter.
	},
	
	/**
	 * htbAlert(msg)
	 * This function is called and is used to alert the user to an error by placing
	 * a textbox on the toolbar as to avoid using popups which cannot be exited by by the user
	 * when the user is not using a mouse or a standard keyboard
	 */
	htbAlert: function(msg){
		try{
			if(!htbGetPref("soundoff")){
				this.SoundBlaster.playSound("soundError");
			}
			if(!this.ErrorBox){ //create one and append to the current scope
				this.ErrorBox = this.htbMakeEbox();
				this.ContextManager.getContext().ContextRoot.appendChild(this.ErrorBox);
			}
			var txt = document.createElement("textbox");
			txt.setAttribute("value", msg);
			txt.className = "plain";
			txt.setAttribute("size", "25");
			var tid = "ErrorText"+parseInt(this.ErrorBox.childNodes.length);
			txt.id = tid;
			this.ErrorBox.appendChild(txt);
			setTimeout("FireHawk.htbRemoveErrorMessage('"+tid+"');", 60000);//disappear in 1 minute
			if(this.ErrorBox.childNodes.length>3){
				this.ErrorBox.removeChild(this.ErrorBox.firstChild);
			}
			//this.ErrorBox.setAttribute("value", msg);
		}
		catch(e){
			alert(e.name+" - "+e.message);
		}
	},
	
	/**
	 * htbMakeEbox()
	 * this function creates the errorbox used by htbAlert
	 */
	htbMakeEbox: function(){
		var ebox = document.createElement("box");
		ebox.id = "HawkingErrorMessage";
		ebox.setAttribute("orient", "vertical");
		return ebox;
	},
	
	/**
	 * htbRemoveErrorMessage(tid)
	 * this function removes an error messgage by id
	 */
	htbRemoveErrorMessage: function(tid){
		if($(tid))
			this.ErrorBox.removeChild($(tid));
	},

	/**
	 * htbToggleAuto
	 * this function toggles auto mode in which the toolbar automatically moves through the current context
	 * or through the links on a page in simple/literacy mode
	 */
	htbToggleAuto: function(){
		var mode = htbGetPref("autoMode");
		if(mode==true){
			this.htbDisableAuto();
		}
		else{
			this.htbEnableAuto();
		}
	},

	/**
	 * htbEnableAuto
	 * this function enables automatic mode 
	 */
	htbEnableAuto: function(){
		htbSetPref("autoMode", true, "Bool");
		var timing = parseFloat(htbGetPref("autoInterval"));
		if(timing<1 || isNaN(timing)){
			timing = 2;
			htbSetPref("autoInterval", 2, "Int"); //sets an erroneous preference back
		}
		timing = timing*1000;//from seconds to miliseconds
		this.autoInterval = setInterval("FireHawk.htbAutoIterate();", timing);
		//alert(autoInterval+" set");
	},

	/**
	 * htbDisableAuto()
	 * this function disables auto mode
	 */
	htbDisableAuto: function(){
		try{
		htbSetPref("autoMode", false, "Bool");
		clearInterval(this.autoInterval);
		}catch(e){}
	},

	/**
	 * htbAutoIterate()
	 * this function is called on a time basis by the toolbar and performs the auto iteration function
	 * by moving to the next object in the context or next link on the webpage
	 */
	htbAutoIterate: function(){
		var dis = htbGetPref("hawkingEnabled");
		if(dis==false){
			return true; //toolbar disabled
		}
		
		//in future versions, I'd prefer that this method execute an event on window of the type "move" given in preferences
/*		var moveClick = htbGetPref("moveAct"); //true if click, false if keypress
		var moveVal = htbGetPref("moveVal"); //value of the action
		var evObj;
		if(moveClick){
			//create a click event with .button = moveVal
			var evObj = document.createEvent('MouseEvents');
			evObj.initMouseEvent("click", false, true, window, 1, 0, 0, 0, 0, false, false, false, false, moveVal,null);
		}
		else if(!moveClick){
			//create a keydown event with .which = moveVal
			var evObj = document.createEvent('KeyboardEvent');
			evObj.initKeyEvent ("down", "false", "true", null, false, false, false, false, moveVal, 0);
		}
		window.dispatchEvent(evObj);
*/


		
//this way currently works
		var simple = htbGetPref("literacybar");
		if(simple) {//we're in literacy mode
			this.HawkingPageNext();
		}
		else {//we're in normal toolbar mode
			this.ContextManager.next();
		}

	},
	
	htbSetEnableMenuItemText:function(enable,menuId){
		menuItem = $(menuId);
		if(!menuItem){
			htbAlert("menu item not found");
			return;
		}
		if(enable){
			menuItem.setAttribute("label","Enable Hawking Toolbar");
		}
		else{
			menuItem.setAttribute("label","Disable Hawking Toolbar");
		}
	}
} //end FireHawk definition

/**
 * Context Manager class and prototype
 * The Context Manager manages toolbars and subtoolbars
 * so when you engage a button which takes you into a sub
 * toolbar, you can exit that subtoolbare and emerge where
 * you left off.
 */
var ContextManager = Class.create();
ContextManager.prototype = {
	ContextArray: new Array(),
	
	/**
	 * initialize(toolbar)
	 * constructor for this toolbar
	 */
	initialize: function(toolbar){
		if(!toolbar){
			alert("ERROR: Unable to locate the Hawking Toolbar in firefox");
			return;
		}
		this.ContextArray = [new ContextList(toolbar)]; //essentially a stack (we only look at the end)
	},
	
	/**
	 * ExitContext()
	 * this function "leaves" the current context by blurring the button it is on,
	 * removing the current context from its context list, and then focusing on
	 * the button marked as current in the previous context. Essentially, a LIFO
	 * stack setup.
	 */
	ExitContext: function(){
		//this removes the top context
		if(this.ContextArray<=1){
			//we are at the basic toolbar level, exiting here would leave us with nothing
			//this should never come up (our toolbar shouldn't have an 'x' but just in case...
			return;
		}
		FireHawk.htbButtonBlur(this.getContext().getCurrent());
		this.ContextArray.pop(); //removes the last array entry
		FireHawk.htbButtonHover(this.getContext().getCurrent()); //back to where we used to be
	},
	
	/**
	 * EnterContext(ncon)
	 * This function takes the ncon (next context) argument as the new subtoolbar. This is pushed onto
	 * the top of the stack, making it the current context. The previous current context's current button
	* is blurred and ncon's first button is highlighted. 
	 */
	EnterContext: function(ncon){
		//this adds a new context 'ncon' to the end of ContextArray
		FireHawk.htbButtonBlur(this.getContext().getCurrent());
		this.ContextArray.push(new ContextList(ncon));
		FireHawk.htbButtonHover(this.getContext().getCurrent());
	},
	
	/**
	 * next()
	 * This function moves to the next clickable object in the current context
	 */
	next: function(){
		//moves to next clickable
		FireHawk.htbButtonBlur(this.getContext().getCurrent());
		this.getContext().next();
		FireHawk.htbButtonHover(this.getContext().getCurrent());
	},
	
	/**
	 * prev()
	 * this function moves to the previous clickable object in the current context
	 */
	prev: function(){
		//moves to previous clickable
		htbButtonBlur(this.getContext().getCurrent());
		this.getContext().prev();
		htbButtonHover(this.getContext().getCurrent());
	},
	
	/**
	 * getCurrent()
	 * this function returns the current clickable item in the current context (what is being highlighted)
	 */
	getCurrent: function(){
		//returns the current clickable in the current scope
		//or null if nothing
		return this.getContext().getCurrent();
	},
	
	/**
	 * getContext()
	 * this function returns the current context pointed to (a reference to the SubToolbar itself).
	 */
	getContext: function(){
		//this returns the current context pointed to
		return this.ContextArray[this.ContextArray.length-1];
	}
	
} //end ContextManager definition

/**
 * ContextList
 * this class is a bonified array which manages all the clickable items within root. It can be passed
 * either a subtoolbar or a webpage, and it should be able to find the clickable items within that
 * page. It also provides functionality for moving back and forth in those clickable items.
 */
function ContextList(root){
	//this object should store 
	this.ContextRoot = root;
	this.WindowLocation = "about:blank"; //window location of this context
	this.ContextLinks = []; //array of all links in this context
	this.ContextPosition = -1;  //where we are in this array
}

/**
 * ContextList prototype
 * contains all the functions this class will do
 */
ContextList.prototype = {
	Old: false, //simple flag, set as true every time a click is observed so FindLinks is called
				//again, refreshing any changed content due to the click.
	
	/**
	 * getCurrent()
	 * This function returns the current clickable item in the context list held by the pointer
	 */
	
	/**
	 * Setup()
	 * This function finds all clickable links on the contextRoot and adds them to the context links var
	 */
	Setup: function(){
	  //find all the clickables in this.ContextRoot to this.ContextLinks
	  //and sets this.ContextPosition = 0
	  var myloc = "";
	  try{
		myloc = window.content.document.location;
	  }
	  catch(e){}
	  this.WindowLocation=myloc;
	  this.ContextLinks = []; //clears out the old array
	  this.FindLinks(this.ContextRoot, this.ContextLinks);
	  this.ContextPosition = 0;
	},
	getCurrent: function(){
		//returns the clickable currently pointed to (and highlighted)
		//	if(this.ContextRoot.hidden)
		//		this.ContextRoot.hidden = false;
		if(this.ContextLinks.length==0 || this.ContextPosition<0)
			this.Setup();
		return this.ContextLinks[this.ContextPosition];
	},
	
	/**
	 * next()
	 * This function moves the pointer of the context list to the next visible item.
	 */
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
		}
		while(!this.ObjectIsVisible(this.getCurrent()));
	  	if(!htbGetPref("soundoff")){
			FireHawk.SoundBlaster.playSound("soundNext"); 
		}
	},
	
	/**
	 * prev()
	 * This function moves the pointer of the context list to the next visible item, as determined by
	 * the ObjectIsVisible function.
	 */
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
	  	}
		while(!this.ObjectIsVisible(this.getCurrent()));
	  	//if(!htbGetPref("soundoff"))
			//FireHawk.SoundBlaster.playSound("soundPrev"); 
	},

	
	/**
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
		//and in fact cause a "getAttribute" to crash javascript. if we see a #text or #comment get out
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
	},//end of findlinks
	
	/**
	 * ObjectIsVisible(obj)
	 * this function tries computes whether or not an object is visible to the user via multiple methods
	 * and returns a boolean
	 */
	ObjectIsVisible: function (obj){
		//obj.style.display is not sufficient due to
		//style sheets having display: none; properties
		//which the .style function does not detect.
		if(!obj){
			return false;
		}
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
				//var loc = new htbHighlighter().getViewOffset(obj, true);
				//if(loc.x<1 || loc.y<1)
				//return false;
				obj = obj.parentNode;
			} // end while(obj) loop
		} //end try
		catch(e){
			return false;
		}
		// alert("Visible: "+obj.nodeName);
		return true;
	},

} //end ContextList definition

//-------------external even functions


/**
 * htbActionTransform(ev)
 * this function should not be passed a parameter since it is
 * an event listenter. It looks at the preferences to
 * determine if the event it just saw (click or keydown) was
 * mapped to a toolbar action (either move or engage)
 * if so, it will do the appropriate action and *try* to
 * prevent the event object from propogating any further through
 */
function htbActionTransform(ev){
	try{
	var dis = htbGetPref("hawkingEnabled");
	if(dis==false){
		return true; //toolbar disabled, normal action allowed
	}

	if(!ev || ev.ignoreMe) return false;
	if (htbIsEventClick(ev)) {
		//engage event
		var autoOn = htbGetPref("autoMode");
		if(autoOn){
			//if in autoscrolling mode, reset the timeout every time there is a click, so you can continue to do the same thing
			FireHawk.htbDisableAuto();
			FireHawk.htbEnableAuto();
		}
		var simple = htbGetPref("literacybar");
		if(simple){
			FireHawk.HawkingPageClick();
		}
		else{
			FireHawk.ClickObject(FireHawk.ContextManager.getCurrent());
		}
		knackerEvent(ev);
		return false;
	}
	else if(htbIsEventMove(ev)){
		//move event
		var simple = htbGetPref("literacybar");
		if(simple){
			FireHawk.HawkingPageNext();
		}
		else{
			FireHawk.ContextManager.next();
		}
		knackerEvent(ev);
		return false;
	}
	return true;
	}
	catch(e){
		FireHawk.htbAlert(e.name+" - "+e.message)
	}
}
	
/**
 * htbIsEventMove(ev)
 * this is a helper function to the htbActionTransform method
 * which will return true or false depending on whether the
 * action it is passed is mapped to a "move" event by the hawking toolbar
 */
function htbIsEventMove (ev){
	//takes in an event object and determines if it matches
	//the move characteristic of an event
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
	
/**
 * htbIsEventClick(ev)
 * this function takes an event and tries to match it to a hawking toolbar Engage event to determine if it
 * is an event defined as a move or engage event and returns true if it is
 */
function htbIsEventClick(ev){
	//takes in an event object and determines if it matches
	//the click characteristic of an event
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

/**
 * SetUp()
 * This function performs the initial setup of the toolbar by initializing it once the toolbar's XUL elements have been loaded.
 */
function SetUp(){
	var tb = $("HawkingToolBar");
	if(!tb){
		setTimeout("SetUp()", 200); //not ready, wait .2 seconds
		return;
	}
	addEvent(window, "keydown", htbActionTransform, true);
	addEvent(window, "click", htbActionTransform, true);
	addEvent(window, "load", FireHawk.htbResetPageContext, true); //reloads the context every time a new page loads
	FireHawk.initialize();
}

//perform first call of the code to setup the toolbar and get everying up and running
SetUp();
