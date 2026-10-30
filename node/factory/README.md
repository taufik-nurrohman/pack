Factory
=======

Simple Node.js script to generate CSS, HTML, and JavaScript files from ECMAScript, Pug, and SCSS files.

_Paket, paket Node.js apa yang digemari para suami? Namanya [@taufik-nurrohman/factory](https://www.npmjs.com/package/@taufik-nurrohman/factory). Karena cara pakainya `npm run pack`. Xixixi lucu yah pack_ 😁

Usage
-----

~~~ sh
mkdir my-project
mkdir my-project/src
mkdir my-project/dist
~~~

Paste your `*.scss`, `*.mjs`, and `*.pug` files to `.\my-project\src` folder.

~~~ sh
cd my-project
npm install @taufik-nurrohman/factory --save-dev
~~~

Create a `scripts` field that runs the `pack` command in `.\my-project\package.json`

~~~ json
{
  "scripts": {
    "pack": "pack --from=src --to=dist"
  }
}
~~~

Generate the production ready files this way:

~~~ sh
npm run pack
~~~

The `mjs`, `pug`, `scss`, and `txt` file extensions from the source folder will be removed. Make sure to name your files
with two file extension like so:

 - `index.css.scss`
 - `index.html.pug`
 - `index.js.mjs`
 - `index.php.pug`
 - `LICENSE.txt`
 - `LICENSE.txt.txt`

So that in the distributable folder, your files will be renamed to:

 - `index.css`
 - `index.html`
 - `index.js`
 - `index.php`
 - `LICENSE`
 - `LICENSE.txt`

Options
-------

Key | Description
--- | -----------
`--css-enter` | Insert string at the top of the CSS file (default to `""`).
`--css-exit` | Insert string at the bottom of the CSS file (default to `""`).
`--from` | Folder path to store the files to be compiled (default to `"src"`).
`--html-enter` | Insert string at the top of the HTML file (default to `""`).
`--html-exit` | Insert string at the bottom of the HTML file (default to `""`).
`--js-enter` | Insert string at the top of the JS file (default to `""`).
`--js-exit` | Insert string at the bottom of the JS file (default to `""`).
`--js-export` | JavaScript [module name](https://rollupjs.org/guide/en/#quick-start) (default to `""`).
`--mjs-enter` | Insert string at the top of the MJS file (default to `""`).
`--mjs-exit` | Insert string at the bottom of the MJS file (default to `""`).
`--mjs` | Include MJS files to the output.
`--prune` | Clean-up the old compiled files before re-compile (default to `true`).
`--pug-enter` | Insert string at the top of the PUG file (default to `""`).
`--pug-exit` | Insert string at the bottom of the PUG file (default to `""`).
`--pug` | Include PUG files to the output.
`--scss-enter` | Insert string at the top of the SCSS file (default to `""`).
`--scss-exit` | Insert string at the bottom of the SCSS file (default to `""`).
`--scss` | Include SCSS files to the output.
`--shut` | Disable logging (default to `false`).
`--to` | Folder path to store the compiled files (default to `"dist"`).
`--version` | Show version information.