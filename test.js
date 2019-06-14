const postcss = require('postcss');
const plugin = require('./index');

const BASE_PARAMS = {
  sizes: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
  },
};

function run(input, output, opts) {
  return postcss([plugin(opts)])
    .process(input, { from: undefined })
    .then((result) => {
      expect(normalize(result.css)).toEqual(normalize(output));
      expect(result.warnings()).toHaveLength(0);
    });
}

function normalize(str) {
  return str.replace(/\n/gm, ' ').replace(/\s+/gm, ' ');
}

test('Empty input', () => {
  const input = ``;
  const output = ``;

  return run(input, output, BASE_PARAMS);
});

test('Do nothing if no functions found', () => {
  const input = `
    a {
      color: red;
    }

    body {
      padding: 10px;
    }
  `;

  const output = `
    a {
      color: red;
    }

    body {
      padding: 10px;
    }
  `;

  return run(input, output, BASE_PARAMS);
});

test('Replace from', () => {
  const input = `
    a {
      color: from-sm(blue);
    }
  `;

  const output = `
    a { }

    @media (min-width: 576px) {
      a {
        color: blue
      }
    }
  `;

  return run(input, output, BASE_PARAMS);
});

test('Replace to', () => {
  const input = `
    a {
      color: to-sm(blue);
    }
  `;

  const output = `
    a { }

    @media (max-width: 575px) {
      a {
        color: blue
      }
    }
  `;

  return run(input, output, BASE_PARAMS);
});

test('Replace between', () => {
  const input = `
    a {
      color: md-xl(blue);
    }
  `;

  const output = `
    a { }

    @media (min-width: 768px) and (max-width: 1199px) {
      a {
        color: blue
      }
    }
  `;

  return run(input, output, BASE_PARAMS);
});

test('Multiple functions', () => {
  const input = `
    a {
      color: red to-sm(blue) sm-md(black) md-lg(yellow) from-lg(white);
    }
  `;

  const output = `
    a {
      color: red;
    }

    @media (max-width: 575px) {
      a {
        color: blue;
      }
    }

    @media (min-width: 576px) and (max-width: 767px) {
      a {
        color: black;
      }
    }

    @media (min-width: 768px) and (max-width: 991px) {
      a {
        color: yellow;
      }
    }

    @media (min-width: 992px) {
      a {
        color: white;
      }
    }
  `;

  return run(input, output, BASE_PARAMS);
});

test('Multiple declarations/functions', () => {
  const input = `
    a {
      color: red to-sm(blue) sm-md(black) md-lg(yellow) from-lg(white);
      padding: red to-sm(blue) sm-md(black) md-lg(yellow) from-lg(white);
    }

    body #a .b c:hover {
      font-size: 13px sm-md(14px);
    }
  `;

  const output = `
    a {
      color: red;
      padding: red;
    }

    body #a .b c:hover {
      font-size: 13px;
    }

    @media (max-width: 575px) {
      a {
        color: blue;
      }
    }

    @media (min-width: 576px) and (max-width: 767px) {
      a {
        color: black;
      }
    }

    @media (min-width: 768px) and (max-width: 991px) {
      a {
        color: yellow;
      }
    }

    @media (min-width: 992px) {
      a {
        color: white;
      }
    }

    @media (max-width: 575px) {
      a {
        padding: blue;
      }
    }

    @media (min-width: 576px) and (max-width: 767px) {
      a {
        padding: black;
      }
    }

    @media (min-width: 768px) and (max-width: 991px) {
      a {
        padding: yellow;
      }
    }

    @media (min-width: 992px) {
      a {
        padding: white;
      }
    }

    @media (min-width: 576px) and (max-width: 767px) {
      body #a .b c:hover {
        font-size: 14px;
      }
    }
  `;

  return run(input, output, BASE_PARAMS);
});
