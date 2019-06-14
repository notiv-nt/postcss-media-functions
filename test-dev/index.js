const postcss = require('postcss');
const plugin = require('../index');
const fs = require('fs');
const path = require('path');

const input = `
a {
  color: 10px from-xl333(10px);
}
`;

(async () => {
  const result = await postcss([
    plugin({
      sizes: {
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
      },
    }),
  ]).process(input, { from: undefined });

  fs.writeFileSync(path.resolve(__dirname, './bundle.css'), result.css);
})();
