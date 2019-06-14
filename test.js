const postcss = require('postcss');
const plugin = require('./index');

function run(input, output, opts) {
  return postcss([plugin(opts)])
    .process(input, { from: undefined })
    .then((result) => {
      // console.log(result.css, output);
      // expect(normalize(result.css)).toEqual(normalize(output));
      expect(result.css).toEqual(output);
      expect(result.warnings()).toHaveLength(0);
    });
}

// function normalize(str) {
//   return str.replace(/\n/gm, ' ').replace(/\s+/gm, ' ');
// }

test('Resolve basic function', () => {
  const input = `
    a {
      padding: sm-md(10px, 20px);
      font-size: 14px from-sm(16px) lg-md(20px) to-xl(24px);
    }
  `;

  const output = `
  `;

  return run(input, output, {
    sizes: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
    },
  });
});
