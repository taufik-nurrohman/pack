Factory
=======

Simple NodeJS script to generate CSS, HTML, and JavaScript files from ECMAScript, Pug, and SCSS files.

_Paket, paket NodeJS apa yang digemari para suami? Namanya [@taufik-nurrohman/factory](https://www.npmjs.com/package/@taufik-nurrohman/factory). Karena cara pakainya `npm run pack`. Xixixi lucu yah pack_ 😁

Usage
-----

~~~ sh
mkdir my-project
mkdir my-project/src
mkdir my-project/dist
~~~

Paste your `*.mjs`, `*.pug`, and `*.scss` files to `.\my-project\src` folder, then:

~~~ sh
cd my-project
npm install @taufik-nurrohman/factory --save-dev
~~~

Create a `scripts` field that runs the `factory` command in `.\my-project\package.json`:

~~~ json
{
  "scripts": {
    "pack": "factory --from=src --to=dist"
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
`--export` | JavaScript [module name](https://esbuild.github.io/api#global-name) (default to `""`).
`--from` | Folder to store the source files (default to `""`).
`--license` | Insert license comment at the top of the file (default to `false`).
`--minify` | Include the minified files to the result folder as well (default to `false`).
`--module` | Include module files to the result folder as well (default to `false`).
`--prune` | Prune result folder before re-build (default to `true`).
`--shut` | Disable logging (default to `false`).
`--to` | Folder to store the distributable files (default to `""`).
`--version` | Show version information.