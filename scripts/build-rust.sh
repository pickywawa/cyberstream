#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
cargo build --locked --release --target wasm32-unknown-unknown
wasm-bindgen target/wasm32-unknown-unknown/release/cyberstream.wasm --target web --out-dir src/rust/generated
