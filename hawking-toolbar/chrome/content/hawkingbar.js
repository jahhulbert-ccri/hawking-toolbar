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
 * The current homepage the FireHawk Toolbar is updates is 
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
 
var FireHawk = {
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
	initialize: function(){
		//this will perform all the setting up needed
		try{
			addEvent(window, "keydown", htbActionTransform, true);
			addEvent(window, "click", htbActionTransform, true);
			addEvent(window, "load", this.htbResetPageContext, true); //reloads the context every time a new page loads
		}catch(e){
			this.htbAlert(e.name+" - "+e.message);
		}
		this.FireHawkSetup();
	},
	
	/*
	 * FireHawkSetup()
	 * this is the setup function which determines how the toolbar starts up
	 * based on preferences. It disables the toolbar if that is set, it
	 * sets up in Literacy Mode if needed, etc.
	 */
	FireHawkSetup: function(){
		try{
			//this should only be called once
			this.ContextManager = new ContextManager($("HawkingToolBar"));
			this.Highlighter = new htbHighlighter();
			this.SoundBlaster = new htbSoundManager();
			this.htbButtonHover(this.ContextManager.getCurrent());
			this.ErrorBox = this.htbMakeEbox();
			this.ContextManager.getContext().ContextRoot.appendChild(this.ErrorBox);
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
				this.htbEnableAuto();
			}
			//transforms window events into move and engage
			var simple = htbGetPref("literacybar");
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
	/*
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
	/*
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
	/* ReLight()
	 * This function is called when you switch between toolbar contexts 
	 * so you can see which button you're currently returned to/entered on
	 */
//	ReLight: function (){
	//	this.htbButtonHover(this.ContextManager.getCurrent());
	//used to have a "times" parameter
	//before we had the css highlighting, we
	//needed to focus on it multiple times
	//	if(times>5)
	//		return;
	//	setTimeout("ReLight("+parseInt(times+1)+")", 100);
	//},
	
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
	 * 
	 */
	HawkingPageNext: function (){
		//first check if we have instantiated PageContext or if the PageContext's location
		//does not match the current page's location (they have since clicked a link and gone
		//to a new page)
		if(!this.PageContext || this.PageContext.Old || this.PageContext.WindowLocation!=window.content.document.location){
			//alert("page reset or new");
			this.PageContext = new ContextList(window.content.document.body);
		}
		else	
			this.unHighlight(this.PageContext.getCurrent());
		this.PageContext.next();
		this.Highlight(this.PageContext.getCurrent());
		//alert("looking at "+PageContext.getCurrent().nodeName);
		//alert("done");
	},
	
	/**
	 * HawkingPagePrev()
	 *
	 */
	HawkingPagePrev: function (){
		//first check if we have instantiated PageContext or if the PageContext's location
		//does not match the current page's location (they have since clicked a link and gone
		//to a new page)
		if(!this.PageContext || this.PageContext.Old || this.PageContext.WindowLocation!=window.content.document.location){
	//		alert("page reset or new");
			this.PageContext = new ContextList(window.content.document.body);
		}
		else
			this.unHighlight(PageContext.getCurrent());
		this.PageContext.prev();
		if(!htbGetPref("soundoff"))
			this.SoundBlaster.playSound("soundPrev");
	
		this.Highlight(this.PageContext.getCurrent());
	//	alert("looking at "+PageContext.getCurrent().nodeName);
	//	alert("done");
	},
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
		if(!htbGetPref("soundoff"))
			this.SoundBlaster.playSound("soundClick");
	
	//moved to the window.onload function htbResetPageContext
	//	this.PageContext = new ContextList(window.content.document.body);
	},
	
	/**
	 * htbScrollWindow(horizontal,vertical)
	 * Function scrolls to a given location in the window
	 */
	htbScrollWindow: function (horizontal,vertical){
		window.content.scrollBy(horizontal,vertical);
	},
	
	/**
	 * htbScrollDown()
	 * Function scrolls down by a defined amount when the user moves to the next
	 * link on a page
	 */
	htbScrollDown: function (){
		var amt = htbGetPref('verticalScrollAmt')
		if(!amt) {
			amt = this.defaults.DEFAULT_VERTICAL_SCROLL;
		}
		this.htbScrollWindow(0,amt);
	},
	
	htbScrollUp: function (){
		var amt = htbGetPref('verticalScrollAmt')
		if(!amt) {
			amt = this.defaults.DEFAULT_VERTICAL_SCROLL;
		}
		this.htbScrollWindow(0,(-1*amt));
	},
	htbScrollLeft: function (){
		var amt = htbGetPref('horizontalScrollAmt')
		if(!amt) {
			amt = this.defaults.DEFAULT_HORIZONTAL_SCROLL;
		}
		this.htbScrollWindow((-1*amt),0);
	},
	
	htbScrollRight: function (){
		var amt = htbGetPref('horizontalScrollAmt')
		if(!amt) {
			amt = this.defaults.DEFAULT_HORIZONTAL_SCROLL;
		}
		this.htbScrollWindow(amt,0);
	},
	
	htbButtonHover: function (obj){
		if(!obj || !obj.style)
			return;
		obj.focus();
		obj.style.color = 'red';
		obj.className = "over";
	},
	
	htbButtonBlur: function (obj){
		if(!obj || !obj.style)
			return;
		obj.style.color = 'black';
		obj.className = "";
	//	if(obj.getAttribute && obj.getAttribute("high"))
	//		alert("changed to "+obj.getAttribute("high"));
	},
	
	htbToggleCapture: function (){
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
	},
	
	
	htbToggleLiteracy: function (){
		var lbar = htbGetPref("literacybar");
		var mItem = document.getElementById("htbLiteracyMenuItem");
//		var tb = document.getElementById("HawkingToolBar");
//		var literacyTB = document.getElementById("HawkingSBLiteracy");
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
	
	htbBack: function (){
		window.content.history.back();
	},
	
	htbForward: function (){
		window.content.history.forward();
	},
	
	htbReload: function (){
		window.content.location.href = window.content.location.href;
	},
	
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
	htbAlert: function(msg){
		try{
			if(!htbGetPref("soundoff"))
				this.SoundBlaster.playSound("soundError");
			if(!this.ErrorBox){//create one and append to the current scope
				this.ErrorBox = this.htbMakeEbox();
				this.ContextManager.getContext().ContextRoot.appendChild(this.ErrorBox);
			}
			var txt = document.createElement("textbox");
			txt.setAttribute("value", msg);
			txt.className = "plain";
			var tid = "ErrorText"+parseInt(this.ErrorBox.childNodes.length);
			txt.id = tid;
			this.ErrorBox.appendChild(txt);
			setTimeout("FireHawk.htbRemoveErrorMessage('"+tid+"');", 60000);//disappear in 1 minute
			if(this.ErrorBox.childNodes.length>3)
				this.ErrorBox.removeChild(this.ErrorBox.firstChild);
//			this.ErrorBox.setAttribute("value", msg);
		}
		catch(e){
			alert(e.name+" - "+e.message);
		}
	},
	htbMakeEbox: function(){
		var ebox = document.createElement("box");
		ebox.id = "HawkingErrorMessage";
		ebox.setAttribute("orient", "vertical");
		return ebox;
	},
	htbRemoveErrorMessage: function(tid){
		if($(tid))
			this.ErrorBox.removeChild($(tid));
	},

	htbToggleAuto: function(){
		var mode = htbGetPref("autoMode");
		if(mode==true){
			this.htbDisableAuto();
		}
		else{
			this.htbEnableAuto();
		}
	},

	htbEnableAuto: function(){
		htbSetPref("autoMode", true, "Bool");
		var timing = parseFloat(htbGetPref("autoInterval"));
		if(timing<1 || isNaN(timing)){
			timing = 2;
			htbSetPref("autoInterval", 2, "Int"); //sets an erroneous preference back
		}
		timing = timing*1000;//from seconds to miliseconds
		this.autoInterval = setInterval("FireHawk.htbAutoIterate();", timing);
	//	alert(autoInterval+" set");
	},

	htbDisableAuto: function(){
		try{
		htbSetPref("autoMode", false, "Bool");
		clearInterval(this.autoInterval);
		}catch(e){}
	},

	htbAutoIterate: function(){
		var simple = htbGetPref("literacybar");
		if(simple)//we're in literacy mode
			this.HawkingPageNext();
		else //we're in normal toolbar mode
			this.ContextManager.next();		
	}
	
	
	
}

var ContextManager = Class.create();
ContextManager.prototype = {
	ContextArray: new Array(),
	initialize: function(toolbar){
		if(!toolbar){
			alert("ERROR: Unable to locate the Hawking Toolbar in firefox");
			return;
		}
		this.ContextArray = [new ContextList(toolbar)]; //essentially a stack (we only look at the end)
	},
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
	EnterContext: function(ncon){
		//this adds a new context 'ncon' to the end of ContextArray
		FireHawk.htbButtonBlur(this.getContext().getCurrent());
		this.ContextArray.push(new ContextList(ncon));
		FireHawk.htbButtonHover(this.getContext().getCurrent());
	},
	next: function(){
		//moves to next clickable
		FireHawk.htbButtonBlur(this.getContext().getCurrent());
		this.getContext().next();
		FireHawk.htbButtonHover(this.getContext().getCurrent());
	},
	prev: function(){
		//moves to previous clickable
		htbButtonBlur(this.getContext().getCurrent());
		this.getContext().prev();
		htbButtonHover(this.getContext().getCurrent());
	},
	getCurrent: function(){
	   //returns the current clickable in the current scope
	   //or null if nothing
		return this.getContext().getCurrent();
	},
	getContext: function(){
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
	Old: false,
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
		}while(!this.ObjectIsVisible(this.getCurrent()));
	  	if(!htbGetPref("soundoff"))
			FireHawk.SoundBlaster.playSound("soundNext"); 
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
	  	}while(!this.ObjectIsVisible(this.getCurrent()));
//	  	if(!htbGetPref("soundoff"))
//			FireHawk.SoundBlaster.playSound("soundPrev"); 
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
	},//end of findlinks
	ObjectIsVisible: function (obj){
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
	},

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
		try{
		//this function captures key presses
		//and translates them into clicks
		var dis = htbGetPref("disabled");
		if(dis==false){
			return true; //toolbar disabled, normal action allowed
		}
	
		if(!ev || ev.ignoreMe) return false;
		if (htbIsEventClick(ev)) {
		//engage
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
		//move
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
	/*
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


function SetUp(){
	var tb = $("HawkingToolBar");
	if(!tb){
		setTimeout("SetUp()", 200); //not ready, wait .2 seconds
		return;
	}
	FireHawk.initialize();
}
SetUp();
