
### Usage
Call the plugin on a container as you wish and pass a set of pre-defined commands to the plugin. You can also pass options to customize the plugin in some extent. The available options will be discussed later.

~~~javascript
$('#container').MemDiagram(commands,options)
~~~

<!--The title to be decided later-->
### Commands
There are eight commands for describing steps. They are listed as follow:

Notes for the object descriptions:

1. a value surrounded by < > refers to a compound object described elsewhere, or obvious like <string>.
2. [ ... ] is an array.

##### 1. Add stack frame
Add a new stack frame to the diagram. For example, most diagrams would start with adding the main function's stack frame.

Example:

~~~
command:"stackadd",
details:{
	name:"main",
	decls:[{type:"int",name:"x",value:"4",scopeLevel:0,address:"0x100"}]
}
~~~
The `name` key specifies the name of the function. The `decls` key specifieds the local variables declared in the function. Variable declaration will be explained later.

##### 2. Remove stack frame
Remove the last stack frame added to the diagram.

Example:

~~~
command:"stackrem",
returnVal:0,
returnLoc:0x100
~~~
The `returnVal` key defines the return value of this function, it is optional. The `returnLoc` key is also optional, it is an address which is the return location of the function if it has any return value.

##### 3. Variable declaration

Add a new variable to the current stack frame.

Example:

~~~
command:"varadd",
decl:{
	type:"int",
	name:"x",
	value:"4",
	scopeLevel:0,
	address:"0x100"
}
~~~

The `type`,`name`,`value`,`address` keys are relatively straight forward to understand, they defines the variable's type, name, value and the address where it stores respectively. The `scopeLevel` key is created for dealing with the name-shadowing problem. The library allows variables have the same name as long as they are in different scope levels. It is set to `0` by default, which represents the function scope. If there is a block scope variable has the same name with a function scope variable, then the scopeLevel of that block scope variable should be increase to differentiate those two variables.

The declaration of a pointer variable can be done like this:

~~~
command:"varadd",
decl:{
	type:"int*",
	name:"xptr",
	pointer:"0x100",
	scopeLevel:0,
	address:"0x101"
}
~~~

Instead of using `value` key to define its value, here we use `pointer` key to do the job. Since the library is not going to examine the content of the value, the `pointer` key allows the library to know that the variable defined here is a pointer. And the value of this key is an address which points to a variable.

The declaration of an array can be done like this:

~~~
command:"varadd",
decl:{
	type:"int[]",
	name:"arr",
	value:[1,2,3,4],
	length:4,
	scopeLevel:0,
	address:"0x100"
}
~~~

The length of the array is defined in the `length` key and the `address` key defines the address of the first element in the array. The address for the rest of the elements will be generated by the library automatically.

##### 4. Variable remove

Remove the variable from the current stack frame.

Example:

~~~
command:"varrem",
decl:{
	type:"int",
	name:"x",
	scopeLevel:0
}
~~~

##### 5. Change variable value

Change the value of a variable.

Exampe:

~~~
command:"varmod",
decl:{
	type:"int",
	name:"x",
	value:"8",
	scopeLevel:"0"
}
~~~

The `value` key defines the new value of the variable.

##### 6. Variable declaration in the heap

Similar to the 3rd command, add a variable in the heap. Since we don't create a variable in the heap(those are always on the stack), we are creating an area of memory which can contain values, which can then be referenced by pointers from variables on the stack, the variables in the heap don't have types nor names.

Example:

~~~
command:"varadd_heap",
decl:{
	type:"int",
	value:"4",
	address:"0x400"
}
~~~

The `pointer` and `array` declaration are similar to the stack version.

##### 7. Remove variable from the heap

Similar to the 4th command, remove a variable from the heap.

Example:

~~~
command:"varrem_heap",
decl:{
	address:"0x400"
}
~~~

The `address` key specifies the address of the variable to be removed.

##### 8. Change value of the variable in the heap

Similar to the 5th command, change the value of a variable in the heap.

Example:

~~~
command:"varmod_heap",
decl:{
	value:"100",
	address:"0x400"
}
~~~

### Options