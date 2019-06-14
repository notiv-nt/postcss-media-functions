const postcss = require('postcss');
const { parse } = require('postcss-values-parser');
const PLUGIN_NAME = 'postcss-media-functions';

module.exports = postcss.plugin(PLUGIN_NAME, (opts) => (root, result) => {
  const $opts = Object.assign(
    {
      from: 'from',
      to: 'to',
      sizes: {},
    },
    opts
  );

  const functionNames = [$opts.from, $opts.to];
  const sizeNames = [];

  for (const sizeName in $opts.sizes) {
    sizeNames.push(sizeName);
    functionNames.push(sizeName);
  }

  const regexStr = '(%1|%2)\\-(%2)'.replace('%1', `${$opts.from}|${$opts.to}`).replace(/%2/g, sizeNames.join('|'));
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
      if (med1 === $opts.from) {
        // console.log('From:', med2, 'value:', value);

        createFromMedia({
          root,
          size: $opts.sizes[med2],
          selector: decl.parent.selector,
          prop: decl.prop,
          value,
        });
      }

      // To
      else if (med1 === $opts.to) {
        // console.log('To:', med2, 'value:', value);

        createToMedia({
          root,
          size: $opts.sizes[med2],
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
          size1: $opts.sizes[med1],
          size2: $opts.sizes[med2],
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
