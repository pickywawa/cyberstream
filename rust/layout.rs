use wasm_bindgen::prelude::*;

/// Grid and guide rows have uniform heights. Storage is independent of catalogue size.
#[wasm_bindgen]
pub fn visible_rows(
    count: usize,
    height: f64,
    top: f64,
    viewport: f64,
    overscan: usize,
) -> Vec<u32> {
    if height <= 0. || count == 0 {
        return vec![0, 0];
    }
    let first = (top.max(0.) / height).floor() as usize;
    let end = ((top + viewport).max(0.) / height).ceil() as usize;
    vec![
        first.saturating_sub(overscan).min(count) as u32,
        end.saturating_add(overscan).min(count) as u32,
    ]
}

/// Rectangles are [left, top, right, bottom]. Return the nearest D-pad target.
#[wasm_bindgen]
pub fn focus_target(origin: &[f64], rects: &[f64], dir: &str) -> i32 {
    let [l, t, r, b] = *origin else { return -1 };
    let mut best = f64::INFINITY;
    let mut index = -1;
    for (i, [x, y, u, v]) in rects.as_chunks::<4>().0.iter().copied().enumerate() {
        if x >= u || y >= v {
            continue;
        }
        let dx = (x + u - l - r) * 0.5;
        let dy = (y + v - t - b) * 0.5;
        let (primary, secondary) = match dir {
            "right" if x >= r - 4. || dx > 1. => (x - r, dy.abs() * 2.),
            "left" if u <= l + 4. || dx < -1. => (l - u, dy.abs() * 2.),
            "down" if y >= b - 4. || dy > 1. => (y - b, dx.abs() * 0.5),
            "up" if v <= t + 4. || dy < -1. => (t - v, dx.abs() * 0.5),
            _ => continue,
        };
        let score = primary.max(0.) + secondary;
        if score < best {
            index = i as i32;
            best = score
        }
    }
    index
}
