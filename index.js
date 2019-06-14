const postcss = require('postcss');
const { parse } = require('postcss-values-parser');

module.exports = postcss.plugin('postcss-media-functions', (opts) => (root) => {
  const $opts = Object.assign(
    {
      from: 'from',
      to: 'to',
      sizes: {},
    },
    opts
  );

  const sizeNames = [];

  for (const sizeName in $opts.sizes) {
    sizeNames.push(sizeName);
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

      let exec = baseRegex.exec(node.name);

      const med1 = exec[1];
      const med2 = exec[2];
      const value = node.params.replace(/^\(/, '').replace(/\)$/, '');

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
