#!/usr/bin/env node

import * as sass from 'sass';
import pug from 'pug';
import yargs from 'yargs';
import { build } from 'esbuild';
import { format } from 'prettier';

import {
    copyFile,
    mkdir,
    readFile,
    readdir,
    rm,
    writeFile
} from 'node:fs/promises';

import {
    dirname,
    join,
    relative,
    resolve
} from 'node:path';

const args = yargs(process.argv.slice(2))
    .options({
        'css-enter': { default: "", describe: 'Insert string at the top of the CSS file', type: 'string' },
        'css-exit': { default: "", describe: 'Insert string at the bottom of the CSS file', type: 'string' },
        'from': { default: 'src', describe: 'Folder to store the source files', type: 'string' },
        'html-enter': { default: "", describe: 'Insert string at the top of the HTML file', type: 'string' },
        'html-exit': { default: "", describe: 'Insert string at the bottom of the HTML file', type: 'string' },
        'js-enter': { default: "", describe: 'Insert string at the top of the JS file', type: 'string' },
        'js-exit': { default: "", describe: 'Insert string at the bottom of the JS file', type: 'string' },
        'js-export': { default: "", describe: 'JavaScript module name', type: 'string' },
        'minify': { default: false, describe: 'Include minified CSS, HTML, and JS files to the output as well', type: 'boolean' },
        'mjs': { default: false, describe: 'Include MJS files to the output as well', type: 'boolean' },
        'mjs-enter': { default: "", describe: 'Insert string at the top of the MJS file', type: 'string' },
        'mjs-exit': { default: "", describe: 'Insert string at the bottom of the MJS file', type: 'string' },
        'prune': { default: true, describe: 'Clean-up dist folder before re-compile', type: 'boolean' },
        'pug': { default: false, describe: 'Include Pug files to the output as well', type: 'boolean' },
        'pug-enter': { default: "", describe: 'Insert string at the top of the PUG file', type: 'string' },
        'pug-exit': { default: "", describe: 'Insert string at the bottom of the PUG file', type: 'string' },
        'scss': { default: false, describe: 'Include SCSS files to the output as well', type: 'boolean' },
        'scss-enter': { default: "", describe: 'Insert string at the top of the SCSS file', type: 'string' },
        'scss-exit': { default: "", describe: 'Insert string at the bottom of the SCSS file', type: 'string' },
        'shut': { default: false, describe: 'Disable logging', type: 'boolean' },
        'to': { default: 'dist', describe: 'Folder to store the distributable files', type: 'string' }
    })
    .command('--from=src --to=dist')
    .help()
    .argv;

const at = (path, join = '\\') => {
    let d = cwd.replace(/[\\\/]/g, join) + join;
    path = path.replace(/[\\\/]/g, join);
    if (path.startsWith(d)) {
        path = path.slice(d.length);
    }
    return '.' + join + path;
};

const cwd = process.cwd();

const importPlugin = {
    name: 'import',
    setup(build) {
        build.onResolve({ filter: /^[.]{1,2}[\\\/]/ }, a => ({
            namespace: 'file',
            path: resolve(dirname(a.importer), a.path)
        }));
        build.onResolve({ filter: /^https?:[\\\/]{2}/ }, a => ({
            namespace: 'link',
            path: a.path
        }));
        build.onLoad({ filter: /.*/, namespace: 'file' }, async a => {
            return {
                contents: await readFile(a.path, 'utf8'),
                loader: importPluginLoader(a)
            };
        });
        build.onLoad({ filter: /.*/, namespace: 'link' }, async a => {
            log('Fetch', a.path);
            const r = await fetch(a.path);
            if (!r.ok) {
                args.shut || log('Could not fetch', a.path, 31);
                return;
            }
            return {
                contents: await r.text(),
                loader: importPluginLoader(a)
            };
        });
    }
};

const importPluginLoader = (a, alt = null) => {
    const x = a.path.split('.').pop();
    return {
        css: 'css',
        js: 'js',
        mjs: 'js',
        scss: 'css'
    }[x] || alt;
};

const writePlugin = minify => ({
    name: 'write',
    setup(build) {
        build.onEnd(async result => {
            if (result.errors.length) {
                return;
            }
            for (const file of result.outputFiles ?? []) {
                let s = file.text;
                if (!minify) {
                    const x = file.path.split('.').pop();
                    const parser = {
                        cjs: 'babel',
                        js: 'babel',
                        md: 'markdown',
                        mjs: 'babel',
                        mkd: 'markdown',
                        ts: 'babel-ts',
                        yml: 'yaml',
                    }[x] || x;
                    s = await format(file.text, {
                        parser,
                        tabWidth: ['css', 'html', 'pug', 'scss', 'svg', 'xml'].includes(x) ? 2 : 4,
                        useTabs: false
                    });
                }
                state.file = { to: at(file.path, '/') };
                state.folder = { to: at(dirname(file.path), '/') };
                await writeFile(file.path, parse(s, state));
            }
        });
    }
});

const log = (task, path, color) => {
    if (path.includes('://')) {
        console.log('\x1b[' + (color ?? 32) + 'm●\x1b[0m ' + task + ' `' + path + '`');
    } else {
        console.log('\x1b[' + (color ?? 34) + 'm●\x1b[0m ' + task + ' `' + at(path) + '`');
    }
};

const logPlugin = {
    name: 'log',
    setup(build) {
        build.onEnd(result => {
            if (args.shut || result.errors.length) {
                return;
            }
            for (const file of Object.keys(result.metafile?.outputs ?? {})) {
                log('Create file', file);
            }
        });
    }
};

const parse = (s, state, pattern = '%\\((\\S+?)\\)', split = '.') => {
    return s.replace(new RegExp(pattern, 'g'), (m0, m1) => {
        // <https://stackoverflow.com/a/6394168>
        return m1.split(split).reduce((o, k) => o[k] || "", state);
    });
};

const from = resolve(join(cwd, args.from));
const to = resolve(join(cwd, args.to));

let license = await readFile(join(from, 'LICENSE'), 'utf8').catch(e => "") || await readFile(join(from, 'LICENSE.txt'), 'utf8').catch(e => "");
let state = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8').catch(e => ""));

state.year = (new Date).getFullYear();

license = parse(license, state);

state.css = { license: '/*!\n *\n' + license.replace(/^.*$/gm, m => "" === m.trim() ? ' *' : ' * ' + m) + '\n *\n */' };
state.html = { license: '<!--\n\n' + license + '\n\n-->' };
state.js = { license: license.replace(/^.*$/gm, m => "" === m.trim() ? '//' : '// ' + m) };
state.mjs = { license: '/*!\n *\n' + license.replace(/^.*$/gm, m => "" === m.trim() ? ' *' : ' * ' + m) + '\n *\n */' };
state.pug = { license: license.replace(/^.*$/gm, m => "" === m.trim() ? '//-' : '//- ' + m) };

delete state.scripts;

async function scan(folder) {
    const files = [];
    for (const f of await readdir(folder, { withFileTypes: true })) {
        if (f.name.startsWith('_')) {
            continue;
        }
        const path = join(folder, f.name);
        if (f.isDirectory()) {
            files.push(...await scan(path));
        } else if (f.isFile()) {
            files.push(path);
        }
    }
    return files;
}

if (args.prune) {
    // The developer was drunk and decided to store the production-ready file(s) in the project’s root folder
    if (cwd === to) {
        const files = await scan(to);
        const testFrom = from.slice(cwd.length).replace(/[\\\/]/g, '/');
        for (const file of files) {
            const testTo = file.slice(cwd.length).replace(/[\\\/]/g, '/');
            // Skip the “dev” folder
            if (testTo.startsWith(testFrom)) {
                continue;
            }
            // Do not prune hidden file(s) and folder(s)
            if (testTo.startsWith('/.')) {
                continue;
            }
            // Do not prune `node_modules`
            if (testTo.startsWith('/node_modules/')) {
                continue;
            }
            // Skip special file(s)
            if ([
                '/LICENSE',
                '/README.md',
                '/composer.json',
                '/composer.lock',
                '/package-lock.json',
                '/package.json'
            ].includes(testTo)) {
                continue;
            }
            args.shut || log('Prune file', file);
            await rm(to, { force: true, recursive: true });
        }
    } else {
        args.shut || log('Prune folder', to);
        await rm(to, { force: true, recursive: true });
    }
}

await mkdir(to, { recursive: true });

const files = await scan(from);

const others = [[], []];
const plains = [[], []];

const scripts = [[], []];
const styles = [[], []];
const templates = [[], []];

for (const file of files) {
    let fileName;
    if (file.endsWith('.css.scss')) {
        fileName = relative(from, file).slice(0, -9);
        styles[0].push({ in: file, out: fileName });
        styles[1].push({ in: file, out: fileName + '.min' });
    } else if (file.endsWith('.html.pug')) {
        fileName = relative(from, file).slice(0, -9);
        templates[0].push({ in: file, out: fileName });
        templates[1].push({ in: file, out: fileName + '.min' });
    } else if (file.endsWith('.js.mjs')) {
        fileName = relative(from, file).slice(0, -7);
        scripts[0].push({ in: file, out: fileName });
        scripts[1].push({ in: file, out: fileName + '.min' });
    } else if (file.endsWith('.txt')) {
        plains[0].push({ in: file, out: relative(from, file).slice(0, -4) });
    } else {
        others[0].push({ in: file, out: relative(from, file) });
    }
}

if (others[0].length) {
    for (const other of others[0]) {
        const file = join(to, other.out);
        await mkdir(dirname(file), { recursive: true });
        await copyFile(other.in, file);
        args.shut || log('Copy file', file);
    }
}

if (plains[0].length) {
    for (const plain of plains[0]) {
        const file = join(to, plain.out);
        await mkdir(dirname(file), { recursive: true });
        let s = await readFile(plain.in, 'utf8');
        state.file = { from: at(plain.in, '/'), to: at(file, '/') };
        state.folder = { from: at(dirname(plain.in), '/'), to: at(dirname(file), '/') };
        await writeFile(file, parse(s, state));
        args.shut || log('Create file', file);
    }
}

if (scripts[0].length) {
    for (const script of scripts[0]) {
        if (args.mjs) {
            const file = join(to, script.out + '.mjs');
            await mkdir(dirname(file), { recursive: true });
            let s = await readFile(script.in, 'utf8');
            args.mjsEnter && (s = args.mjsEnter + s);
            args.mjsExit && (s += args.mjsExit);
            s = await format(s, {
                parser: 'babel',
                tabWidth: 4,
                useTabs: false
            });
            state.file = { from: at(script.in, '/'), to: at(file, '/') };
            state.folder = { from: at(dirname(script.in), '/'), to: at(dirname(file), '/') };
            await writeFile(file, parse(s, state));
            args.shut || log('Create file', file);
        }
    }
    await build({
        bundle: true,
        entryPoints: scripts[0],
        format: 'iife',
        globalName: args.jsExport,
        logLevel: 'silent',
        metafile: true,
        minify: false,
        outdir: to,
        platform: 'browser',
        plugins: [importPlugin, logPlugin, writePlugin(false)],
        target: 'es2022',
        write: false
    });
    if (args.minify) {
        await build({
            bundle: true,
            entryPoints: scripts[1],
            format: 'iife',
            globalName: args.jsExport,
            logLevel: 'silent',
            metafile: true,
            minify: true,
            outdir: to,
            platform: 'browser',
            plugins: [importPlugin, logPlugin, writePlugin(true)],
            target: 'es2022',
            write: false
        });
    }
}

if (styles[0].length) {
    for (const k in styles[0]) {
        const style = styles[0][k];
        if (args.scss) {
            const file = join(to, style.out + '.scss');
            await mkdir(dirname(file), { recursive: true });
            let s = await readFile(style.in, 'utf8');
            args.scssEnter && (s = args.scssEnter + s);
            args.scssExit && (s += args.scssExit);
            state.file = { from: at(style.in, '/'), to: at(file, '/') };
            state.folder = { from: at(dirname(style.in), '/'), to: at(dirname(file), '/') };
            await writeFile(file, parse(s, state));
            args.shut || log('Create file', file);
        }
        const file = join(to, style.out + '.css');
        await mkdir(dirname(file), { recursive: true });
        let s = sass.compile(style.in, {
            charset: false,
            silenceDeprecations: ['import']
        }).css;
        args.cssEnter && (s = args.cssEnter + s);
        args.cssExit && (s += args.cssExit);
        state.file = { from: at(style.in, '/'), to: at(file, '/') };
        state.folder = { from: at(dirname(style.in), '/'), to: at(dirname(file), '/') };
        await writeFile(file, parse(s, state));
        styles[0][k].in = file;
        styles[1][k].in = file;
        args.shut || log('Create file', file);
    }
    await build({
        bundle: true,
        entryPoints: styles[0],
        logLevel: 'silent',
        metafile: true,
        minify: false,
        outdir: to,
        platform: 'browser',
        plugins: [importPlugin, logPlugin, writePlugin(false)],
        target: 'es2022',
        write: false
    });
    if (args.minify) {
        await build({
            bundle: true,
            entryPoints: styles[1],
            logLevel: 'silent',
            metafile: true,
            minify: true,
            outdir: to,
            plugins: [importPlugin, logPlugin, writePlugin(true)],
            target: 'es2022',
            write: false
        });
    }
}

if (templates[0].length) {
    for (const k in templates[0]) {
        const template = templates[0][k];
        if (args.pug) {
            const file = join(to, template.out + '.pug');
            await mkdir(dirname(file), { recursive: true });
            let s = await readFile(template.in, 'utf8');
            args.pugEnter && (s = args.pugEnter + s);
            args.pugExit && (s += args.pugExit);
            state.file = { from: at(template.in, '/'), to: at(file, '/') };
            state.folder = { from: at(dirname(template.in), '/'), to: at(dirname(file), '/') };
            await writeFile(file, parse(s, state));
            args.shut || log('Create file', file);
        }
        const file = join(to, template.out + '.html');
        await mkdir(dirname(file), { recursive: true });
        let s = pug.renderFile(template.in, {
            doctype: 'html',
            ...state
        }), s1 = s; // Result is minified by default
        args.htmlEnter && (s = args.htmlEnter + s);
        args.htmlExit && (s += args.htmlExit);
        state.file = { from: at(template.in, '/'), to: at(file, '/') };
        state.folder = { from: at(dirname(template.in), '/'), to: at(dirname(file), '/') };
        s = await format(s, {
            parser: 'html',
            tabWidth: 2
        });
        // <https://github.com/prettier/prettier/issues/5641>
        s = s.replace(/ \/>/g, '>');
        await writeFile(file, parse(s, state));
        args.shut || log('Create file', file);
        if (args.minify) {
            const file = join(to, template.out + '.min.html');
            await writeFile(file, parse(s1, state));
            args.shut || log('Create file', file);
        }
    }
}