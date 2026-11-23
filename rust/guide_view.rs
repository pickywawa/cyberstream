//! Reconcile only the visible cells. Retained buttons keep their DOM identity and TV remote focus.
use serde::Deserialize;
use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;
use web_sys::{Document, Element};

#[derive(Deserialize)]
struct Slot(f64, f64, String);
struct Cell {
    button: Element,
    title: Element,
    time: Element,
    label: String,
    hours: String,
    class: String,
    geometry: String,
}
impl Cell {
    fn new(doc: &Document, parent: &Element) -> Result<Self, JsValue> {
        let button = doc.create_element("button")?;
        button.set_attribute("data-f", "")?;
        let title = doc.create_element("div")?;
        title.set_class_name("t ellipsis");
        let time = doc.create_element("div")?;
        time.set_class_name("h ellipsis");
        button.append_child(&title)?;
        button.append_child(&time)?;
        parent.append_child(&button)?;
        Ok(Self {
            button,
            title,
            time,
            label: String::new(),
            hours: String::new(),
            class: String::new(),
            geometry: String::new(),
        })
    }
}
fn local_time(ts: f64, fr: bool) -> String {
    let date = js_sys::Date::new(&JsValue::from_f64(ts));
    format!(
        "{:02}{}{:02}",
        date.get_hours(),
        if fr { 'h' } else { ':' },
        date.get_minutes()
    )
}

#[wasm_bindgen]
pub struct GuideRow {
    slots: Vec<Slot>,
    visible: HashMap<usize, Cell>,
    host: Element,
    doc: Document,
}
#[wasm_bindgen]
impl GuideRow {
    #[wasm_bindgen(constructor)]
    pub fn new(host: Element) -> Result<Self, JsValue> {
        let doc = host
            .owner_document()
            .ok_or_else(|| JsError::new("Document indisponible"))?;
        Ok(Self {
            slots: Vec::new(),
            visible: HashMap::new(),
            host,
            doc,
        })
    }
    pub fn schedule(&mut self, data: &str) -> Result<(), String> {
        self.slots = serde_json::from_str(data).map_err(|_| "Programmes invalides")?;
        Ok(())
    }
    #[allow(clippy::too_many_arguments)]
    pub fn paint(
        &mut self,
        day: f64,
        end: f64,
        now: f64,
        left: f64,
        right: f64,
        channel_width: f64,
        pixels_per_minute: f64,
        catchup: bool,
        fr: bool,
    ) -> Result<(), JsValue> {
        let x = |ts: f64| channel_width + (ts - day) / 60000. * pixels_per_minute;
        let mut keep = HashSet::new();
        for (index, Slot(start, stop, label)) in self.slots.iter().enumerate() {
            let begin = x(*start).max(channel_width);
            let finish = x(stop.min(end));
            if finish < left || begin > right || finish < channel_width {
                continue;
            }
            keep.insert(index);
            let cell = match self.visible.entry(index) {
                std::collections::hash_map::Entry::Occupied(e) => e.into_mut(),
                std::collections::hash_map::Entry::Vacant(e) => {
                    let cell = Cell::new(&self.doc, &self.host)?;
                    cell.button.set_attribute("data-slot", &index.to_string())?;
                    e.insert(cell)
                }
            };
            let class = if *start <= now && now < *stop {
                "guide-prog now"
            } else if *stop <= now {
                if catchup {
                    "guide-prog past replay"
                } else {
                    "guide-prog past"
                }
            } else {
                "guide-prog"
            };
            if cell.class != class {
                cell.button.set_class_name(class);
                cell.class = class.into();
            }
            if cell.label != *label {
                cell.title.set_text_content(Some(label));
                cell.label.clone_from(label);
            }
            let hours = format!("{} – {}", local_time(*start, fr), local_time(*stop, fr));
            if cell.hours != hours {
                cell.time.set_text_content(Some(&hours));
                cell.hours = hours;
            }
            let geometry = format!(
                "left:{begin:.2}px;width:{:.2}px",
                (finish - begin - 3.).max(24.)
            );
            if cell.geometry != geometry {
                cell.button.set_attribute("style", &geometry)?;
                cell.geometry = geometry;
            }
        }
        self.visible.retain(|i, cell| {
            if keep.contains(i) {
                true
            } else {
                cell.button.remove();
                false
            }
        });
        Ok(())
    }
}
