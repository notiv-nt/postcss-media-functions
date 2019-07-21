const postcss = require('postcss');
const plugin = require('../index');
const fs = require('fs');
const path = require('path');

const input = `
a {
  color: 10px from-xl(10px);
}

@media $from-sm {
  a {
    color: red;
  }
}
`;

(async () => {
  const opts = {
    sizes: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
    },
  };
  const result = await postcss([plugin.generateVariables(opts, 'scss'), plugin(opts)]).process(input, { from: undefined });

  fs.writeFileSync(path.resolve(__dirname, './bundle.css'), result.css);
})();
