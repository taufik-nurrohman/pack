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

Option | Alias | Description
------ | ----- | -----------
`--export` | `-e` | JavaScript [module name](https://esbuild.github.io/api#global-name) (default to `""`).
`--from` | &nbsp; | Folder to store the source files (default to `""`).
`--help` | `-h` | Show help.
`--license` | `-l` | Insert license comment at the top of the file (default to `false`).
`--minify` | `-z` | Include the minified files to the result folder as well (default to `false`).
`--module` | `-m` | Include module files to the result folder as well (default to `false`).
`--prune` | `-p` | Prune result folder before re-build (default to `true`).
`--shut` | `-x` | Disable logging (default to `false`).
`--to` | &nbsp; | Folder to store the distributable files (default to `""`).
`--version` | `-v` | Show version.

Examples
--------

### Basic Usage

~~~ sh
factory --from=src --to=dist
~~~

~~~ sh
factory --from src --to dist
~~~

### Minification Examples

~~~ sh
# Disable minification (default)
factory --from src --to dist

# Minify CSS and JS
factory --from src --to dist --minify

# Minify CSS, HTML, and JS
factory --from src --to dist --minify true

# Minify JS only
factory --from src --to dist --minify js

# Minify CSS and JS
factory --from src --to dist --minify css js

# Explicitly disable
factory --from src --to dist --minify false

# Set to null
factory --from src --to dist --minify null
~~~

#### Using Aliases

~~~ sh
factory --from src --to dist -z
factory --from src --to dist -z js
factory --from src --to dist -z css js
~~~

### Module Examples

~~~ sh
# Disable module output (default)
factory --from src --to dist

# Include default module formats: `mjs`, `scss`
factory --from src --to dist --module

# Include `mjs`, `pug`, and `scss`
factory --from src --to dist --module true

# Include mjs only
factory --from src --to dist --module mjs

# Include `mjs` and `scss`
factory --from src --to dist --module mjs scss

# Explicitly disable
factory --from src --to dist --module false

# Set to null
factory --from src --to dist --module null
~~~

#### Using Aliases

~~~ sh
factory --from src --to dist -m
factory --from src --to dist -m mjs
factory --from src --to dist -m mjs scss
~~~

### Using `--key=value` styles

~~~ sh
# Export
factory --from=src --to=dist --export=MyLibrary
factory --from=src --to=dist -e=MyLibrary

# License
factory --from=src --to=dist --license
factory --from=src --to=dist -l

# Minify
factory --from=src --to=dist --minify
factory --from=src --to=dist --minify=true
factory --from=src --to=dist --minify=false
factory --from=src --to=dist --minify=null
factory --from=src --to=dist --minify=js
factory --from=src --to=dist --minify=css --minify=js

# Module
factory --from=src --to=dist --module
factory --from=src --to=dist --module=true
factory --from=src --to=dist --module=false
factory --from=src --to=dist --module=null
factory --from=src --to=dist --module=mjs
factory --from=src --to=dist --module=mjs --module=scss

# Prune
factory --from=src --to=dist --prune=true
factory --from=src --to=dist --prune=false
factory --from=src --to=dist -p=false

# Shut
factory --from=src --to=dist --shut=true
factory --from=src --to=dist --shut=false
factory --from=src --to=dist -x=true
~~~