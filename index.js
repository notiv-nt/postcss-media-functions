const postcss = require('postcss');
const { parse } = require('postcss-values-parser');
const PLUGIN_NAME = 'postcss-media-functions';

module.exports = postcss.plugin(PLUGIN_NAME, (args) => (root, result) => {
  const { options, functionNames, sizes } = normalizeOptions(args);

  const regexStr = '(%1|%2)\\-(%2)'.replace('%1', `${options.from}|${options.to}`).replace(/%2/g, sizes.join('|'));
  const baseRegex = new RegExp(regexStr, 'i');

  root.walkDecls((decl) => {
    if (!baseRegex.test(decl.value)) {
      return;
    }

    const parsed = parse(decl.value);

    parsed.nodes.forEach((node, i) => {
      if (!(node.type === 'func' && node.name.match(regexStr))) {
        return;
      }

      let [med1, med2] = node.name.split('-');
      const value = node.params.replace(/^\(/, '').replace(/\)$/, '');

      if (!(functionNames.includes(med1) && functionNames.includes(med2))) {
        result.warn('Unknown function ' + node.name, {
          plugin: PLUGIN_NAME,
        });
        return;
      }

      // From
      if (med1 === options.from) {
        // console.log('From:', med2, 'value:', value);

        createFromMedia({
          root,
          size: options.sizes[med2],
          selector: decl.parent.selector,
          prop: decl.prop,
          value,
        });
      }

      // To
      else if (med1 === options.to) {
        // console.log('To:', med2, 'value:', value);

        createToMedia({
          root,
          size: options.sizes[med2],
          selector: decl.parent.selector,
          prop: decl.prop,
          value,
        });
      }

      // Between
      else {
        // console.log('From:', med1, 'To:', med2, 'value:', value);

        createBetweenMedia({
          root,
          size1: options.sizes[med1],
          size2: options.sizes[med2],
          selector: decl.parent.selector,
          prop: decl.prop,
          value,
        });
      }

      parsed.nodes[i] = postcss.root({ text: 'nope' });
    });

    decl.value = parsed.toString();

    /*
    decl.value = decl.value.replace(baseRegex, (_, med1, med2, values) => {
      return '';
    });
    */

    if (!decl.value.trim()) {
      decl.remove();
    }
  });
});

module.exports.generateVariables = postcss.plugin(PLUGIN_NAME, (args, preProcessor = 'scss') => (root, result) => {
  const { options, functionNames, sizes } = normalizeOptions(args);
  const vars = [''];

  sizes.forEach((size) => {
    const fromStr = createVariable(`${options.from}-${size}`, `(min-width: ${options.sizes[size]})`, preProcessor);
    const toStr = createVariable(`${options.to}-${size}`, `(max-width: ${substractSize(options.sizes[size])})`, preProcessor);

    vars.push(fromStr);
    vars.push(toStr);

    sizes.forEach((innerSize) => {
      // Skip same size
      if (innerSize === size) {
        return;
      }

      const [sizeMin, sizeMax] = normalizeSizes(options.sizes[size], options.sizes[innerSize]);
      const value = `(min-width: ${sizeMin}) and (max-width: ${substractSize(sizeMax)})`;

      vars.push(createVariable(`${size}-${innerSize}`, value, preProcessor));
    });
  });

  vars.join('\n');

  root.prepend(vars.join('\n'));
});

function createFromMedia({ root, size, selector, prop, value }) {
  const media = postcss.atRule({
    name: 'media',
    params: `(min-width: ${size})`,
  });

  const rule = postcss.rule({ selector });
  const decl = postcss.decl({ prop, value });

  rule.append(decl);
  media.append(rule);

  root.append(media);
}

function createToMedia({ root, size, selector, prop, value }) {
  const media = postcss.atRule({
    name: 'media',
    params: `(max-width: ${substractSize(size)})`,
  });

  const rule = postcss.rule({ selector });
  const decl = postcss.decl({ prop, value });

  rule.append(decl);
  media.append(rule);

  root.append(media);
}

function createBetweenMedia({ root, size1, size2, selector, prop, value }) {
  const [sizeMin, sizeMax] = normalizeSizes(size1, size2);

  const media = postcss.atRule({
    name: 'media',
    params: `(min-width: ${sizeMin}) and (max-width: ${substractSize(sizeMax)})`,
  });

  const rule = postcss.rule({ selector });
  const decl = postcss.decl({ prop, value });

  rule.append(decl);
  media.append(rule);

  root.append(media);
}

function normalizeSizes(size1, size2) {
  if (parseFloat(size1) < parseFloat(size2)) {
    return [size1, size2];
  }

  return [size2, size1];
}

function substractSize(size) {
  const s1 = parseFloat(size);

  // TODO: em/rem ?
  return size.replace(s1, s1 - 1);
}

function normalizeOptions(opts) {
  const options = Object.assign(
    {
      from: 'from',
      to: 'to',
      sizes: {},
    },
    opts
  );

  const functionNames = [options.from, options.to];
  const sizes = [];

  for (const sizeName in options.sizes) {
    sizes.push(sizeName);
    functionNames.push(sizeName);
  }

  return {
    options,
    functionNames,
    sizes,
  };
}

function createVariable(name, val, preProcessor) {
  if (typeof preProcessor === 'Function') {
    return preProcessor(name, val);
  }

  if (['scss', 'stylus'].includes(preProcessor)) {
    return `$${name}: ${val};`;
  }

  if (preProcessor === 'sass') {
    return `$${name}: ${val}`;
  }

  if (preProcessor === 'less') {
    return `@${name}: ${val};`;
  }
}
