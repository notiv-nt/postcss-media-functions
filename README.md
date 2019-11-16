# postcss-media-functions

## Usage:

```javascript
// Add plugin to postcss config
postcss([
  require('postcss-media-functions')({
    // Defaults:
    from: 'from',
    to: 'to',

    // Required
    sizes: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
    },
  }),
]);
```

```css
/* usage in css */
[selector] {
  [property]: * from-sm(*) to-sm(*) sm-lg(*) *;
}

/*
  prop: from-[sm|md|lg];
  prop: to-[sm|md|lg]
  prop: [sm|md|lg]-[sm|md|lg]
*/
```

## Example:

### Config

```javascript
postcss([
  require('postcss-media-functions')({
    sizes: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
    },
  }),
]);
```

### Input

```css
a {
  color: red to-sm(blue) sm-md(black) md-lg(yellow) from-lg(white);
}
```

### Output

```css
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
```

### Generate variables for pre-processors

```javascript
const options = {
  sizes: {
    sm: '576px',
    md: '768px',
    lg: '992px',
  },
};

postcss([
  require('postcss-media-functions')
    .generateVariables(options, 'scss' /* default, [scss, sass, stylus, less] */)
]);
```

Will generate and include the following variables into the file

```
$from-sm: (min-width: 576px);
$to-sm: (max-width: 575px);
$sm-md: (min-width: 576px) and (max-width: 767px);
$sm-lg: (min-width: 576px) and (max-width: 991px);
$from-md: (min-width: 768px);
$to-md: (max-width: 767px);
$md-sm: (min-width: 576px) and (max-width: 767px);
$md-lg: (min-width: 768px) and (max-width: 991px);
$from-lg: (min-width: 992px);
$to-lg: (max-width: 991px);
$lg-sm: (min-width: 576px) and (max-width: 991px);
$lg-md: (min-width: 768px) and (max-width: 991px);
```

and then you can use them

```scss
a {
  @media #{$from-sm} {
    color: red;
  }
}
```

->

```scss
@media (min-width: 576px) {
  a {
    color: red;
  }
}
```
