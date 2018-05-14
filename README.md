## Installation
npm install node-processor 
```javascript
let asynFlow = require('node-processor').asynFlow;
```
## required params
### funcs: single asynchronous function or asynchronous function array.
```javascript
function asyn1(options, callback) {
    console.log('asyn1', options);
    setTimeout(callback, 1000, null, 'result1');
}
function asyn2(options, callback) {
    console.log('asyn2', options);
    setTimeout(callback, 1000, 'this is an error', 'result2');
}
function asyn3(options, callback) {
    console.log('asyn3', options);
    setTimeout(callback, 1000, null, 'result3');
}

let funcs1 = asyn1;
let funcs2 = [asyn1];
let funcs3 = [asyn1, asyn2, asyn3];
```
### xargs: single object param or object param array.   
```javascript
let xarg1 = { name: 'xarg1' };
let xarg2 = { name: 'xarg2' };
let xarg3 = { name: 'xarg3' };

let xargs1 = xarg1;
let xargs2 = [xarg1];
let xargs3 = [xarg1, xarg2, xarg3];
```
## optional params
* ignoreError(default false): When error occurs in some stage of the process flow, left functions will be skipped and the callback will be called if it exists.
* returnXargs(default false): When it is true, xargs itself will be passed to the callback as the result.

## three features
### support various process situation 
1. one asynchronous function with one xarg  
```javascript
asynFlow({funcs: funcs1, xargs: xargs1});
```
2. one asynchronous function with multi xarg  
```javascript
asynFlow({funcs: funcs1, xargs: xargs3});
```
3. multi asynchronous function with one xarg  
```javascript
asynFlow({funcs: funcs3, xargs: xargs1});
```
4. multi asynchronous function with multi xarg  
```javascript
asynFlow({funcs: funcs3, xargs: xargs3});
```

But, if the number of funcs is not equal with the number of xargs and they are neither 1, the asynFlow will not execute any function.  

### support recording error and result of every function   
```javascript
asynFlow({funcs: funcs3, xargs: xargs3}, function(error,result){
  console.log(result);
  //result is an array contains three objects like this {error:null, result:'result'}.
});
```
### support skipping left functions when error occurs
```javascript
asynFlow({funcs: funcs3, xargs: xargs3}, function(error,result){
  console.log(error);
  //error is an instance of Error with one description like 'Error occured in step 2'
  console.log(result);
  //result is an array contains two objects.
});
```
### support return xargs in itself
When the returnXargs is true, the number of xargs must be 1.   
```javascript
asynFlow({funcs: funcs3, xargs: xargs1}, function(error,result){
  console.log(result);
  //result is just xargs1.
});
```
```javascript
asynFlow({funcs: funcs3, xargs: xargs2}, function(error,result){
  console.log(result);
  //result is xargs2[0].
});
```







