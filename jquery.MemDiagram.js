;
(function($,window,document,undefined){
	var pluginName = "MemDiagram";
	var defaults = {
		//preStep:"#preStep",
		//nextStep:"#nextStep"
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
		this.settings = $.extend({}, defaults, options);
		this.element = element;
		this.commands = commands;
		var cmd2step = new Cmd2Step(commands);
		this.steps = cmd2step.loadSteps();
		this.stepCounter = 0;
		
		this.init();
		this.displayStep();
		//$("#text").text(JSON.stringify(this.steps[this.stepCounter],null,'	')).css("border","solid");	
	};

	MemDiagram.prototype = {
		init:function(){
			//create stack and heap containers
			$("<div></div>").appendTo(this.element).attr("id","stack");
			$("<div></div>").appendTo(this.element).attr("id","heap");
			var _this = this;
			
			$(document).bind("keydown",function(event){
				if(event.which===39){
					_this.nextStep();
				}
				else if(event.which===37){
					_this.previousStep();
				}
			})
		},
		createStackFrame:function(func){
			var name = func.funcName;
			var container = $("<div></div>").appendTo($("#stack")).attr("class","stack-frame-container").attr("id",name).css("display","none");
			var funcNm = $("<div></div>").appendTo(container).attr("class","function-name").text(name);
			var stackFrame = $("<div></div>").appendTo(container).attr("class","stack-frame css_table");
			var varsNum = func.vars.length;
			for(var i=0; i<varsNum; i++){
				var tr = $("<div></div>").appendTo(stackFrame).attr("class","css_tr");
				$("<div></div>").appendTo(tr).attr("class","type css_td").text(func.vars[i].type);
				$("<div></div>").appendTo(tr).attr("class","name css_td").text(func.vars[i].name);
				if(func.vars[i].pointer===undefined){
					$("<div></div>").appendTo(tr).attr("class","value css_td").text(func.vars[i].value);
				}
				else{
					$("<div></div>").appendTo(tr).attr("class","pointer css_td").text(func.vars[i].pointer);
				}
				$("<div></div>").appendTo(tr).attr("class","address css_td").text(func.vars[i].address);
			}
			container.fadeIn("slow");
			//container.animate({left:'200px'}).fadeOut("slow");
			return container;

		},
		createHeapvar:function(heapvars){
			var heapvarsNum = heapvars.length;
			var heapVarTable = $("<div></div>").appendTo("#heap").attr("class","heapvarTable css_table").css("display","none");

			for(var i=0; i<heapvarsNum; i++){
				var tr = $("<div></div>").appendTo(heapVarTable).attr("class","css_tr");
				$("<div></div>").appendTo(tr).attr("class","value css_td").text(heapvars[i].value);
				$("<div></div>").appendTo(tr).attr("class","address css_td").text(heapvars[i].address);
			}
			heapVarTable.fadeIn("slow");
		},
		refresh:function(){
			$(".stack-frame-container").remove();
			$(".heapvarTable").remove();
		},
		
		previousStep:function(){
			this.stepCounter -= 1;
			if(this.stepCounter<0){
				alert("This is the first step");
				this.stepCounter = 0;
			}

			this.displayStep();
		},
		nextStep:function(){
			this.stepCounter += 1;
			if(this.stepCounter > (this.steps.length - 1)){
				alert("This is the last step");
				this.stepCounter = this.steps.length - 1;
			}
			
			this.displayStep();
		},
		// Match pointers with pointed variables
		
		displayStep:function(){
			//this.refresh();
			var currentStep = this.steps[this.stepCounter];
			var funcNum = currentStep.func.length;
			displayAllElem(currentStep,funcNum);
			// if(moveDir==="next"){
			// 	var preStep = this.steps[this.stepCounter-1];
			// 	var preFuncNum = preStep.func.length;
			// 	if(funcNum<preFuncNum){
			// 		//this.removeStackFrame();
			// 		//this.updateStackFrame(funcNum,currentStep.func);
			// 		this.displayAllElem(currentStep,funcNum);
			// 	}
			// 	else if(funcNum>preFuncNum){
			// 		this.createStackFrame(currentStep.func[funcNum-1]);
			// 	}
			// 	else{
			// 		this.displayAllElem(currentStep,funcNum);
			// 	}
			// }
			// else {
			// 	this.displayAllElem(currentStep,funcNum);
			// }			
						
		},
		displayAllElem:function(currentStep,funcNum){
			this.refresh();
			for(var i=0; i<funcNum;i++){
				this.createStackFrame(currentStep.func[i]);
			}
			this.createHeapvar(currentStep.heapvars);
		},
		setStyles:function(){
			
		},
		findPointers:function(){

		}
	}


	$.fn[pluginName] = function(commands,options){
		var obj = new MemDiagram(this,commands,options);
		return obj;	
	};
	
})(jQuery,window,document);
