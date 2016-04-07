;
(function($,window,document,undefined){
	var pluginName = "MemDiagram";
	var defaults = {
		width:1000,
		height:800,
		stackWidth:600,
		heapWidth:300,
		stackFrameWidth:400,
		heapVarWidth:200,
		varUnitHeight:30,
		stackFrameOffset:50
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
				//stepObj.ptrs = [];//pointers
				//stepObj.heapvars = [];
				this.steps[index].func = [];
				this.steps[index].heapvars = [];
				this.steps[index].func.push(stepObj);
			}
			else{
				this.tempStep = $.extend(true,{},this.steps[index-1]);
				var stepObj = {};
				stepObj.funcName = this.stepDesc[index].details.name;
				stepObj.vars = this.stepDesc[index].details.decls;
				//stepObj.ptrs = [];//pointers
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
						arrElem.value = stepObj.value[i];
						arrElem.scopeLevel = stepObj.scopeLevel;
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
					if(stepObj.name==varsObj[i].name && stepObj.scopeLevel==varsObj[i].scopeLevel){
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
		varAdd_heap:function(index){
			this.tempStep = $.extend(true,{},this.steps[index-1]);
			
			var stepObj = this.stepDesc[index].decl;
			this.tempStep.heapvars.push(stepObj);
			this.steps.push(this.tempStep);
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
		this._defualts = defaults;
		this.element = element;
		this.settings = $.extend({}, defaults, options);
		this.commands = commands;
		var cmd2step = new Cmd2Step(commands);
		this.steps = cmd2step.loadSteps();
		this.stepCounter=0;
		this.originX_stack = 100;
		this.originY_stack = 100;
		this.originX_heap = 700;
		this.originY_heap = 100;
		this.init();
		this.displayStep();
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
				"overflow":"hidden"
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
				"viewBox":"0 0 1000 800",
				"preserveAspectRatio":"xMinYMin meet",
				"class":"svg-content"
			};
			var dom = this.container[0];
			this.setAttr(dom,containerAttrs);

			var stackTitle = $.svg("text").appendTo(this.container).text("STACK");
			var stackTitleAttrs = this.getTextAttrObj(300,80,40,"middle","keyElem");
			this.setAttr(stackTitle,stackTitleAttrs);

			var heapTitle = $.svg("text").appendTo(this.container).text("HEAP");
			var heapTitleAttrs = this.getTextAttrObj(800,80,40,"middle","keyElem");
			this.setAttr(heapTitle,heapTitleAttrs);

			var sepLine = $.svg("line").appendTo(this.container);
			var sepLineAttrs = this.getLineAttrObj(600,600,0,this.settings.height,"transparent","black","keyElem");
			this.setAttr(sepLine,sepLineAttrs);

			var _this = this;
			$(document).bind("keydown",function(event){
				if(event.which===39){
					_this.moveForward();
				}
				else if(event.which===37){
					_this.moveBack();
				}
			})

		},
		clear:function(){
			$("svg").children().not(".keyElem").remove();
			this.originX_stack = 100;
			this.originY_stack = 100;
			this.originX_heap = 700;
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
			//var sfHeight = height+this.settings.stackFrameOffset;
			if(reqHeight>this.settings.height){
				$("svg").attr("height",reqHeight);
				$("line.keyElem").attr("y2",reqHeight);
			}

			var funcTitleText = func.funcName+"()";
			var funcTitle = $.svg("text").appendTo(this.container).text(funcTitleText);
			var funcTitleAttrs = this.getTextAttrObj(x/2,y+height/2,20,"middle");
			this.setAttr(funcTitle,funcTitleAttrs);

			for(var i=0; i<varsNum; i++){
				var varUnit = $.svg("rect").appendTo(this.container);
				var varUnitAttrs = this.getRectAttrObj(x,y,varUnitWidth,varUnitHeight,"black","transparent");
				this.setAttr(varUnit,varUnitAttrs);

				var type = $.svg("text").appendTo(this.container).text(func.vars[i].type);
				var name = $.svg("text").appendTo(this.container).text(func.vars[i].name);
				var address = $.svg("text").appendTo(this.container).text(func.vars[i].address);
				var value;

				var typeAttrs = this.getTextAttrObj(150,y+varUnitHeight-10,20,"middle","type");
				var nameAttrs = this.getTextAttrObj(250,y+varUnitHeight-10,20,"middle","name");
				var addressAttrs = this.getTextAttrObj(450,y+varUnitHeight-10,20,"middle","address");
				var valueAttrs;
				if(func.vars[i].pointer!==undefined){
					value = $.svg("text").appendTo(this.container).text(func.vars[i].pointer);
					valueAttrs = this.getTextAttrObj(350,y+varUnitHeight-10,20,"middle","pointer");
				}
				else{
					value = $.svg("text").appendTo(this.container).text(func.vars[i].value);
					valueAttrs = this.getTextAttrObj(350,y+varUnitHeight-10,20,"middle","value");
				}
				this.setAttr(type,typeAttrs);
				this.setAttr(name,nameAttrs);
				this.setAttr(address,addressAttrs);
				this.setAttr(value,valueAttrs);

				y = y+varUnitHeight;
			}
			var line1 = $.svg("line").appendTo(this.container);
			var line1Attrs =  this.getLineAttrObj(300,300,initY,y,"transparent","black");
			this.setAttr(line1,line1Attrs);

			var line2 = $.svg("line").appendTo(this.container);
			var line2Attrs =  this.getLineAttrObj(400,400,initY,y,"transparent","black");
			this.setAttr(line2,line2Attrs);

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
				$("svg").attr("height",reqHeight);
				$("line.keyElem").attr("y2",reqHeight);
			}

			for(var i=0; i<varsNum;i++){
				var varUnit = $.svg("rect").appendTo(this.container);
				var varUnitAttrs = this.getRectAttrObj(x,y,varUnitWidth,varUnitHeight,"black","transparent");
				this.setAttr(varUnit,varUnitAttrs);

				var value = $.svg("text").appendTo(this.container).text(heapvars[i].value);
				var address = $.svg("text").appendTo(this.container).text(heapvars[i].address);

				var valueAttrs = this.getTextAttrObj(750,y+varUnitHeight-10,20,"middle","value");
				var addressAttrs = this.getTextAttrObj(850,y+varUnitHeight-10,20,"middle","address");

				this.setAttr(value,valueAttrs);
				this.setAttr(address,addressAttrs);

				y = y+varUnitHeight;
			}

			var line = $.svg("line").appendTo(this.container);
			var lineAttrs =  this.getLineAttrObj(800,800,initY,y,"transparent","black");
			this.setAttr(line,lineAttrs);
		},
		moveBack:function(){
			this.stepCounter -= 1;
			if(this.stepCounter<0){
				alert("This is the first step");
				this.stepCounter = 0;
			}

			this.displayStep();
		},
		moveForward:function(){
			this.stepCounter += 1;
			if(this.stepCounter > (this.steps.length - 1)){
				alert("This is the last step");
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
		getY:function(element){
			return $(element).attr("y");
		},
		getX:function(element){
			return $(element).attr("x");
		},
		matchPointers:function(){
			var pointers = $('.pointer');
			var _this = this;
			pointers.each(function(){
				var $this = this;
				var ptrY = _this.getY($this);
				
				var values = $('.address');
				values.each(function(){
					if($($this).text()===$(this).text()){
						var valY = _this.getY(this);
						var valX = _this.getX(this);

						_this.drawConnection(ptrY,valY,valX);
					}
				});
			});
		},
		drawConnection:function(ptrY,valY,valX){
			var startX,startY,mid1X,mid1Y,mid2X,mid2Y,endX,endY;
			startX = 400;
			startY = ptrY;
			mid1X = mid2X = 550;

			if(valX>700){
				endX = 700;
			}
			else{
				endX = 400;
			}
			endY = valY;
			mid1Y = startY;
			mid2Y = endY
			
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
