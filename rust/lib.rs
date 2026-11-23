//! Portable catalogue, guide, subtitle and search engines shared by each client.
macro_rules! re {
    ($pattern:literal) => {{
        static RE: std::sync::LazyLock<regex::Regex> =
            std::sync::LazyLock::new(|| regex::Regex::new($pattern).expect("static expression"));
        &*RE
    }};
}
mod artwork;
mod cards;
mod compression;
mod enrollment;
mod genres;
mod grid;
mod guide;
mod guide_view;
mod language;
mod layout;
mod metadata;
mod online_subtitles;
mod playback;
mod player;
mod playlist;
mod ranking;
mod replay;
mod screens;
mod search;
mod subtitles;
mod text;
mod trakt;
mod variants;
mod views;
mod voice;
mod xtream;
