function asyncFlow(options, callback) {
	if (!options) return;
	let funcs = options.funcs,
		xargs = options.xargs,
		force = options.force;
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
			if (error && !force) {
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

function processFlow(options, callback) {
	if (!options) return;
	let xarg = options.xarg, force = options.force, processors = options.processors;
	if (!(processors instanceof Array) || !processors.length) return;
	if (!(processors.every(processor => processor instanceof Processor))) return;

	let processorIdx = 0, tmpResults = [];
	executeProcessors();
	function executeProcessors() {
		if (processorIdx >= processors.length) {
			if (typeof callback === 'function') callback(null, tmpResults);
			return;
		}
		let processor = processors[processorIdx];
		processor(xarg, function (error, result) {
			tmpResults.push({ error, result });
			if (error && !force) {
				if (typeof callback === 'function') {
					let e = new Error();
					e.step = processorIdx;
					callback(e, tmpResults);
				}
				return;
			}
			if (processors.length === 1) {
				if (typeof callback === 'function') callback(null, tmpResults);
				return;
			}
			processorIdx++;
			executeProcessors();
		});
	}
}

class Processor {
	super();
	constructor(name, action, async) {
		if (typeof name !== 'string' || name === '')
			throw new Error('processor name must be valid string');
		if (typeof action !== 'function')
			throw new Error('processor action must be a function');
		this.name = name;
		this.async = async;
		this.action = action;
		if (!this.async) {
			this.action = function (params, callback) {
				callback(null, action(params));
			}
		}
	}
}

module.exports = { asyncFlow, Processor, processFlow };