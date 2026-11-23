import init from './generated/cyberstream';
import wasmUrl from './generated/cyberstream_bg.wasm?url';

export const startRust = () => init({ module_or_path: wasmUrl });
