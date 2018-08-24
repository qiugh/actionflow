class Flow {
  constructor(options) {
    this.processors = [];
    if (!options || typeof options !== 'object')
      options = {};
    this.ignoreError = options.ignoreError;
    this.returnXargs = options.returnXargs;
  }

  add(processor, idx) {
    if (!(processor instanceof Processor))
      throw new Error('Not a Processor instance');
    if (idx !== undefined) {
      this.processors.splice(idx, 0, processor);
    } else {
      this.processors.push(processor);
    }
  }

  remove(idx) {
    if (idx !== undefined)
      return this.processors.splice(idx, 1);
    return this.processors.pop();
  }

  execute(xargs, callback) {
    let funcs = this.processors.map(processor => processor.func);
    asynFlow({
      funcs: funcs,
      xargs: xargs,
      ignoreError: this.ignoreError,
      returnXargs: this.returnXargs
    }, callback);
  }
}

class Processor {
  constructor(options) {
    if (!options || typeof options !== 'object')
      options = {};
    if (typeof options.name !== 'string' || options.name === '')
      throw new Error('processor name must be valid string');
    if (typeof options.func !== 'function')
      throw new Error('processor func must be a function');
    this.name = options.name;
    this.func = options.func;
    this.asyn = options.asyn;
    if (!this.asyn) {
      this.func = function (params, callback) {
        callback(null, options.func(params));
      }
    }
  }
}

function asynFlow(options, callback) {
  if (!options || typeof options !== 'object') return;
  let funcs = options.funcs;
  let xargs = options.xargs;
  let ignoreError = options.ignoreError;
  let returnXargs = options.returnXargs;
  if (typeof funcs === 'function') funcs = [funcs];
  if (!(funcs instanceof Array) || !funcs.length) return;
  if (!funcs.every(func => typeof func === 'function')) return;
  if (typeof xargs !== 'object') return;
  if (!(xargs instanceof Array)) xargs = [xargs];
  if (!xargs.every(xarg => typeof xarg === 'object')) return;
  if (xargs.length !== 1 && returnXargs) return;
  if (funcs.length !== xargs.length && funcs.length !== 1 && xargs.length !== 1) return;
  let funcIdx = 0, xargIdx = 0, resultPool = [];
  let funcStep = (funcs.length == 1) ? ((xargs.length == 1) ? 1 : 0) : 1;
  let xargStep = (xargs.length == 1) ? ((funcs.length == 1) ? 1 : 0) : 1;

  executeFuncs();
  function executeFuncs() {
    if (funcIdx >= funcs.length || xargIdx >= xargs.length)
      return callCb();
    let func = funcs[funcIdx];
    func(xargs[xargIdx], function (error, result) {
      resultPool.push({ error, result });
      if (error && !ignoreError)
        return callCb(new Error('Error occured in the step ' + (funcIdx + 1)));
      funcIdx += funcStep;
      xargIdx += xargStep;
      executeFuncs();
    });
  }

  function callCb(error) {
    if (typeof callback !== 'function')
      return;
    if (returnXargs) {
      callback(error, xargs[0]);
    } else {
      callback(error, resultPool);
    }
  }
}

module.exports = { asynFlow, Processor, Flow };
