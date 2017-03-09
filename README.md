# Ironscript <sub>Beta</sub>

**Author** : Ganesh Prasad   
**Email**: sir.gnsp@gmail.com


**Ironscript** is a minimal LISP like programming language implemented in Javascript. 
It is interpreted and the interpreter is written in ES2015 and transpiled using babel 
and rollup.js.Currently we have an interpreter that runs on browser and nodejs 
environment, a bundler to bundle ironscript packages into .js files for the interpreter 
running on browsers. 

## Why a new Programming Language ?!

Why, indeed ?

Before expolring the reasons of the *why*, I would prefer to mention that I am an individual
programmer and development of this *language* began as one of my "what-if" ideas, and that the 
initial design of this language is driven by the necessities of an individual developer, i.e. me.
I would also mention that, this is the first public version of Ironscript with a README. (All
versions prior to v1.2.1 lack any kind of documentation, hence this version is essentially the
first beta version)

Development of this programming language began out of the necessity to find an *easier way*
of doing async stuff without getting lost in callbacks and promises and their ilk. The term 
*easier way* does not necessarily mean a gentler learning curve, rather it is more about the 
expressive power of the solution. Moreover, the solution had to be light, minimal, 
interoperable with javascript in runtime, capable of metaprogramming, easy to learn and 
maintain for small development teams and individual developers.

Among the available solutions async.js possibly provies the most convenient and expressive
way of doing asynchronous programming, internally Ironscript interpreter uses async-es as a
dependency. But writing programs using async.js means writing a lot of callbacks anyway.

Functional programming with immutable/persistent data structures does provide a way of doing
asynchronous programming declaratively, like in Redux.js, Elm and clojurescript. Design of 
Ironscript is in some ways influenced by that of Elm and clojurescript, with the primary goal 
being minimalism, interoperability with Javascript and metaprogramming capabilities. 

In short I needed a programming language and/or libraries with the following capabilities:
	
1. Should provide a mechanism to express asynchronous flow of data easily, intuitively and concisely.
	
2. Preferably it should "call all its callbacks behind the screens" leaving a cconcise, readable
	 and intuitive api to integrate with existing javascript code.
	 i.e. it should abstract away the callbacks.
	
3. Should be light, minimal, easily extensible and with minimum dependencies.

The first requirement is met by async.js . But it did not abstract away all the callbacks. And after
much experimentation I came to the conviction that what I really wanted was a syntactical abstraction
over the callbacks to meet the second and third requirements. 

Therefore, a new programming language was to be developed to meet these requirements. 
Though Ironscript has been more about wrapping a minimal LISP like syntax over good old 
Javascript, this minimal LISP like syntax is a highly expressive and turing complete language
in itself and forms the core of Ironscript and the Ironscript interpreter interprets this
LISP like syntax only.

So to experiment with this idea of a syntactical abstraction I wrote a small S-Expression Parser 
and an asynchronous evaluator to evaluate those S-Expressions. These S-Expressions provided 
references to asynchronous functions that could be invoked as callbacks from the evaluator 
and their arguments. The evaluator supported a few essential LISP/Scheme inspired special forms 
like `_def`, `_if`, `_fn`, `_quote`, `_cons`, `_car`, `_begin` and `_cdr`. The evaluator also 
provided mechanism convert Javascript functions, both synchronous and asynchronous, into functions 
that could be invoked asynchronously by the evaluator. The evaluator was/is dependent on only 
4 functions from async-es.

With this initial implementation it was possible for me to do asynchronous operations on data using
a LISP like functional syntax while writing the actual functions in Javascript as well as S-Expressions.

Eventually as I experimented more with this initial implementation, I discovered certain mutually
orthogonal patterns that could be provided special forms in the language and the language evolved into
what it is now.

**Ironscript is essentially an asynchronous S-Expression evaluator interoperable with Javascript
through a minimal API containing `$return`, `$yield`, `$throw`, `$catch` functions and a reference to 
the Ironscript scope in which the Javascript code runs as the `$scope` object. The evaluator
implements 10 evaluation-rules and 27 special-forms to evaluate S-Expressions.**

As a matter of fact, the languages and libraries mentioned above are much more mature, more
thoroughly tested and currently more usable than Ironscript. Yet, the true power of Ironscript
lies in its minimalism. The interpreter is about ~12KB minified and gzipped and it's fairly
expressive thanks to the LISP like syntax. The other powerful feature is the ability to write
Javascript alongside Ironscript in Ironscript source files. That makes it possible to use 
existing Javascript libraries and tools directly inside Ironscript. 



## Description of the Language

### Understanding the Terminology

There are several terms associated with programming in Ironscript. We mention a few of the key
terms and define them here before going further into the document.

##### Symbol
Anything that does not have a literal value. Reserved words are termed as **special symbol**s. 
Identifiers or names are symbols too. The symbols that start with **`@`** are **reference symbols**.
Unless a symbol is bound to any other value, the value of the symbol is itself.


##### Reference Symbol
A reference symbols are more relatable to a C++ reference. They can be bound to values only once in a scope.
Once bound to a value, their values will not change. And if a reference is bound to a value
which is a symbol or list of symbols, then the reference can be used as LValue in a `_def`/`_let` form.
In this case the symbol or list of symbols bound as the value of the reference will be used as the actual LValue
for the `_def`/`_let` form.  (The `_def`/`_let` form binds symbols to values)

Reference symbols are used to capture expressions in the `_rho` rewriter.

_An USEFUL SIDE EFFECT: A reference symbol bound to a non-symbolic value is essentially a **constant** ._


##### Special Symbols

There are 36 special symbols defined in Ironscript.

**`_cons`**		|		**`_car`**		|		**`_cdr`**		|		**`_quote`**
--------------|-----------------|-----------------|---------------
**`_dot`**		|		**`_`**				|		**`_if`**			|		**`_def`**
**`_let`**		|		**`_assign!`**|		**`_set!`**		|		**`_try`**
**`_fn`**			|		**`_fr`**			|		**`_rho`**		|		**`_begin`**
**`_sync`**		| 	**`_coll`**		|		**`_seq`**		|		**`_map`**
**`_filter`**	|		**`_push`**		|		**`_pull`**		|		**`_pop`**
**`_stream`**	|		**`_do`**			|		**`_on`**			|		**`_include`**
**`_import`**	|		**`_self`**		|		**`_this`**		|		**`NIL`**
**`_true`**   |   **`_false`**  |   **`_all`**    |


Among these **special symbol**s `_self`, `_this`, `_true`, `_false` and `NIL` have predefined values bound to them. 
`_all` has contextual semantics in the `_import` special form. `(_import <filepath> _all)` imports all names defined 
in the Ironscript module at filepath.
The other **special symbol**s are bound with **special form**s.

**`_self`** always refers to the current **scope**.  
**`_this`** always refers to the current **collection**.  
**`_true`** is the truth. (boolean true)
**`_false`** is essentially the lie !!! (boolean false)
**`NIL`** is the empty list () and is equivalent to null in Javascript.  

Each **special symbol**, with the exception of `NIL`, starts with `_`, though `_` is not restricted 
to be used only in **special symbols**. Functions predefined in the global scope, like `_echo` and `_eval`
etc start with `_` too. 


##### Scope
A scope is a set of bindings between symbols and values. Scopes are dynamic in Ironscipt, but
Lexical scoping is available through the `_begin` **special form**.

##### Form
A form is a class of **S-Expressions** which follow a **defined** structue and semantics of evaluation.

##### Special Form
A special form is a class of **S-Expression**s which follow a **predefined** structure and semantics of evaluation.
There are 27 special forms defined in Ironscript.

##### Cell
A cell is a **cons cell** or a **dotted pair**. [Read here](https://en.wikipedia.org/wiki/Cons) for more info.
In Ironscript instead of **dotted pair**s are written as `(a : b)` instead of `(a . b)` and `:` is called the
**construct operator**.

A cell has 2 fields, the **car** field and the **cdr** field. For people acquainted with the concept of singly
linked lists, a cell is equivalent to a *node in a singly linked list* where  the **car** field is equivalent to 
the *value* field of of the node and the **cdr** field is equivalent to the *next* field of the node.

##### S-Expression
[Read here](https://en.wikipedia.org/wiki/S-expression) about S-Expression in the context of LISP. 
The grammar of this document section defines the syntactical structure of an S-Expression. **Cell**s
are the building blocks of S-Expressions.

##### Stream
A stream is a container for a value which changes depending on zero or more streams and/or values.
We can say that streams are containers for live values.

##### Collection
A collection is a container of key-value pairs, collections are equivalent to Javascript Objects 
which can hold values specific to Ironscript, like streams, and be passed to and used in Javascript code
just like any other Javascript Object created with `Object.create(null)`.

#### Sequence
A sequence is a contained/wrapped Javascript Array. Though Ironscript is built around `_cons` based lists, sequences
provide better performance on data for obvious reasons.

#### LValue and RValue
Anything that can be bound to a value using a `_def`/`_let` or `_assign!`/`_set!` is a LValue.  
The value being bound to the LValue is the RValue. See the `_def` / `_let` special form section for more info.


### The Grammar

* Comments start with ';' and end with '\n' (newline).
* An Ironscript program is an S-Expression. example: `( _begin (_echo "Hello") (_echo "World !") )`
*	An S-Expression is
	+ An Atom
	+ A space separated list of S-Expressions enclosed within ( and ) or [ and ] or { and }
	+ An expression of the form (*a* : *b*) or [*a* : *b*] or {*a* : *b*} 
		where *a* is a space separated list of S-Expressions and *b* is an S-Expressions.
* An Atom is 
	+ a number, examples: 1 1.0 -1 0.1 3.141592653 1024
	+ a string, examples: "Hello world" "John Doe"
	+ a block of Javascript code enclosed within @{ and }@
	+ a symbol, anything that is not a number, string, block of code nor S-Expression. example: concat, _echo, _begin, NIL, myVar

* Operators are
	+ Parentheses `(` and `)`
	+ Braces `{` and `}` 
	+ Brackets `[` and `]`
	+ dot `.`
	+ quote `'`
	+ construct `:`





### Understanding the Evaluator

The evaluator is the core of the interpreter as mentioned earlier. This evaluator can evaluate S-Expressions 
in a **scope** provided to it. A **scope** is a set of bindings between symbols and values. (Read more about
scopes in the 'Understanding Scope' section)

The evaluator follows the following rules.

#### Evaluation Rules

1. If the S-Expression being evaluated is an Atom 
	
	1. If the S-Expression is a number, then its value is the number
	2. If the S-Expression is a string, then its value is the string
	3. If the S-Expression is a block of Javascript code enclosed within @{ and }@, 
		then its value is the ironscript function constructed from the block of code.
	
	4.	If the S-Expression is a symbol
		1. If the S-Expression is a special symbol, then it has a predefined value.
		2. the symbol has a value bound to it in the scope
		3. the value of the symbol is the symbol itself

2. If the S-Expression being evaluated is a list of S-Expression, 
	 then the value of the first S-Expression of the list is the Form-marker.
	
	1. If the Form-marker is a **special symbol** with a **special form** bound to it, 
		then the value of the S-Expression is evaluated according to the **special form**'s evaluation semantics.
	
	2. If the Form-marker is a function
		1. The rest of the list is the arguments list to the function
		2. The value of the S-Expression is the value of the function evaluated with the list of arguments.
	
	3. If the Form-marker is a reference to a **defined form**
		then the rest of the list evaluated according to the defined form is the value of the S-Experssion.
	
	4. If the Form-marker is a reference to a **scope**
		1. The rest of the list is the pattern
		2. Match the pattern against the **RewriteRules** defined in the scope 
			 and get the resolution of the pattern.
		3. Value of the S-Expression is the value of the resolution evaluated on the current enclosing scope.
	
	5. If the Form-marker is a reference to a **stream**, 
		 then the value of the S-Expression is the current value of the stream.
		 The value of the S-Expression changes with the value of the stream.
	
	6. Othewise the value of the S-Expression is the S-Expression itself.


#### Special Forms

As mentioned earlier, there are 27 **Special forms** defined in Ironscript. Here we will describe each of the
**Special forms** in brief.

----------------------------------

### `_cons`

**form** : `(_cons x y)`

Where *x* and *y* are S-Expressions.  
Value of this form is a **cell** whose **car** field is the value of *x* and **cdr** field is the value of *y*.


**examples**
    
    (_cons 1 2 )      ; evaluates to ( 1 : 2 )
		(_cons 1 (2) )    ; evaluates to ( 1 2 )
		(_cons 1 NIL )    ; evaluates to (1)




----------------------------------


### `_car`

**form** : `(_car x)`

Where *x* is an S-Expression.  
If the value of *x* is a List, then value of this form is the **car** field of the first cell (root node) of the list.  
Else the value of this form is `NIL`.


**examples**

    (_car ( 1 2 ) )     ; evaluates to 1
		(_car ( (1 2) 3) )  ; evaluates to ( 1 2 )
		(_car 1)            ; evaluaes to NIL



----------------------------------


### `_cdr`
		
**form** : `(_cdr x)`

Where *x* is an S-Expression.  
If the value of *x* is a List, then value of this form is the **cdr** field of the first cell (root node) of the list.  
Else the value of this form is `NIL`.


**examples**
    
    (_cdr (1 2) )      ; evaluates to (2)
		(_cdr (1 :2) )     ; evaluates to 2
		(_cdr 1)           ; evaluates to NIL




----------------------------------



### `_quote`

**form** : `(_quote x)` or `'x`

Where *x* is an S-Expression.  
Value of this form is *x*.


**examples**

    (_quote x)      ; evaluates to x
		(_quote (a b))  ; evaluates to (a b)
		'a              ; evaluates to a
		'(a b)          ; evaluates (a b)
		'(+ 3 4)        ; evaluates to (+ 3 4)


----------------------------------


### `_dot`

**form** : `(_dot p q r ... )` or `p.q.r...`

Where *p* is an S-Expression whose value is a **collection**.   
*q* , *r* and the rest of the list are keys.  
Value of this form is a reference to a value identified by the application of the keys in succession.  

As **collections** are equivalent to Javascript Objects, this form is equivalent to the subscript notation
in Javascript. For example the Ironscript equivalent of `Obj[key1][key2][key3]` would be `(_dot Obj key1 key2 key3)`,
and the equivalent of `Obj.key1.key2.key3` would be `Obj.key1.key2.key3`.


**examples**
   	
    (_let lang {} )                   ; lang is a collection, 
		                                  ; JS equivalent: let lang = {}
    (_let lang.name 'Ironscript')     ; lang.name = 'ironscript'
		(_let lang.version '1.2')         ; lang.version = '1.2'

		(_echo lang.name)                 ; prints Ironscript
		(_echo lang.version)              ; prints 1.2

    ; we can also define lang like the following

    (_let lang {
		  (_let .name 'Ironscript')
			(_let .version '1.2')
		})


----------------------------------


### `_`

**form** : `(_ x)`

Where *x* is an S-Expression.  
Value of this form is the *value of value of* x.  
It can be said that `_` is the semantic opposite of `_quote` or `'`.

**examples**
		
		'(+ 3 4)           ; evaluates to (+ 3 4)
    (_ '(+ 3 4))       ; evaluates yo 7


----------------------------------


### `_if`

**form** : `(_if cond then else)`

Where *cond*, *then* and *else* are S-Expressions.  
Value of this form is value of *then* if value of *cond* is a Truthy value in Javascript, otherwise the value of *else*.

**examples**

    (_if (_true) (_echo a) (_echo b) )    ; prints a
		(_if (_false) (_echo a) (_echo b) )   ; prints b



----------------------------------


### `_def` / `_let`

**`_def` and `_let` are special symbols bound to this special form. Hence, `(_def ...)` and `(_let ...)` are
semantically identical.**

**form** : `(_def x y)` or `(_let x y)`

Where *x* is a (1) **Symbol** or a (2) **list of Symbols** or a (3) **reference to a field in a collection** 
or a (4) **constant symbol** whose value is either (1) or (2) or (3).
If *x* is not (1) or (2) or (3) or (4) then it's not a valid LValue.


**Note that a *list of symbols* is a linear list of symbols, it can not contain nested lists or references**
*y* is an S-Expression. Value of *y* is expected to be a list of values if *x* is a list of symbols.

The form bind the symbols or references in the LValue to the values in the RValue.

**examples**

		(_let a 1)              ; value 5 is bound to the symbol a
		(_echo a)               ; prints 1
		
		(_let @b 2)             ; @b is a reference symbol with a value 2
														; now @b is essentially a constant
		(_echo @b)              ; prints 2

		(_let @b 3)             ; Fails, because @b is a constant

		(_let @c b)             ; @c is a reference symbol to symbol b
                            ; notice that @b and b are different

		(_echo @c)              ; prints b
		(_echo b)               ; prints b
		
		
		(_let @c 4)             ; Because @c is a reference symbol to b,
                            ;	b is bound to 4 and @c still referes to b
		
		(_echo @c)              ; prints b
		(_echo b)               ; prints 4

		(_let (x y) (2 3) )     ; x is bound to 2, y is bound to 3
		(_echo x y)             ; prints 2 3

		(_let (x :y) (1 2 3))   ; x is bound to 1, y is bound to (2 3)





Internally Ironscript functions are asynchronous javascript functions invoked by the asynchronous 
**list evaluator** when needed. This **list evaluator** takes a `_cons` list or an atomic value, 
a scope and a callback as input, evaluates the list according to the Ironscript specifications using 
the scope provided and passes the result to the callback. The callback to this evaluator acts as the
Common Asynchronous Interface between native Javascript code, user written Javascript code and `_cons`
based Ironscript lists (S-Expressions). 
