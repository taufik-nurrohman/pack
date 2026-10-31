#!/usr/bin/env node

import * as sass from 'sass';
import pug from 'pug';
import yargs from 'yargs';
import { build } from 'esbuild';
import { format } from 'prettier';
import { hideBin } from 'yargs/helpers';

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

const args = yargs(hideBin(process.argv)).options({
    'export': { alias: 'e', default: "", describe: 'JavaScript module name.', type: 'string' },
    'from': { default: "", demandOption: true, describe: 'Folder to store the source files.', type: 'string' },
    'license': { alias: 'l', default: false, describe: 'Insert license comment at the top of the file.', type: 'boolean' },
    'minify': { alias: 'z', describe: 'Include the minified files to the result folder as well.', string: true, type: 'array' },
    'module': { alias: 'm', describe: 'Include module files to the result folder as well.', string: true, type: 'array' },
    'prune': { alias: 'p', default: true, describe: 'Prune result folder before re-build.', type: 'boolean' },
    'shut': { alias: 'x', default: false, describe: 'Disable logging.', type: 'boolean' },
    'to': { default: "", demandOption: true, describe: 'Folder to store the distributable files.', type: 'string' }
}).help().middleware(argv => {
    if (!argv.minify) {
        argv.minify = false;
    } else if (0 === argv.minify.length) {
        argv.minify = ['css', 'js'];
    } else if (1 === argv.minify.length && 'false' === argv.minify[0]) {
        argv.minify = false;
    } else if (1 === argv.minify.length && 'null' === argv.minify[0]) {
        argv.minify = null;
    } else if (1 === argv.minify.length && 'true' === argv.minify[0]) {
        argv.minify = ['css', 'html', 'js'];
    }
    if (!argv.module) {
        argv.module = false;
    } else if (0 === argv.module.length) {
        argv.module = ['mjs', 'scss'];
    } else if (1 === argv.module.length && 'false' === argv.module[0]) {
        argv.module = false;
    } else if (1 === argv.module.length && 'null' === argv.module[0]) {
        argv.module = null;
    } else if (1 === argv.module.length && 'true' === argv.module[0]) {
        argv.module = ['mjs', 'pug', 'scss'];
    }
}).argv;

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
        build.onResolve({ filter: /.*/ }, a => {
            if (a.kind === 'url-token') {
                return {
                    path: a.path,
                    external: true
                };
            }
        });
        build.onResolve({ filter: /^[.]{1,2}[\\\/]/ }, a => {
            return {
                namespace: 'file',
                path: resolve(dirname(a.importer), a.path)
            };
        });
        build.onResolve({ filter: /^https?:[\\\/]{2}/ }, a => {
            return {
                namespace: 'link',
                path: a.path
            };
        });
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
                const x = file.path.split('.').pop();
                const parser = parserMap[x] || x;
                let s = file.text;
                if (!minify) {
                    s = await format(file.text, {
                        parser,
                        plugins: ['@prettier/plugin-pug', '@prettier/plugin-xml'],
                        printWidth: printWidthNarrow.includes(x) ? 120 : 1000000,
                        pugAttibuteSeparator: 'none',
                        pugSortAttributes: 'asc',
                        tabWidth: tabWidthNarrow.includes(x) ? 2 : 4,
                        useTabs: false,
                        xmlQuoteAttributes: 'double',
                        xmlSortAttributesByKey: true
                    });
                }
                if (args.license && state.licenseComment[x]) {
                    s = (minify ? state.licenseComment[x].trim() + (state.licenseComment[x].startsWith('//') ? '\n' : "") : state.licenseComment[x]) + s;
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

const parserMap = {
    cjs: 'babel',
    js: 'babel',
    md: 'markdown',
    mjs: 'babel',
    mkd: 'markdown',
    svg: 'xml',
    ts: 'babel-ts',
    yml: 'yaml'
};

const printWidthNarrow = ['md', 'mkd', 'markdown'];
const tabWidthNarrow = ['css', 'html', 'json', 'pug', 'scss', 'svg', 'xml'];

let license, state = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8').catch(e => ""));

state.licenseComment = {};
state.year = (new Date).getFullYear();

if (args.license) {
    license = await readFile(join(from, 'LICENSE'), 'utf8').catch(e => "") || await readFile(join(from, 'LICENSE.txt'), 'utf8').catch(e => "");
    if ("" !== license.trim()) {
        license = parse(license, state);
        let short = !license.includes('\n');
        state.licenseComment.css = (short ? '/*! ' + license + ' */' : '/*!\n *\n' + license.replace(/^.*$/gm, m => "" === m.trim() ? ' *' : ' * ' + m) + '\n *\n */') + '\n\n';
        state.licenseComment.html = (short ? '<!-- ' + license + ' -->' : '<!--\n\n' + license + '\n\n-->') + '\n';
        state.licenseComment.js = (short ? '//' + license : license.replace(/^.*$/gm, m => "" === m.trim() ? '//' : '// ' + m)) + '\n\n';
        state.licenseComment.mjs = (short ? '/*! ' + license + ' */' : '/*!\n *\n' + license.replace(/^.*$/gm, m => "" === m.trim() ? ' *' : ' * ' + m) + '\n *\n */') + '\n\n';
        state.licenseComment.pug = (short ? '//- ' + license : license.replace(/^.*$/gm, m => "" === m.trim() ? '//-' : '//- ' + m)) + '\n';
        state.licenseComment.scss = (short ? '/*! ' + license + ' */' : '/*!\n *\n' + license.replace(/^.*$/gm, m => "" === m.trim() ? ' *' : ' * ' + m) + '\n *\n */') + '\n\n';
    }
}

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

const asMinify = path => {
    let any = path.split('.'),
        x = any.pop();
    return any.join('.') + '.min.' + x;
};

const files = await scan(from);

const others = [[], []];
const plains = [[], []];

const scripts = [[], []];
const styles = [[], []];
const templates = [[], []];

for (const file of files) {
    let fileName;
    if (file.endsWith('.mjs')) {
        fileName = relative(from, file).slice(0, -4);
        scripts[0].push({ in: file, out: fileName });
        scripts[1].push({ in: file, out: asMinify(fileName) });
    } else if (file.endsWith('.pug')) {
        fileName = relative(from, file).slice(0, -4);
        templates[0].push({ in: file, out: fileName });
        templates[1].push({ in: file, out: asMinify(fileName) });
    } else if (file.endsWith('.scss')) {
        fileName = relative(from, file).slice(0, -5);
        styles[0].push({ in: file, out: fileName });
        styles[1].push({ in: file, out: asMinify(fileName) });
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
        if (args.module && args.module.includes('mjs')) {
            const file = join(to, script.out.slice(0, -2) + 'mjs');
            await mkdir(dirname(file), { recursive: true });
            let s = await readFile(script.in, 'utf8');
            args.license && (s = state.licenseComment.mjs + s);
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
        entryPoints: scripts[0].map(a => ({ in: a.in, out: a.out.slice(0, -3) })),
        format: 'iife',
        globalName: args.export,
        logLevel: 'silent',
        metafile: true,
        minify: false,
        outdir: to,
        platform: 'browser',
        plugins: [importPlugin, logPlugin, writePlugin(false)],
        target: 'es2022',
        write: false
    });
    if (args.minify && args.minify.includes('js')) {
        await build({
            bundle: true,
            entryPoints: scripts[1].map(a => ({ in: a.in, out: a.out.slice(0, -3) })),
            format: 'iife',
            globalName: args.export,
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
        if (args.module && args.module.includes('scss')) {
            const file = join(to, style.out.slice(0, -3) + 'scss');
            await mkdir(dirname(file), { recursive: true });
            let s = await readFile(style.in, 'utf8');
            args.license && (s = state.licenseComment.scss + s);
            state.file = { from: at(style.in, '/'), to: at(file, '/') };
            state.folder = { from: at(dirname(style.in), '/'), to: at(dirname(file), '/') };
            await writeFile(file, parse(s, state));
            args.shut || log('Create file', file);
        }
        const file = join(to, style.out);
        await mkdir(dirname(file), { recursive: true });
        let s = sass.compile(style.in, {
            charset: false,
            silenceDeprecations: ['import']
        }).css;
        args.license && (s = state.licenseComment.css + s);
        s = await format(s, {
            parser: 'css',
            tabWidth: 2,
            useTabs: false
        });
        state.file = { from: at(style.in, '/'), to: at(file, '/') };
        state.folder = { from: at(dirname(style.in), '/'), to: at(dirname(file), '/') };
        await writeFile(file, parse(s, state));
        styles[0][k].in = file;
        styles[1][k].in = file;
        args.shut || log('Create file', file);
    }
    await build({
        bundle: true,
        entryPoints: styles[0].map(a => ({ in: a.in, out: a.out.slice(0, -4) })),
        logLevel: 'silent',
        metafile: true,
        minify: false,
        outdir: to,
        platform: 'browser',
        plugins: [importPlugin, logPlugin, writePlugin(false)],
        target: 'es2022',
        write: false
    });
    if (args.minify && args.minify.includes('css')) {
        await build({
            bundle: true,
            entryPoints: styles[1].map(a => ({ in: a.in, out: a.out.slice(0, -4) })),
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
        if (args.module && args.module.includes('pug')) {
            const file = join(to, template.out.replace(/\.(p?html|php\d*)$/, "") + '.pug');
            await mkdir(dirname(file), { recursive: true });
            let s = await readFile(template.in, 'utf8');
            args.license && (s = state.licenseComment.pug + s);
            state.file = { from: at(template.in, '/'), to: at(file, '/') };
            state.folder = { from: at(dirname(template.in), '/'), to: at(dirname(file), '/') };
            await writeFile(file, parse(s, state));
            args.shut || log('Create file', file);
        }
        const file = join(to, template.out);
        await mkdir(dirname(file), { recursive: true });
        let s = pug.renderFile(template.in, {
            doctype: 'html',
            ...state
        }), s1 = s; // Result is minified by default
        args.license && (s = state.licenseComment.html + s);
        args.license && (s1 = state.licenseComment.html.trim() + s1);
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
        if (args.minify && args.minify.includes('html')) {
            const file = join(to, asMinify(template.out));
            await writeFile(file, parse(s1, state));
            args.shut || log('Create file', file);
        }
    }
}