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
  ... [property]: . from-sm(.) to-sm(.) sm-lg(.) .;
  ...;
}
```

### Examples

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
