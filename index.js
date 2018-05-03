class Flow {
  constructor(options) {
    options = options || {};
    this.processors = [];
    this.ignoreError = options.ignoreError;
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
    if (idx !== undefined) {
      return this.processors.splice(idx, 1);
    }
    return this.processors.pop();
  }

  execute(xargs, callback) {
    let self = this;
    let funcs = self.processors.map(processor => processor.func);
    asynFlow({ funcs: funcs, xargs: xargs, ignoreError: self.ignoreError }, callback);
  }
}

class Processor {
  constructor(options) {
    options = options || {};
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
  if (!options) return;
  let funcs = options.funcs, xargs = options.xargs, ignoreError = options.ignoreError;
  if (typeof funcs === 'function') funcs = [funcs];
  if (!(funcs instanceof Array) || !funcs.length) return;
  if (!funcs.every(func => typeof func === 'function')) return;

  if (typeof xargs !== 'object') return;
  if (!(xargs instanceof Array)) xargs = [xargs];
  if (!xargs.every(xarg => typeof xarg === 'object')) return;

  if (funcs.length !== xargs.length && funcs.length !== 1 && xargs.length !== 1) return;

  let funcIdx = 0, xargIdx = 0, tmpResults = [],
    onlyOne = (funcs.length == 1 && xargs.length == 1);

  executeFuncs();
  function executeFuncs() {
    if (funcIdx >= funcs.length || xargIdx >= xargs.length) {
      if (typeof callback === 'function') callback(null, tmpResults);
      return;
    }
    let func = funcs[funcIdx], xarg = xargs[xargIdx];
    func(xarg, function (error, result) {
      tmpResults.push({ error, result });
      if (error && !ignoreError) {
        if (typeof callback === 'function') {
          let e = new Error();
          e.step = funcIdx;
          callback(e, tmpResults);
        }
        return;
      }
      if (onlyOne) {
        if (typeof callback === 'function') callback(null, tmpResults);
        return;
      }
      funcIdx += (funcs.length == 1 ? 0 : 1);
      xargIdx += (xargs.length == 1 ? 0 : 1);
      executeFuncs();
    });
  }
}

module.exports = { asynFlow, Processor, Flow };