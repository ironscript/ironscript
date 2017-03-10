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

**tl;dr; Why walk through the dangers of the _callback hell_ , when you can _functional_ ?
Write _functional_ like LISP and/or write JS inside it, Ironscript will do it asynchronously.
Say bye to writing logic(?) using callbacks.**



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

There are 37 special symbols defined in Ironscript.

**`_cons`**   |   **`_car`**    |   **`_cdr`**    |   **`_quote`**
--------------|-----------------|-----------------|---------------
**`_dot`**    |   **`_`**       |   **`_if`**     |   **`_def`**
**`_let`**    |   **`_assign!`**|   **`_set!`**   |   **`_try`**
**`_fn`**     |   **`_fr`**     |   **`_rho`**    |   **`_begin`**
**`_sync`**   |   **`_coll`**   |   **`_seq`**    |   **`_map`**
**`_filter`** |   **`_push`**   |   **`_pull`**   |   **`_pop`**
**`_stream`** |   **`_do`**     |   **`_on`**     |   **`_include`**
**`_import`** |   **`_self`**   |   **`_this`**   |   **`NIL`**
**`_true`**   |   **`_false`**  |   **`_all`**    |   **`_err`**


Among these **special symbol**s `_self`, `_this`, `_true`, `_false` and `NIL` have predefined values bound to them. 
`_all` has contextual semantics in the `_import` special form. `(_import <filepath> _all)` imports all names defined 
in the Ironscript module at filepath.   
`_err` is defined in the scope of the **catch** S-Expression in the `_try` special form.
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

**Scopes can be synced or unsynced.** A **synced scope** is a scope where symbols can be bound to values.
When a scope is **unsynced** symbols can not be bound to values.

Scopes are **unsynced by default**, only the *`_begin` and `_coll` special form create scopes which are synced by default.*
An unsynced scope can be synced for evaluation of a set of expressions using the `_sync` special form.


##### Form
A form is a class of **S-Expressions** which follow a **defined** structue and semantics of evaluation.

##### Special Form
A special form is a class of **S-Expression**s which follow a **predefined** structure and semantics of evaluation.
There are 27 special forms defined in Ironscript.

##### Cell
A cell is a **cons cell** or a **dotted pair**. [Read here](https://en.wikipedia.org/wiki/Cons) for more info.
In Ironscript **dotted pair**s are written as `(a : b)` instead of `(a . b)` and `:` is called the
**construct operator**.

A cell has 2 fields, the **car** field and the **cdr** field. For people acquainted with the concept of singly
linked lists, a cell is equivalent to a *node in a singly linked list* where  the **car** field is equivalent to 
the *value* field of of the node and the **cdr** field is equivalent to the *next* field of the node.

##### S-Expression
[Read here](https://en.wikipedia.org/wiki/S-expression) about S-Expression in the context of LISP. 
The grammar of this document section defines the syntactical structure of an S-Expression. **Cell**s
are the building blocks of S-Expressions.

##### Stream
A stream is a container for a value which may changes asynchronously depending on zero or more streams and/or values.
We can say that streams are containers for live values. A stream contains the value, an **asynchronous core-function** to
evaluate the value and a list of values **(dependencies list)** passed as arguments to the core-functions. When any of the values
in the dependencies list changes, the core-function is called and a new value is evaluated.

Based on the core-function, there are 2 types of streams. **Pure streams** and **Impure streams**.

The **core function of a pure stream** is a **pure function**. A pure function is a function which has
no side effects on the environment it's running on. The output of a pure function is identical for
identical sets of inputs. In short pure functions are stateless. For example the `+` function in Ironscript 
is a pure function whereas `_echo` is not a pure function. 

**Impure streams** are simply **not pure streams**.



##### Collection
A collection is a container of key-value pairs, **collections are equivalent to Javascript Objects** 
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
* An S-Expression is
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
  
  4.  If the S-Expression is a symbol
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
    2. Match the pattern against the **Rewrite rules** defined in the scope 
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
or a (4) **reference symbol** whose value is either (1) or (2) or (3).
If *x* is not (1) or (2) or (3) or (4) then it's not a valid LValue.


**Note that a *list of symbols* is a linear list of symbols, it can not contain nested lists or references**
*y* is an S-Expression. Value of *y* is expected to be a list of values if *x* is a list of symbols.

The form **binds the symbols or references** in the LValue to the values in the RValue **in current scope**.
The form binds symbols to values **only if the current scope is a synced scope**

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
                            ; b is bound to 4 and @c still referes to b
    
    (_echo @c)              ; prints b
    (_echo b)               ; prints 4

    (_let (x y) (2 3) )     ; x is bound to 2, y is bound to 3
    (_echo x y)             ; prints 2 3

    (_let (x :y) (1 2 3))   ; x is bound to 1, y is bound to (2 3)



----------------------------------




### `_assign!` / `_set!`

**`_assign!` and `_set!` are special symbols bound to this special form. Hence, `(_assign! ...)` and `(_set! ...)` are
semantically identical. These are appended with ! to signify that these should be used carefully.**

**form** : `(_assign! x y)` or `(_set! x y)`

Where *x* is a **Symbol** and *y* is an **S-Expression**.

If *x* is **not** bound to a value in **current scope** then the form finds the **nearest scope up the scope chain** where
*x* is bound to a value and updates *x* there with value of *y*.

If *x* is bound to a value in the **current scope**, then its value is updated to the value of *y*.
The form binds the value to *x*  **only if the scope where x is found is a synced scope**.



**example**
    
    (_let a 1)            ; a is bound to 1
    (_set! a 2)           ; now a is bound to 2


----------------------------------



###  `_try`

**form** : `(_try expr catch)`

Where *expr* and *catch* are S-Expressions. If value of *expr* is evaluated without any error then then value of the form
is value of *x*, else the value of the form is value of *catch* evaluated in a scope where `_err` is bound to the error.

**examples**

    (_try 
      (_let 1 1) 
      (_echo _err)
    ) 
    
    ; prints the error "1 is not a valid LValue ..."



----------------------------------



### `_fn` 

**form** : `(_fn params body)`

Where *params* is a list of symbols and *body* is an S-Expression. The value of this form is an **anonymous function**.
When the function is called its **arguments are evaluated asynchronously** and when all arguments have been evaluated the
body of the function is evaluated in a scope where parameters are bound to the values of the arguments.

**examples**

    (_let twice (_fn (x) (* 2 x) ) )         ; define a function twice
    (twice 2)                                ; evaluates to 4

    (_let factorial (_fn (n)                 ; define factorial 
      (_if (=== n 0) 
        1
        (* n (factorial (- n 1) ) )          ; recursively call factorial
      )
    ) )
        
    (factorial 5)                            ; evaluates to 120




----------------------------------



### `_fr`

**form** : `(_fr params body)`

Where *params* is a list of symbols and *body* is an S-Expression. Its usage is identical to that of `_fn`,
but its value is an **anonymous form**. When the form is evaluated the **arguments are by default quoted**
and the value of the form is the value of the body evaluated in a scope where the parameters are bound to 
the arguments.

**examples**

    ; Implementation of the LISP cond macro using _fr
    ; Note the use of _ to evaluate the args when needed, 
    ; because the args are passed implicitly quoted.


    (_let cond (_fr (case :rest)        ; Note the :rest, the construct operator
                                        ; is used to implement variadic behaviour
      (_if (_ (_car case) )
        (_ (_car (_cdr case) ) )
        (_ (cond :rest) )               ; if first case is false recursively evaluate :rest
      )
    ) )

    ; Using the cond form

    (cond 
      ( (== 1 2) (_echo "case a") )
      ( (== 1 1) (_echo "case b") )
      ( _true    (_echo "case c") )
    )                                   ; prints case b



----------------------------------


### `_rho`

**form** : `(_rho pattern body)`

`_rho` defines a **rewrite rule** in the **Rho** of the **current scope**. 
A **rewrite system or Rho** is embedded with each scope. When the **Rho** of a scope is invoked on an S-Expression
it transforms an S-Expression according to the rules defined in it. **Reference symbols** are used to capture
S-Expressions in the pattern and pass them to the body.


**exampls**
    
    ; define a rewrite rule to rewrite the pattern 
    ; (_self x = y) as (_let x y), wehre x and y are 
    ; S-Expressions and _self refers to current scope

    (_rho ( @a = @b ) (_let @a @b) )
  
    ; using the rule
    (_self a = 5)                  ; a is bound to 5


    ; we can also write
    [a = 5]                        ; a is bound to 5
    ; [ expr ] is the syntactical shorthand for (_self expr)


**Following examples will use the `[ x = y ]` short-hand syntax defined here using `_rho` instead of `(_let x y)` 
for the sake of simplicity and readability.**

----------------------------------



### `_begin`

**form** : `(_begin exp_1 exp_2 exp_3 ... exp_n)`

Where *exp_1* ... *exp_n* are S-Expressions. The form evaluates the S-Expressions one-by-one in its **own scope**.
The scope of this form is **synced**. The value of the form is the value of *exp_n*.

**examples**

    (_begin
      [ 
        y = (_begin            ; current synced scope of _begin
              [ x = 1 ]        ; define x = 1 in current scope
              [_echo x]        ; prints 1
              x                ; value of last experssion is 1
            )
      ]                        ; hence y is bound to 1 now
    )




----------------------------------



### `_sync`

**form** : `(_sync exp_1 exp_2 ... exp_1)`

Where *exp_1* ... *exp_n* are S-Expressions. The form **syncs the current scope** and evaluates 
the S-Expressions one-by-one. The value of the form is the value of *exp_n*.

**examples**

    (_sync
      (_include "stdlib")       ; includes stdlib
      (_echo "hello world")     ; prints hello world
    )




----------------------------------



### `_coll`

**form** : `(_coll exp_1 exp_2 ... exp_n)`

Where *exp_1* ... *exp_n* are S-Expressions. The form evaluates the S-Expressions one-by-one in its own **synced scope**.
The a new collection is created and bound to the `_this` special symbol in the scope. The value of the form is the 
collection bound to `_this` after the S-Expressions *exp_1* ... *exp_n* have been evaluated.

**examples**

    [ numb = (_coll                          ; creates a collection numb 
      [ _this.band = "Linkin Park" ]         ; numb is a song by Linkin Park
      [ _this.album = "Meteora" ]            ; from the album Meteora
      [ _this.artist = "Chester Bennington"] ; sung by Chester
    ) ]


    ; short-hand syntax for the same

    [ numb = { 
      [ (.band .album .artist) = ( "Linkin Park" "Meteora" "Chester Bennington") ]
    } ]

    (_echo numb.band)                        ; prints Linkin Park




----------------------------------



### `_seq`

**form** : `(_seq  a_1  a_2 ...  a_n )`

Where *a_1* ... *a_n* are S-Expressions. The value of the form is a Sequence (a wrapped Array) containing 
values of *a_1* ... *a_n*.

**examples**

    (_echo (_seq 1 2 3 4) )               ; prints [ 1, 2, 3, 4 ]
    (_echo (_seq 5 (+ 7 5) ) )            ; prints [ 5, 12 ]



----------------------------------



### `_map`

**form** : `(_map sequence func)`

Where *sequence* is a S-Expression whose value is a Sequence or an Array and *func* is a function 
taking 2 arguments *( item, index )*. The value of the form is a Sequence or an Array **asynchronously
mapped** from *sequence* using *func*.


**examples**

    (_echo (_map 
      (_seq 1 2 3 4) 
      (_fn (item index) (* item 2) ) 
    ) )                                 ; prints [ 2, 4, 6, 8 ]
    
    
    (_echo (_map 
      (_seq 1 2 3) 
      (_fn (item) (* item 2) )          ; note the function takes only one argument
                                        ; 'item', because we do not need index here
    ) )                                 ; prints [ 2, 4, 6]




----------------------------------




### `_filter`

**form** : `(_filter sequence func)`

Where *sequence* is a S-Expression whose value is a Sequence or an Array and *func* is a function 
taking 2 arguments *( item, index )* and evaluating to `_true` or `_false`. 
The value of the form is a Sequence or an Array **asynchronously filtered** from *sequence* using *func*.


**examples**

    (_echo (_filter 
      (_seq 1 2 3 4) 
      (_fn (item index) 
        (=== 0 (% index 2) )            ; filter even indices
      ) 
    ) )                                 ; prints [ 1, 3 ]
    
    
    (_echo (_filter 
      (_seq 1 2 3 4) 
      (_fn (item) 
        (== 0 (%  item 2) )             ; filter even values
      )                                 ; note the function takes only one argument
                                        ; 'item', because we do not need index here
    ) )                                 ; prints [ 2, 4 ]




----------------------------------



### `_stream`

**form** : `(_stream func dep_1 dep_2 ... dep_n)`

Where *func* is a function and *dep_1* ... *dep_n* are S-Expressions. The value of the form is a **stream** which contains 
the value of `(func dep_1 ... dep_n)`. `func` is the core function of the stream here. When the value of any S-Expression 
among *dep_1* ... *del_n* changes asynchronously the value of the stream is updated.

_A **stream** is a container for a value that may change asynchronously depending on other streams and/or values._

**examples**

    [ seconds-stream = (_stream 
        @{
          // This is a block of native Javascript code enclosed 
          // within @{ and }@
          // This block of Javascript is a valid Atomic value in
          // Ironscript. The value of this atom is an Ironscript
          // function constructed from this block of code.
          
          let i = 0;

          setInterval ( function () {
            $yield (i++);
          }, 1000 );            // yield an integer every second    
        
        }@ NIL )
    ]
    
    ; Now seconds-stream is a stream containing a value which 
    ; increments by one every second.
    
    ; stream-sqr defined below is a function that takes a stream as argument
    ; and evaluates to another stream which contains the value of the square
    ; of the contained value of arg-stream.

    [ sqr = (_fn (x) (* x x) ) ]
    [ stream-sqr = (_fn (arg-stream) (_stream sqr (arg-stream) ) ) ]





----------------------------------




### `_do`

**form** : `(_do stream)`

Where *stream* is an S-Expression whose value is a stream.   
The form has **no value**, its **value is NIL**. This form is used to detach the execution of a
stream (which is fully asynchronous because the value contained in the stream can change anytime) 
from a synced execution environments of `_begin`, `_sync` and `_coll`.

This is used to literally 'do' asynchronous stuff using Impure streams.

**example**
    
    ; we shall use the seconds-stream defined in the previous example
    ; to demonstrate the use of _do

    (_begin
      
      ; define a function stream-echo that takes a stream as the argument
      ; and evaluates to another stream which prints the value contained 
      ; in the arg-stream whenever the value in arg-stream changes.

      ; note that _echo is not a pure-function, _echo modifies the stdout
      ; by printing to it. Therefore stream-echo evaluates to an Impure stream 

      [ stream-echo = (_fn (arg-stream) (_stream _echo (arg-stream) ) ) ]

      ; let's define a stream that will print the seconds-stream
      [ echo-seconds-stream = (stream-echo seconds-stream) ]

      ; now we want to execute stream-echo, but stream-echo will print
      ; to stdout asynchronously once in a second and we are inside a
      ; synced environment (we are inside a _begin form). So, we use _do.

      (_do echo-seconds-stream)     ; prints 1 2 3 ... one value each second
    )




----------------------------------




### `_on`

**form** : `(_on stream expr)`

Where *stream* is an S-Expression whose value is a stream and expr is an S-Expression. The value of this
form is a stream containing a value evaluated from *expr* whenever the value contained in *stream* changes.

**example**

    (_begin
      [ print-hello-stream = (_on sconds-stream (_echo "Hello World !") ) ]
      (_do print-hello-stream)          ; prints hello world ! every second
    )




----------------------------------




### `_pull`

**form** : `(_pull container)`

Where *container* is an S-Expression whose value is a **stream** or a **sequence**. In case of stream, the value of 
this form is the current value of the stream. *(Note that the value of this form does not change when the value contained 
in the stream changes)*. In case of sequence, it's equivalent to array.shift() in Javascript.


**examples**

    (_begin 
      [ nums = (_seq 1 2 3 4) ]
      (_echo (_pull nums) )             ; prints 1
      (_echo nums)                      ; prints [2, 3, 4]
      
      (_do (_on seconds-stream 
        (_echo (_pull seconds-stream) )
      ) )                               ; prints 1 2 3 ... per second
    )



----------------------------------



### `_push`

**form** : `(_push container expr)`

Where *container* is an S-Expression whose value is a **stream** or a **sequence** and *expr* is an S-Expression.
If value of *container* is a stream then its contained value is updated to the value of *expr*. If value of *container*
is a sequence, then value of *expr* is pushed to the end of the sequence (equivalent to array.push(val) in Javascript).

Value of this form is the value of *expr*.

**examples**
    
    (_begin
      [ nums = (_seq 1 2 3) ]
      (_push nums 4)
      (_echo nums)                      ; prints [1, 2, 3, 4]

      [ nop = (_fn () NIL) ]            ; nop is a function that does nothing
      [ myport = (_stream nop NIL) ]    ; myport is a stream with nop core function
      
      (_do (_on myport 
        (_echo (_pull myport) )         ; when value of myport changes, print it
      ) )

      (_push myport "Hello")            ; prints "Hello"
      (_push myport "World")            ; prints "World"

    )




---------------------------------



### `_pop`

**form** : `(_pop sequence)`

Where sequence is an S-Expression whose value is a sequence. It's equivalent to array.pop() in Javascript.

**examples**

    (_begin 
      [ nums = (_seq 1 2 3 4) ]
      (_echo (_pop nums) )        ; prints 4
      (_echo nums)                ; print [1, 2, 3]
    )





--------------------------------------




### `_import`

**form** : `(_import file names)`

Where *file* is a string representing the path to the Ironscript file to be imported and *names* is a list of 
symbols to be imported from the file. *names* is optional. If `_all` is passed in place of *names* all symbols
defined in the root scope of the file are imported.

The value of this form is the root scope of the imported file.


**examples**

    ------- file : greet.is --------

    (_sync
      ; define a function good-evening
      [ good-evening = (_fn (name) 
        (concat "Good evening " name " !") 
      ) ]

      ; define a function good-morning
      [ good-morning = (_fn (name) 
        (concat "Good morning " name " !") 
      ) ]
    )


    ------- file : main.is --------

    (_begin
      ; importing greet.is, various ways

      ; 1. 
      [ greet = (_import "./greet.is") ]
      (_echo (greet.good-morning "Alice") )       ; prints "Good morning Alice !"


      ; 2.
      (_import "./greet.is" (good-morning) )
      (_echo (good-morining "Bob") )              ; prints "Good morning Bob !"

      ; 3.
      (_import "./greet.is" _all)
      (_echo (good-evening "Eve") )               ; prints "Good evening Eve !"
    )




------------------------------------------



### `_include`

**form** : `(_include file)`

Where *file* is a string representing the path to the file to be included. The content of the file is read and
evaluated in the current scope. The value of this form is the root scope of the included file.

**examples**
    
    (_begin
      (_include "stdlib")     ; includes stdlib
      (_echo (+ 2 3) )        ; prints 5
    )



----------------------------------------------



### Using Javscript inside Ironscript

    
Internally Ironscript functions are asynchronous javascript functions invoked by the asynchronous 
**evaluator** when needed. Hence, we should be able to write asynchronous Javascript functions and use 
them in Ironscript. In fact we are able to do that in a number of ways. We have a syntactical way of
using JS inside Ironscript through the `@{ ...JS code... }@` blocks or **JS Blocks**. In a multi-file 
project the JS dependecies can be specified in the `iron.config.json` file. We can also take a synchronous
JS function returned by any Ironscript form/function or Javascript function and put an asynchronous wrapper
around it through the `_fx` function provided in Ironscript. In this section, we will concentrate solely on 
the **JS Blocks**.


#### JS Blocks

JS Blocks are blocks of Javascript code enclosed in @{ and }@ inside an Ironscript source. These blocks
construct asynchronous Javascript functions that can be used like any other Ironscript functions written in
Ironscript. These blocks have a nice little API to write async functions in a synchronous looking way.

##### The JS Blocks API

The code inside JS Blocks is a single Javascript function that has access to 4 functions `$return`, `$throw`,
`$catch`, `$yield`, the current scope through `$scope` object and the `args` array.


**`$return`** is the function to return a value to the **Ironscript evaluator** asynchronously.
**`$yield`** is the function to yield a value to the **evaluator**, `$yield` is used in writing core functions
of streams in Javascript. **`$throw`** functions throws its argument as an error to the evaluator, 
**`$catch`** function is used to catch errors thrown by the evaluator when the function is run to handle an error.

**`$scope`** object provides two useful methods to store and retrieve key, value pairs in the current scope.
`$scope.defc (key, value)` stores the key, value pair in the scope to be used by other Javascript code running 
in the same scope. `$scope.getc (key)` retrieves the value associated with the key.


##### Example

    (_begin
      [ sum = @{
                  let s = 0;
                  for (let x of args) s += x;
                  $return (s);
              }@
      ]
      
      (_echo (sum 1 2 3 4) )          ; prints 10
    )






















