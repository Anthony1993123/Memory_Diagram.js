;
(function($,window,document,undefined){
	var pluginName = "MemDiagram";
	var defaults = {
		height:800,
		stackFrameWidth:400,
		heapVarWidth:300,
		varUnitHeight:30,
		stackFrameOffset:50,
		moveBack:"",
		moveForward:""
	};

	function Cmd2Step(commands){
		this.steps = [{}];
		this.tempStep = {};
		this.stepDesc = commands;
	};

	Cmd2Step.prototype = {
		stepNumber:function(){
			return this.stepDesc.length;
		},
		// Index of current stack frame
		csfInx:function(){
			var index = this.tempStep.func.length - 1;
			return index;
		},
		stackAdd:function(index){
			if(index==0){
				var stepObj = {};
				stepObj.funcName = this.stepDesc[index].details.name;				
				stepObj.vars = this.stepDesc[index].details.decls;
				this.steps[index].func = [];
				this.steps[index].heapvars = [];
				this.steps[index].func.push(stepObj);
			}
			else{
				this.tempStep = $.extend(true,{},this.steps[index-1]);
				var stepObj = {};
				stepObj.funcName = this.stepDesc[index].details.name;
				stepObj.vars = this.stepDesc[index].details.decls;
				this.tempStep.func.push(stepObj);
				this.steps.push(this.tempStep);
			}
		},
		stackRem:function(index){
			if(index <=0){
				alert("No stack frame exist");
			}
			else{
				this.tempStep = $.extend(true,{},this.steps[index-1]);
				//return value 
				if(!(this.stepDesc[index].returnLoc===undefined)){
					var addr = this.stepDesc[index].returnLoc;
					var targetVar = this.findVar(this.tempStep,addr);
					targetVar.value = this.stepDesc[index].returnVal;
				}
				this.tempStep.func.pop();
				this.steps.push(this.tempStep);
			}
		},
		findVar:function(step,address){
			var funcLength = step.func.length;
			var heapvarsLength = step.heapvars.length;
			var targetVar;
			for(var i=0; i<funcLength;i++){
				var varsLength = step.func[i].vars.length;
				for(var j=0; j<varsLength;j++){
					if(step.func[i].vars[j].address===address){
						targetVar = step.func[i].vars[j];
						break;
					}
				}
				if(!targetVar===undefined){
					break;
				}
			}
			return targetVar;
		},

		varAdd:function(index){
			this.tempStep = $.extend(true,{},this.steps[index-1]);
			var csf = this.csfInx();
			if(csf==-1){
				alert("Cannot add variable: No stack frame exist.");
			}
			else{
				var stepObj = this.stepDesc[index].decl;
				// Check if the variable is an array
				if(typeof(stepObj.length) === "number"){
					var size = stepObj.length;
					for(var i=0; i<size;i++){
						var arrElem = new Object();
						arrElem.type = stepObj.type.replace("[]","");	
						arrElem.name = stepObj.name+"["+i+"]";
						if(stepObj.pointer !== undefined){
							arrElem.pointer = stepObj.pointer[i];
						}
						else{
							arrElem.value = stepObj.value[i];
						}
						
						if(stepObj.scopeLevel===undefined){
							arrElem.scopeLevel = 0;
						}
						else{
							arrElem.scopeLevel = stepObj.scopeLevel;
						}
						arrElem.address = stepObj.address+i;
						this.tempStep.func[csf].vars.push(arrElem);

					}
					this.steps.push(this.tempStep);
				}
				else{
					this.tempStep.func[csf].vars.push(stepObj);
					this.steps.push(this.tempStep);
				}
			}
		},
		varAdd_heap:function(index){
			this.tempStep = $.extend(true,{},this.steps[index-1]);
			
			var stepObj = this.stepDesc[index].decl;
			if(typeof(stepObj.length)==="number"){
				var size = stepObj.length;
				for(var i=0; i<size; i++){
					var arrElem = new Object();
					arrElem.type = stepObj.type.replace("[]","");
					if(stepObj.pointer !== undefined){
						arrElem.pointer = stepObj.pointer[i];
					}
					else{
						arrElem.value = stepObj.value[i];
					}
					
					arrElem.address = stepObj.address+i;
					this.tempStep.heapvars.push(arrElem);
				}
				this.steps.push(this.tempStep);
			}
			else{
				this.tempStep.heapvars.push(stepObj);
				this.steps.push(this.tempStep);
			}
			
		},
		varRem:function(index){
			var csf = this.csfInx();
			this.tempStep = $.extend(true,{},this.steps[index-1]);
			if(csf==-1){
				alert("Cannot remove variable: No stack frame exist.");
			}
			else{
				var stepObj = this.stepDesc[index].decl;
				var varsObj = this.tempStep.func[csf].vars;
				var varsNum = this.tempStep.func[csf].vars.length;
				for(var i=0; i<varsNum; i++){
					if(stepObj.type===varsObj[i].type && stepObj.name===varsObj[i].name && stepObj.scopeLevel===varsObj[i].scopeLevel){
						varsObj.splice(i,1);
						this.steps.push(this.tempStep);
						break;
					}
				}
			}
		},
		varMod:function(index){
			var csf = this.csfInx();
			this.tempStep = $.extend(true,{},this.steps[index-1]);
			if(csf==-1){
				alert("Cannot modify variable: No stack frame exist.");
			}
			else{
				var stepObj = this.stepDesc[index].decl;
				var varsObj = this.tempStep.func[csf].vars;
				var varsNum = this.tempStep.func[csf].vars.length;
				for(var i=0; i<varsNum; i++){
					if(stepObj.name==varsObj[i].name && stepObj.scopeLevel==varsObj[i].scopeLevel){
						varsObj[i].value=stepObj.value;
						this.steps.push(this.tempStep);
						break;
					}
				}
			}
		},
		varRem_heap:function(index){
			this.tempStep = $.extend(true,{},this.steps[index-1]);
			
			var stepObj = this.stepDesc[index].decl;
			var varsObj = this.tempStep.heapvars;
			var varsNum = this.tempStep.heapvars.length;
			for(var i=0; i<varsNum; i++){
				if(stepObj.address === varsObj[i].address){
					varsObj.splice(i,1);
					this.steps.push(this.tempStep);
					break;
				}
			}
		},
		varMod_heap:function(index){
			this.tempStep = $.extend(true,{},this.steps[index-1]);
			var stepObj = this.stepDesc[index].decl;
			var varsObj = this.tempStep.heapvars;
			var varsNum = this.tempStep.heapvars.length;
			for(var i=0; i<varsNum; i++){
				if(stepObj.address === varsObj[i].address){
					varsObj[i].value=stepObj.value;
					this.steps.push(this.tempStep);
					break;
				}
			}
		},
		loadSteps:function(){
			for(var i = 0; i<this.stepNumber(); i++){
				switch(this.stepDesc[i].command){
					case "stackadd":
						this.stackAdd(i);
						break;
					case "stackrem":
						this.stackRem(i);
						break;
					case "varadd":
						this.varAdd(i);
						break;
					case "varrem":
						this.varRem(i);
						break;
					case "varmod":
						this.varMod(i);
						break;
					case "varadd_heap":
						this.varAdd_heap(i);
						break;
					case "varrem_heap":
						this.varRem_heap(i);
						break;
					case "varmod_heap":
						this.varMod_heap(i)
				}
			}
			return this.steps;
		}


	};

	function MemDiagram(element,commands,options){
		this.element = element;
		this.settings = $.extend({}, defaults, options);
		var cmd2step = new Cmd2Step(commands);
		this.steps = cmd2step.loadSteps();
		this.stepCounter=0;
		this.originX_stack = 100;
		this.originY_stack = 100;
		this.originX_heap = 1100;
		this.originY_heap = 100;

		this.linePoints = [];

		this.init();
		this.displayStep();
		//$('#text').text(JSON.stringify(this.steps));
	};

	var svgns = "http://www.w3.org/2000/svg";
	$.svg = function $svg(tagName){
		return $(document.createElementNS(svgns, tagName));
	};

	MemDiagram.prototype = {
		init:function(){
			var elementStyle = {
				"display":"inline-block",
				"position": "relative",
				"vertical-align": "middle",
				"overflow":"scroll"
			};
			this.setStyles(this.element,elementStyle);

			this.container = $.svg("svg");
			var containerStyle = {
				"display": "inline-block",
    			"position": "absolute",
   			 	"top": 0,
    			"left": 0,
			}
			this.setStyles(this.container,containerStyle);

			this.container.appendTo(this.element);
			

			var containerAttrs = {
				"version":"1.1",
				"width":"99%",
				"height":"99%",			
				"viewBox":"0 0 1600 800",
				"preserveAspectRatio":"xMinYMin meet",
				"class":"svg-content"
			};
			var dom = this.container[0];
			this.setAttr(dom,containerAttrs);

			var stackTitle = $.svg("text").appendTo(this.container).text("STACK");
			var stackTitleAttrs = this.getTextAttrObj(300,80,40,"middle","keyElem");
			this.setAttr(stackTitle,stackTitleAttrs);

			var heapTitle = $.svg("text").appendTo(this.container).text("HEAP");
			var heapTitleAttrs = this.getTextAttrObj(1150,80,40,"middle","keyElem");
			this.setAttr(heapTitle,heapTitleAttrs);

			this.height = $('.svg-content').height();
			this.zoomRatio = (this.height/800).toFixed(2);

			this.navigation();

		},
		navigation:function(){
			var back = this.settings.moveBack;
			var forward = this.settings.moveForward;
			var _this = this;

			$(document).bind("keydown",function(event){
				if(event.which===39){
					_this.moveForward();
				}
				else if(event.which===37){
					_this.moveBack();
				}
			});
			if(back!==""){
				$(back).click(function(){
					_this.moveBack();
				});
			}
			if(forward!==""){
				$(forward).click(function(){
					_this.moveForward();
				});
			}
		},
		clear:function(){
			$("svg").children().not(".keyElem").remove();
			this.originX_stack = 100;
			this.originY_stack = 100;
			this.originX_heap = 1000;
			this.originY_heap = 100;
			
		},
		createStackFrame:function(func){
			var varsNum = func.vars.length;
			
			var x = this.originX_stack;
			var y = this.originY_stack;
			var initY = y;
			
			var varUnitWidth = this.settings.stackFrameWidth;
			var varUnitHeight = this.settings.varUnitHeight;
			var height = varUnitHeight*varsNum;

			var reqHeight = y+height+this.settings.stackFrameOffset;
			if(reqHeight>this.settings.height){
				$("svg").attr("height",reqHeight*this.zoomRatio);
			}

			var funcTitleText = func.funcName;
			var funcTitle = $.svg("text").appendTo(this.container).text(funcTitleText);
			var funcTitleAttrs = this.getTextAttrObj(x/2,y+height/2,20,"middle","funcName");
			this.setAttr(funcTitle,funcTitleAttrs);

			var typeTextX = 150;
			var nameTextX = 250;
			var valueTextX = 350;
			var addrTextX = 450;
			var lineX = 400;

			for(var i=0; i<varsNum; i++){
				var varUnit = $.svg("rect").appendTo(this.container);
				var varUnitAttrs = this.getRectAttrObj(x,y,varUnitWidth,varUnitHeight,"black","transparent");
				this.setAttr(varUnit,varUnitAttrs);

				var type = $.svg("text").appendTo(this.container).text(func.vars[i].type);
				var name = $.svg("text").appendTo(this.container).text(func.vars[i].name);
				var address = $.svg("text").appendTo(this.container).text(func.vars[i].address);
				var value;

				var typeAttrs = this.getTextAttrObj(typeTextX,y+varUnitHeight-10,20,"middle","type");
				var nameAttrs = this.getTextAttrObj(nameTextX,y+varUnitHeight-10,20,"middle","name");
				var addressAttrs = this.getTextAttrObj(addrTextX,y+varUnitHeight-10,20,"middle","address");
				var valueAttrs;
				if(func.vars[i].pointer!==undefined){
					value = $.svg("text").appendTo(this.container).text(func.vars[i].pointer);
					valueAttrs = this.getTextAttrObj(valueTextX,y+varUnitHeight-10,20,"middle","pointer");
				}
				else{
					value = $.svg("text").appendTo(this.container).text(func.vars[i].value);
					valueAttrs = this.getTextAttrObj(valueTextX,y+varUnitHeight-10,20,"middle","value");
				}
				this.setAttr(type,typeAttrs);
				this.setAttr(name,nameAttrs);
				this.setAttr(address,addressAttrs);
				this.setAttr(value,valueAttrs);

				y = y+varUnitHeight;
			}
			var line1 = $.svg("line").appendTo(this.container);
			var line1Attrs =  this.getLineAttrObj(lineX,lineX,initY,y,"transparent","black");
			this.setAttr(line1,line1Attrs);

			this.originY_stack = y+this.settings.stackFrameOffset;
		},
		createHeapvars:function(heapvars){
			var varsNum = heapvars.length;

			var x = this.originX_heap;
			var y = this.originY_heap;
			var initY = y;
			
			var varUnitWidth = this.settings.heapVarWidth;
			var varUnitHeight = this.settings.varUnitHeight;
			var height = varUnitHeight*varsNum;

			var reqHeight = y+height+this.settings.stackFrameOffset;
			if(reqHeight>this.settings.height){
				$("svg").attr("height",reqHeight*this.zoomRatio);
			}

			var typeTextX = 1050;
			var valueTextX = 1150;
			var addrTextX = 1250;
			var lineX = 1200;

			for(var i=0; i<varsNum;i++){
				var varUnit = $.svg("rect").appendTo(this.container);
				var varUnitAttrs = this.getRectAttrObj(x,y,varUnitWidth,varUnitHeight,"black","transparent");
				this.setAttr(varUnit,varUnitAttrs);

				var type = $.svg("text").appendTo(this.container).text(heapvars[i].type);
				var address = $.svg("text").appendTo(this.container).text(heapvars[i].address);
				var value;

				var typeAttrs = this.getTextAttrObj(typeTextX,y+varUnitHeight-10,20,"middle","type");
				var addressAttrs = this.getTextAttrObj(addrTextX,y+varUnitHeight-10,20,"middle","address");
				var valueAttrs;

				if(heapvars[i].pointer !== undefined){
					value = $.svg("text").appendTo(this.container).text(heapvars[i].pointer);
					valueAttrs = this.getTextAttrObj(valueTextX,y+varUnitHeight-10,20,"middle","pointer");
				}
				else{
					value = $.svg("text").appendTo(this.container).text(heapvars[i].value);
					valueAttrs = this.getTextAttrObj(valueTextX,y+varUnitHeight-10,20,"middle","value");
				}

				this.setAttr(type,typeAttrs);
				this.setAttr(value,valueAttrs);
				this.setAttr(address,addressAttrs);

				y = y+varUnitHeight;
			}

			var line = $.svg("line").appendTo(this.container);
			var lineAttrs =  this.getLineAttrObj(lineX,lineX,initY,y,"transparent","black");
			this.setAttr(line,lineAttrs);
		},
		moveBack:function(){
			this.stepCounter -= 1;
			if(this.stepCounter<0){
 				this.stepCounter = 0;
			}

			this.displayStep();
		},
		moveForward:function(){
			this.stepCounter += 1;
			if(this.stepCounter > (this.steps.length - 1)){
				this.stepCounter = this.steps.length - 1;
			}
			
			this.displayStep();
		},
		displayStep:function(){
			this.clear();
			var currentStep = this.steps[this.stepCounter];
			var funcNum = currentStep.func.length;
			for(var i=0; i<funcNum;i++){
				this.createStackFrame(currentStep.func[i]);
			}

			this.createHeapvars(currentStep.heapvars);
			this.matchPointers();
		},
		setAttr:function(element,attrs){
			if (element instanceof jQuery){
				for(attr in attrs){
					element.attr(attr,attrs[attr]);
				}
			}
			else{
				for(attr in attrs){
					element.setAttribute(attr,attrs[attr]);
				}
			}
			
		},
		setStyles:function(element,style){
			for(key in style){
				element.css(key,style[key]);
			}
		},
		getTextAttrObj:function(corX,corY,fontSize,textAnchor,className,id){
			var attrObj = {
				"x":corX,
				"y":corY,
				"font-size":fontSize,
				"text-anchor":textAnchor,
				"class":className,
				"id":id
			};
			return attrObj;
		},
		getLineAttrObj:function(corX1,corX2,corY1,corY2,fill,stroke,className){
			var attrObj = {
				"x1":corX1,
				"x2":corX2,
				"y1":corY1,
				"y2":corY2,
				"fill":fill,
				"stroke":stroke,
				"class":className
			};
			return attrObj;
		},
		getRectAttrObj:function(corX,corY,width,height,stroke,fill,strokeWidth,className){
			var attrObj = {
				"x":corX,
				"y":corY,
				"width":width,
				"height":height,
				"stroke":stroke,
				"fill":fill,
				"stroke-width":strokeWidth,
				"class":className
			};
			return attrObj;
		},
		getPolygonAttrObj:function(points,fill){
			var attrObj = {
				"points":points,
				"fill":fill
			};
			return attrObj;
		},
		getY:function(element){
			return $(element).attr("y");
		},
		getX:function(element){
			return $(element).attr("x");
		},
		matchPointers:function(){
			var pointers = $('.pointer');
			var _this = this;
			var offset_left = 30;
			var offset_right = 30;
			pointers.each(function(){
				var $this = this;
				var ptrY = _this.getY($this);
				var ptrX = _this.getX($this);
				var values = $('.address');
				
				values.each(function(){
					
					if($($this).text()===$(this).text()){
						var valY = _this.getY(this);
						var valX = _this.getX(this);
						var startX,startY,mid1X,mid1Y,mid2X,mid2Y,endX,endY;

						if(ptrX==350 && valX == 450){
							startX = endX = 500;
							mid1X = mid2X = startX+offset_left;
							offset_left+=10;
						}
						else if(ptrX==350 && valX ==1250){
							startX = 500;
							endX = 1000;
							mid1X = mid2X = startX+offset_left;	
							offset_left+=10;
						}
						else if(ptrX==1150 && valX==1250){
							startX = endX = 1300;
							mid1X = mid2X = startX+offset_right;
							offset_right+=10;
						}
						else if(ptrX==1150 && valX==450){
							startX = 1000;
							endX = 500;
							mid1X = mid2X = startX-offset_left;
							offset_left+=10;
						}

						mid1Y = parseInt(ptrY)-10;
						mid2Y = valY;

						startY = parseInt(ptrY)-10;
						endY = valY;
						
						_this.drawConnection(startX,startY,mid1X,mid1Y,mid2X,mid2Y,endX,endY);

					}
				});
			});
		},
		drawConnection:function(startX,startY,mid1X,mid1Y,mid2X,mid2Y,endX,endY){
			
			var arrow = $.svg('polygon').appendTo(this.container);
			var arrowAttrs;
			var points;
			if(endX==1000){
				var p1Y = parseInt(endY)+5;
				points = (endX-5)+","+p1Y+" "+(endX-5)+","+(endY-5)+" "+endX+","+endY;
			}
			else{
				var p1Y=parseInt(endY)+5;
				points = (endX+5)+","+p1Y+" "+(endX+5)+","+(endY-5)+" "+endX+","+endY;
			}
			arrowAttrs = this.getPolygonAttrObj(points,"black");
			this.setAttr(arrow,arrowAttrs);

			var line1 = $.svg('line').appendTo(this.container);
			var line1Attrs = this.getLineAttrObj(startX,mid1X,startY,mid1Y,"transparent","black");
			this.setAttr(line1,line1Attrs);

			var line2 = $.svg('line').appendTo(this.container);
			var line2Attrs = this.getLineAttrObj(mid1X,mid2X,mid1Y,mid2Y,"transparent","black");
			this.setAttr(line2,line2Attrs);

			var line3 = $.svg('line').appendTo(this.container);
			var line3Attrs = this.getLineAttrObj(mid2X,endX,mid2Y,endY,"transparent","black");
			this.setAttr(line3,line3Attrs);

		}
		
	};

	$.fn[pluginName] = function(commands,options){
		var obj = new MemDiagram(this,commands,options);
		return obj;	
	};
	
})(jQuery,window,document);
