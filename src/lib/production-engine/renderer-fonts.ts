import fs from 'node:fs/promises';
import path from 'node:path';
import { ProductionError } from './errors';

let fontCss: Promise<string> | undefined;

export function embeddedFontCss(): Promise<string> {
  fontCss ??= Promise.all([
    fs.readFile(path.join(process.cwd(), 'public/fonts/mona-sans.woff2')),
    fs.readFile(path.join(process.cwd(), 'public/fonts/jetbrains-mono.ttf')),
  ]).then(([sans, mono]) => {
    if (sans.length > 5 * 1024 * 1024 || mono.length > 5 * 1024 * 1024 ||
        sans.subarray(0, 4).toString() !== 'wOF2' || mono.readUInt32BE(0) !== 0x00010000) {
      throw new Error('Invalid bundled font');
    }
    return `@font-face{font-family:"Mona Sans";src:url(data:font/woff2;base64,${sans.toString('base64')}) format("woff2");font-weight:100 900;font-style:normal;font-display:block}
@font-face{font-family:"JetBrains Mono";src:url(data:font/ttf;base64,${mono.toString('base64')}) format("truetype");font-weight:100 800;font-style:normal;font-display:block}
body{font-family:"Mona Sans","Noto Sans CJK SC","Noto Sans CJK JP","Noto Sans CJK KR",sans-serif}
.mono,code,pre{font-family:"JetBrains Mono","Noto Sans Mono CJK SC","Noto Sans CJK JP","Noto Sans CJK KR",monospace}`;
  }).catch(() => {
    fontCss = undefined;
    throw new ProductionError('Bundled Mona Sans and JetBrains Mono fonts are missing or invalid. Deploy public/fonts with the application.', 'FONT_CONFIGURATION', 503);
  });
  return fontCss;
}
