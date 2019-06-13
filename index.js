const postcss = require('postcss');

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

  const regexStr = '(%1|%2)\\-(%2)\\(([^)]+)\\)'.replace('%1', `${$opts.from}|${$opts.to}`).replace(/%2/g, sizeNames.join('|'));
  const baseRegex = new RegExp(regexStr, 'img');

  root.walkDecls((decl) => {
    if (!baseRegex.test(decl.value)) {
      return;
    }

    decl.value = decl.value.replace(baseRegex, (_, med1, med2, values) => {
      // From
      if (med1 === $opts.from) {
        console.log('From:', med2, 'Values:', values);

        createFromMedia({
          root,
          size: $opts.sizes[med2],
          selector: decl.parent.selector,
          prop: decl.prop,
          value: values,
        });
      }

      // To
      else if (med1 === $opts.to) {
        console.log('To:', med2, 'Values:', values);

        createToMedia({
          root,
          size: $opts.sizes[med2],
          selector: decl.parent.selector,
          prop: decl.prop,
          value: values,
        });
      }

      // Between
      else {
        console.log('From:', med1, 'To:', med2, 'Values:', values);

        createBetweenMedia({
          root,
          size1: $opts.sizes[med1],
          size2: $opts.sizes[med2],
          selector: decl.parent.selector,
          prop: decl.prop,
          value: values,
        });
      }

      return '';
    });
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
    params: `(max-width: ${size})`,
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
    params: `(min-width: ${sizeMin}) and (max-width: ${sizeMax})`,
  });

  const rule = postcss.rule({ selector });
  const decl = postcss.decl({ prop, value });

  rule.append(decl);
  media.append(rule);

  root.append(media);
}

function normalizeSizes(size1, size2) {
  return [size1, size2];
}
