import { readFileSync } from 'node:fs';
import { initSync } from '../src/rust/generated/cyberstream';
initSync({ module: readFileSync(new URL('../src/rust/generated/cyberstream_bg.wasm', import.meta.url)) });
