const postcss = require('postcss');
const plugin = require('../index');
const fs = require('fs');
const path = require('path');

const input = `a {
  font-size: 14px from-sm(16px) to-xl(24px) lg-md(20px);
}
.header .nav logo {
  background: #fff url('hells/kjjk') from-md(#000 url(http://jkjkj));
}
`;

(async () => {
  const { css } = await postcss([
    plugin({
      sizes: {
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
      },
    }),
  ]).process(input, { from: undefined });

  fs.writeFileSync(path.resolve(__dirname, './bundle.css'), css);
})();
