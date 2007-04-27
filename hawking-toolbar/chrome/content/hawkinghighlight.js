var htbHighlightCSS = "chrome://hawking-toolbar/skin/highlight.css";

var htbHighlighter = Class.create();

htbHighlighter.prototype = {
	maxZ:100000000000,
	initialize: function(){
		try{
			var div = document.createElement("div");
			div.id = "htbHighlightDiv";
			var rend = document.createTextNode("h");
			div.appendChild(rend);
			div.removeChild(rend);
//			div.style.display = "none";
			this.highlighter = div;
		}
		catch(e){
			alert(e.name+" exception: "+e.message);
		}
	},
	highlight: function(obj){
		if(!obj)return;
		obj = this.findRealHighlight(obj);
		obj = $(obj);
		var dim = this.getOffsetSize(obj);
		var loc = this.getViewOffset(obj, true);
		
		if (obj.appendChild){
			obj.appendChild(this.highlighter);
		}
		{
		
			this.body = (obj.ownerDocument.body)?obj.ownerDocument.body:obj.ownerDocument.getElementsByTagName("body")[0];
			this.body.appendChild(this.highlighter);
		
		}
		this.move(this.highlighter, loc.x, loc.y);
		this.resize(this.highlighter, dim.width, dim.height);

		//get border color and width from preferences and set defaults in case of failure
		var borderColor = htbGetPref("borderHighlightColor");
		if(!borderColor)
			borderColor="#f00";
		var borderWidth = htbGetPref("borderHighlightWidth");
		if(!borderWidth)
			borderWidth="5";	
		this.highlighter.style.border = "solid "+borderColor+" "+borderWidth+"px";
		//this.move(this.highlighter,loc.x-borderWidth,loc.y-borderWidth);
		this.highlighter.style.position = "absolute";
		//this.highlighter.sytle.padding="2px";
		this.move(this.highlighter,loc.x-borderWidth,loc.y-borderWidth);
		
		//TODO CHECK PARENTS
		if(obj.style && obj.style.zIndex && obj.style.zIndex > this.maxZ){
			//alert("obj.style.zIndex found");
			this.highlighter.style.zIndex = obj.style.zIndex+1;
		}
		else{
			this.highlighter.style.zIndex=this.maxZ;
		}
		
		
		//use scroll to div now inplace of object scroll
		//this.scrollToObj(obj);
		this.scrollToDiv(this.highlighter);
	},
	unhighlight: function (){
		return;
	},
	findRealHighlight: function (obj){
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
	},
	
	// function scrolls to a div and centers it.
	scrollToDiv: function(div){
		// Returns a string with only numbers.
		// Optionally allows a decimal.
		// (c) Joe Chrzanowski
		function numbersOnly(string, allowdecimal) {
		    validchars = "0123456789";
		    outstr = "";
		    if (allowdecimal)
		        validchars += ".";
		        
		    for (i = 0; i < string.length; i++) {
		        if (validchars.indexOf(string.charAt(i)) >= 0)
		            outstr += string.charAt(i);
		    }
		    return outstr;
		}
		
		//alert('in0');
		//compute screen height and width of screen holding object accounting for frames if needed.
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
		
		var scrollToX = numbersOnly(div.style.left);
		var scrollToY = numbersOnly(div.style.top);
		
		//set values in scroll to
		scrollToY = scrollToY-(screenHeight/2);
		scrollToX = scrollToX-(screenWidth/2);
		
		//if still within screen on x coord, don't scroll x
		if(scrollToX < screenWidth){
			scrollToX = 0;
		}
		
		//if scrolltoY < 3/4 of height and no x scrolling needed, don't scroll to reduce flicker
		if(!(scrollToY < (3*screenHeight/4) && scrollToX!=0)){
			if(window.frameElement){
				window.frameElement.content.scrollTo(scrollToX,scrollToY);
			}
			else{
				window.content.scrollTo(scrollToX,scrollToY);
			}
		}
	},
	
	/**
	 * scrollToObj
	 * Description: function takes an object and positions it in the center of the screen using scrolling
	 * Arg: object to center
	 * DEPRICATED
	 */
	scrollToObj: function (obj){
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
	//			alert('frame element');
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
		
		//if still within screen on x coord, don't scroll x
		if(scrollToX < screenWidth){
			scrollToX = 0;
		}
		
		//if scrolltoY < 3/4 of height and no x scrolling needed, don't scroll to reduce flicker
		if(!(scrollToY < (3*screenHeight/4) && scrollToX!=0)){
			if(window.frameElement){
				window.frameElement.content.scrollTo(scrollToX,scrollToY);
			}
			else{
				window.content.scrollTo(scrollToX,scrollToY);
			}
		}
	},
	getClientOffset: function(elt){
	    function addOffset(elt, coords, view)
	    {
	        var p = elt.offsetParent;
	
	        var style = view.getComputedStyle(elt, "");
	
	        if (elt.offsetLeft)
	            coords.x += elt.offsetLeft + parseInt(style.borderLeftWidth);
	        if (elt.offsetTop)
	            coords.y += elt.offsetTop + parseInt(style.borderTopWidth);
	
	        if (p)
	        {
	            if (p.nodeType == 1)
	                addOffset(p, coords, view);
	        } 
	        else if (elt.ownerDocument.defaultView.frameElement)
	            addOffset(elt.ownerDocument.defaultView.frameElement, coords, elt.ownerDocument.defaultView);
	    }
	    
	    var coords = {x: 0, y: 0};
	    if (elt)
	    {
	        var view = elt.ownerDocument.defaultView;
	        addOffset(elt, coords, view);
	    }
	
	    return coords;
	},
	getViewOffset: function(elt, singleFrame){
	    function addOffset(elt, coords, view){
	        var p = elt.offsetParent;
	        coords.x += elt.offsetLeft - (p ? p.scrollLeft : 0);
	        coords.y += elt.offsetTop - (p ? p.scrollTop : 0);
	                
	        if (p)
	        {
	            if (p.nodeType == 1)
	            {
	                var parentStyle = view.getComputedStyle(p, "");
	                if (parentStyle.position != "static")
	                {
	                    coords.x += parseInt(parentStyle.borderLeftWidth);
	                    coords.y += parseInt(parentStyle.borderTopWidth);
	                    
	                    if (p.localName == "TABLE")
	                    {
	                        coords.x += parseInt(parentStyle.paddingLeft);
	                        coords.y += parseInt(parentStyle.paddingTop);
	                    }
	                    else if (p.localName == "BODY")
	                    {
	                        var style = view.getComputedStyle(elt, "");
	                        coords.x += parseInt(style.marginLeft);
	                        coords.y += parseInt(style.marginTop);
	                    }
	                }
	                else if (p.localName == "BODY")
	                {
	                    coords.x += parseInt(parentStyle.borderLeftWidth);
	                    coords.y += parseInt(parentStyle.borderTopWidth);
	                }
	
	                var parent = elt.parentNode;
	                while (p != parent)
	                {
	                    coords.x -= parent.scrollLeft;
	                    coords.y -= parent.scrollTop;
	                    parent = parent.parentNode;
	                }
	                addOffset(p, coords, view);
	            }
	        } 
	        else
	        {
	            if (elt.localName == "BODY")
	            {
	                var style = view.getComputedStyle(elt, "");
	                coords.x += parseInt(style.borderLeftWidth);
	                coords.y += parseInt(style.borderTopWidth);
	
	                var htmlStyle = view.getComputedStyle(elt.parentNode, "");
	                coords.x -= parseInt(htmlStyle.paddingLeft);
	                coords.y -= parseInt(htmlStyle.paddingTop);
	            }
	
	            if (elt.scrollLeft)
	                coords.x += elt.scrollLeft;
	            if (elt.scrollTop)
	                coords.y += elt.scrollTop;
	            
	            var win = elt.ownerDocument.defaultView;
	            if (win && (!singleFrame && win.frameElement))
	                addOffset(win.frameElement, coords, win);
	        } 
	        
	    }
		var coords = {x: 0, y: 0};
    	if (elt)
        	addOffset(elt, coords, elt.ownerDocument.defaultView);
    	return coords;
	},
	getOffsetSize: function(elt){
    	return {width: elt.offsetWidth, height: elt.offsetHeight};
	},

	move: function(element, x, y){
    	element.style.left = x + "px";
    	element.style.top = y + "px";
	},

	resize: function(element, w, h){
		element.style.width = w + "px";
		element.style.height = h + "px";
	},
};

