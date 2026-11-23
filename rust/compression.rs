use flate2::write::MultiGzDecoder;
use std::io::Write;
use wasm_bindgen::prelude::*;

/// The host feeds at most 8 KiB compressed at a time and drains each result before reading more.
#[wasm_bindgen]
pub struct GzipReader(MultiGzDecoder<Vec<u8>>);
#[wasm_bindgen]
impl GzipReader {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(MultiGzDecoder::new(Vec::new()))
    }
    pub fn feed(&mut self, bytes: &[u8], end: bool) -> Result<Vec<u8>, String> {
        self.0
            .write_all(bytes)
            .map_err(|_| "Données gzip invalides")?;
        if end {
            self.0.try_finish().map_err(|_| "Fichier gzip incomplet")?;
        }
        Ok(std::mem::take(self.0.get_mut()))
    }
}
impl Default for GzipReader {
    fn default() -> Self {
        Self::new()
    }
}
