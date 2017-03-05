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
the Ironscript scope in which the Javascript code runs through the `$scope` object. The evaluator
implements 31 distinct evaluation-rules/special-forms for S-Expressions.**

As a matter of fact, the languages and libraries mentioned above are much more mature, more
thoroughly tested and currently more usable than Ironscript. Yet, the true power of Ironscript
lies in its minimalism. The interpreter is about ~12KB minified and gzipped and it's fairly
expressive thanks to the LISP like syntax. The other powerful feature is the ability to write
Javascript alongside Ironscript in Ironscript source files. That makes it possible to use 
existing Javascript libraries and tools directly inside Ironscript. 



## Description of the Language

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
	+ append `:`


### Understanding the Terminology

There are several terms associated with programming in Ironscript. We mention a few of the key
terms and their 



### Understanding Evaluation

The evaluator is the core of the interpreter as mentioned earlier. This evaluator can evaluate S-Expressions 
on a **scope** provided to it. A **scope** is a set of bindings between symbols and values. (Read more about
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

2. 	If the S-Expression being evaluated is a list of S-Expression, 
	 	then the value of the first S-Expression of the list is the Form-marker.

	 	1. If the Form-marker is a function
	 		1. The rest of the list is the arguments list to the function
			2. The value of the S-Expression is the value of the function evaluated with the list of arguments.
		2. If the Form-marker is a reference to a **scope**
			1. The rest of the list is the pattern
			2. Match the pattern against the **RewriteRules** defined in the scope 
				 and get the resolution of the pattern.
			3. Value of the S-Expression is the value of the resolution evaluated on the current enclosing scope.
		3. If the Form-marker is a reference to a **stream**, 
			 then the value of the S-Expression is the current value of the stream.
			 The value of the S-Expression changes with the value of the stream.

			
			




	
There are **32 Special Symbols** and **31 Special Forms** defined in Ironscript. **Special Symbols** are Symbols
with predefined meanings and usage. **Special Forms** are S-Expression forms having predefined evaluation rules.

##### Special Symbols

**`_cons`**		|		**`_car`**		|		**`_cdr`**		|		**`_quote`**
--------------|-----------------|-----------------|---------------
**`_dot`**		|		**`_`**				|		**`_if`**			|		**`_def`**
**`_let`**		|		**`_assign!`**|		**`_set!`**		|		**`_try`**
**`_fn`**			|		**`_fr`**			|		**`_rho`**		|		**`_begin`**
**`_sync`**		| 	**`_coll`**		|		**`_seq`**		|		**`_map`**
**`_filter`**	|		**`_push`**		|		**`_pull`**		|		**`_pop`**
**`_stream`**	|		**`_do`**			|		**`_on`**			|		**`_include`**
**`_import`**	|		**`_self`**		|		**`_this`**		|		**`NIL`**


Internally Ironscript functions are asynchronous javascript functions invoked by the asynchronous 
**list evaluator** when needed. This **list evaluator** takes a `_cons` list or an atomic value, 
a scope and a callback as input, evaluates the list according to the Ironscript specifications using 
the scope provided and passes the result to the callback. The callback to this evaluator acts as the
Common Asynchronous Interface between native Javascript code, user written Javascript code and `_cons`
based Ironscript lists (S-Expressions). 

