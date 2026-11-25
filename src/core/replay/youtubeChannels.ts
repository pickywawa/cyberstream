/**
 * YouTube channels of broadcasters and media per country, by theme (verified: each one publishes
 * through its public RSS feed). INT_EN: international channels in English. Generated, then reviewed.
 */
export interface YtChannel {
  id: string;
  name: string;
}

export const YT_CHANNELS: Record<string, Partial<Record<'docs' | 'sport' | 'news' | 'radio' | 'humor' | 'media', YtChannel[]>>> = {
  FR: {
    docs: [
      { id: "UCwI-JbGNsojunnHbFAc0M4Q", name: "ARTE" },
      { id: "UCd5DKToXYTKAQ6khzewww2g", name: "France Culture" },
    ],
    news: [
      { id: "UCXwDLMDV86ldKoFVc_g8P0g", name: "BFMTV" },
      { id: "UCO6K_kkdP-lnSCiO3tPx7WA", name: "franceinfo" },
      { id: "UCCCPCZNChQdGa9EkATeye4g", name: "FRANCE 24" },
    ],
    sport: [
      { id: "UCyIV8rkza5Uk_sJIhqilBvQ", name: "L'Équipe" },
      { id: "UCR5V8BTvlkyYtw6T_9swNEw", name: "RMC Sport" },
      { id: "UC8ggH3zU61XO0nMskSQwZdA", name: "CANAL+ Sport" },
    ],
    humor: [
      { id: "UCPHJfLg1VeNBsfzzTszpmmQ", name: "Montreux Comedy" },
      { id: "UCI5jJx0Mk7IgnYz9wxvoQLw", name: "Jamel Comedy Club" },
      { id: "UCoZoRz4-y6r87ptDp4Jk74g", name: "Palmashow" },
      { id: "UCww2zZWg4Cf5xcRKG-ThmXQ", name: "Norman" },
      { id: "UCyWqModMQlbIo8274Wh_ZsQ", name: "Cyprien" },
    ],
    media: [
      { id: "UCSKdvgqdnj72_SLggp7BDTg", name: "Brut" },
      { id: "UCHQda5vLxrH0Ff0I0kMq4zw", name: "Konbini" },
      { id: "UCYpRDnhk5H8h16jpS84uqsA", name: "Le Monde" },
      { id: "UC__xRB5L4toU9yYawt_lIKg", name: "Blast" },
    ],
    radio: [
      { id: "UC_ykXc7v9zZQdOG5QvJqpgg", name: "RTL" },
      { id: "UCJldRgT_D7Am-ErRHQZ90uw", name: "France Inter" },
      { id: "UCIMGfEAERXjmWwQeg15BFsg", name: "Europe 1" },
      { id: "UCCXCqCR3s-McFHDGnl4ta_A", name: "NRJ" },
    ],
  },
  GB: {
    docs: [
      { id: "UCooTDp-fERMGRHIQ4VL4qlg", name: "Channel 4 Documentaries" },
      { id: "UCu4XcDBdnZkV6-5z2f16M0g", name: "Real Stories" },
      { id: "UC2ccm1GajfSujz7T18d7cKA", name: "BBC Studios" },
      { id: "UCwmZiChSryoWQCZMIQezgTg", name: "BBC Earth" },
      { id: "UC88lvyJe7aHZmcvzvubDFRg", name: "Timeline - World History Documentaries" },
    ],
    news: [
      { id: "UC16niRr50-MSBwiO3YDb3RA", name: "BBC News" },
      { id: "UCoMdktPbSTixAyNGwb-UYkQ", name: "Sky News" },
      { id: "UCTrQ7HXWRRxr7OsOtodr2_w", name: "Channel 4 News" },
      { id: "UCIRYBXDze5krPDzAEOxFGVA", name: "Guardian News" },
      { id: "UCFQgi22Ht00CpaOQLtvZx2A", name: "ITV News" },
      { id: "UCoUxsWakJucWg46KW5RsvPw", name: "Financial Times" },
    ],
    sport: [
      { id: "UCTU_wC79Dgi9rh4e9-baTqA", name: "Sky Sports" },
      { id: "UCW6-BQWFA70Dyyc7ZpZ9Xlg", name: "BBC Sport" },
      { id: "UC7HEj8odlxsmyyzmBFK6Znw", name: "TNT Sports" },
      { id: "UCZ7wY7MRDSygp63HIEfdQZA", name: "Sky Sports Football" },
      { id: "UC3kxJQ9RfaS5CKeYbbFMi4Q", name: "Sky Sports F1" },
      { id: "UCG5qGWdu8nIRZqJ_GgDwQ-w", name: "Premier League" },
    ],
    humor: [
      { id: "UCT5C7yaO3RVuOgwP8JVAujQ", name: "Taskmaster" },
      { id: "UC7foTxErVJKorAitAcJuqDA", name: "BBC Comedy Greats" },
      { id: "UCz1hQ68G3XPVYEBoFDgSjcQ", name: "Channel 4 Entertainment" },
    ],
    media: [
      { id: "UCYRE3PMYatMVXmqmulF0sgA", name: "LADbible" },
      { id: "UCn8zNIfYAQNdrFRrr8oibKw", name: "VICE" },
      { id: "UC0p5jTq6Xx_DosDFxVXnWaQ", name: "The Economist" },
      { id: "UCmpTUknG47adVe5QSeufRBQ", name: "The Times" },
    ],
    radio: [
      { id: "UC-FQUIVQ-bZiefzBiQAa8Fw", name: "BBC Radio 1" },
      { id: "UCGEIZdGkIYeU6FUwvkjCrIw", name: "LBC" },
      { id: "UCZzwjZPc6R_PbnDgFVMwlvQ", name: "Capital" },
      { id: "UCWg7ZcouKaf4TQc_too6kGQ", name: "KISS" },
      { id: "UCYw-R4_yue3aGJu1xDO6cog", name: "BBC Radio 2" },
      { id: "UCm0yTweyAa0PwEIp0l3N_gA", name: "TalkTV" },
    ],
  },
  US: {
    docs: [
      { id: "UC3ScyryU9Oy9Wse3a8OAmYQ", name: "FRONTLINE PBS" },
      { id: "UCpVm7bg6pXKo1Pr6k5kxG9A", name: "National Geographic" },
      { id: "UCW39zufHfsuGgpLviKh297Q", name: "DW Documentary" },
      { id: "UCgyeJxD05YnoDquRMNBfBqw", name: "PBS" },
      { id: "UCqOoboPm3uhY_YXhvhmL-WA", name: "Discovery" },
      { id: "UCpxYSWgxVt3Pyn1ovXsGQ0g", name: "PBS Terra" },
      { id: "UCLXo7UDZvByw2ixzpQCufnA", name: "Vox" },
      { id: "UC9MAhZQQd9egwWCxrwSIsJQ", name: "HISTORY" },
    ],
    news: [
      { id: "UCupvZG-5ko_eiXAupbDfxWw", name: "CNN" },
      { id: "UCeY0bbntWzzVIaj2z3QigXg", name: "NBC News" },
      { id: "UCBi2mrWuNuyYy4gbM6fU18Q", name: "ABC News" },
      { id: "UC8p1vwvWtl6T73JiExfWs1g", name: "CBS News" },
      { id: "UC6ZFN9Tx6xh-skXCuRHCDpQ", name: "PBS NewsHour" },
      { id: "UC52X5wxOL_s5yw0dQk7NtgA", name: "Associated Press" },
      { id: "UCqnbDFdCpuN8CMEg0VuEBqA", name: "The New York Times" },
    ],
    sport: [
      { id: "UCiWLfSweyRNmLpgEHekhoAg", name: "ESPN" },
      { id: "UCqZQlzSHbVJrwrn5XvzrzcA", name: "NBC Sports" },
      { id: "UCDVYQ4Zhbm3S2dlz7P1GBDg", name: "NFL" },
      { id: "UCWJ2lWNubArHWmf3FIHbfcQ", name: "NBA" },
      { id: "UCqQo7ewe87aYAe7ub5UqXMw", name: "House of Highlights" },
      { id: "UCoLrcjPV5PbUrUyXq5mjc_A", name: "MLB" },
      { id: "UCqFMzb-4AUf6WAIbl132QKA", name: "NHL" },
      { id: "UCSZbXT5TLLW_i-5W8FZpFsg", name: "Major League Soccer" },
    ],
    humor: [
      { id: "UCqFzWxSCi39LnW1JKFR3efg", name: "Saturday Night Live" },
      { id: "UC3XTzVzaHQEd30rQbuvCtTQ", name: "Last Week Tonight" },
      { id: "UCwWhs_6x42TyRM4Wstoq8HA", name: "The Daily Show" },
      { id: "UCVTyTA7-g9nopHeHbeuvpRA", name: "Late Night with Seth Meyers" },
      { id: "UC8-Th83bH_thdKZDJCrn88g", name: "The Tonight Show Starring Jimmy Fallon" },
      { id: "UCMtFAi84ehTSYSE9XoHefig", name: "The Late Show with Stephen Colbert" },
      { id: "UCa6vGFO9ty8v5KZJXQxdhaw", name: "Jimmy Kimmel Live" },
    ],
    media: [
      { id: "UCn8zNIfYAQNdrFRrr8oibKw", name: "VICE" },
      { id: "UCgRvm1yLFoaQKhmaTqXk9SA", name: "NowThis" },
      { id: "UCddiUEpeqJcYeBxX1IVBKvQ", name: "The Verge" },
      { id: "UCftwRNsjfRo08xYE31tkiyw", name: "WIRED" },
      { id: "UCHJuQZuzapBh-CuhRYxIZrg", name: "Insider" },
    ],
    radio: [
      { id: "UCJnS2EsPfv46u1JR8cnD0NA", name: "NPR" },
      { id: "UC49ta0RHXJUiID5KWRkcySw", name: "SiriusXM" },
      { id: "UC4eYXhJI4-7wSWc8UNRwD4A", name: "NPR Music" },
      { id: "UCoBMK97ZfZmRCqIwMQYdicA", name: "iHeartRadio" },
      { id: "UC3I2GFN_F8WudD_2jUZbojA", name: "KEXP" },
      { id: "UC2Qw1dzXDBAZPwS7zm37g8g", name: "COLORS" },
    ],
  },
  IE: {
    news: [
      { id: "UC8urSFTmQDxaPDEIZ2Fd63Q", name: "RTÉ News" },
      { id: "UCNNnna72yOMxXU4n9Fg1Agg", name: "The Irish Times" },
      { id: "UCDg5Dpx6BCf_4ogh3xMqIkg", name: "The Journal" },
      { id: "UC78imML6tEzLoEcadXNu87w", name: "Virgin Media News" },
    ],
    sport: [
      { id: "UCH_7bF90ySEVfWLXtn9HlWA", name: "RTÉ Sport" },
      { id: "UCCsDOY9UaBpPnv60mxX6dQA", name: "GAA - officialgaa" },
    ],
    humor: [
      { id: "UCGnlgHCdAsCNeAdNRTbS4hg", name: "RTÉ - IRELAND’S NATIONAL PUBLIC SERVICE MEDIA" },
      { id: "UCzb-6smlTg5UPirLdsdQ_cQ", name: "Foil Arms and Hog" },
    ],
    radio: [
      { id: "UCQzMlGDlIt7PJu20-CALq6g", name: "RTÉ Radio 1" },
    ],
  },
  CA: {
    docs: [
      { id: "UCsEbwT3FHpAey6prlu7tNhw", name: "CBC Docs" },
      { id: "UCVrUO-6pGbb03EJkYnOL3VQ", name: "Télé-Québec" },
    ],
    news: [
      { id: "UCuFFtHWoLl5fauMMD5Ww2jA", name: "CBC News" },
      { id: "UCi7Zk9baY1tvdlgxIML8MXg", name: "CTV News" },
      { id: "UChLtXXpo4Ge1ReTEboVvTDg", name: "Global News" },
      { id: "UClxaaAzHu1B5EoTtBYea7ig", name: "Radio-Canada Info" },
      { id: "UCgKzdfWnTie2OD4bfaZKaQw", name: "TVA Nouvelles" },
      { id: "UCVKAcQQCO8vv87Gk62SutAg", name: "CityNews" },
    ],
    sport: [
      { id: "UCVhibwHk4WKw4leUt6JfRLg", name: "SPORTSNET" },
      { id: "UC9JZPWL5qLWyDbIUCA4g-mQ", name: "rdsca" },
    ],
    humor: [
      { id: "UCD6GYvOYBBNVm1eGQKUaGCA", name: "22 Minutes" },
      { id: "UCqq3PZwp8Ob8_jN0esCunIw", name: "Just For Laughs" },
      { id: "UC6iniX9nuuuwacoo_um3H_g", name: "Juste pour rire" },
    ],
    radio: [
      { id: "UCAILl3AE11CoqiSVs6rBwBQ", name: "CBC Music" },
    ],
  },
  AU: {
    docs: [
      { id: "UCVgO39Bk5sMo66-6o6Spn6Q", name: "ABC News (Australia)" },
    ],
    news: [
      { id: "UCIYLOcEUX6TbBo7HQVF2PKA", name: "9 News Australia" },
      { id: "UCuuTCooIMbBFHNbPcSS70uw", name: "SBS News" },
      { id: "UC5T7D-Dh1eDGtsAFCuwv_Sw", name: "7NEWS Australia" },
    ],
    sport: [
      { id: "UCaoTOpfjVfdm_XlYvwbVicQ", name: "FOX SPORTS AUSTRALIA" },
      { id: "UCxAeHdLDAatFV_vt95MSO-g", name: "AFL" },
      { id: "UC33-OkQ6VCYk8xtml8Pk4-g", name: "NRL - National Rugby League" },
      { id: "UCkBY0aHJP9BwjZLDYxAQrKg", name: "cricket.com.au" },
    ],
    humor: [
      { id: "UC_mneEC0wc29EGGmIsN_xLA", name: "Aunty Donna" },
      { id: "UCW6INBXabhocWBnsL7dNpLA", name: "The Chaser" },
    ],
    radio: [
      { id: "UCd2KNtfphz8HvYzM4pwtHmg", name: "triple j" },
    ],
  },
  NZ: {
    news: [
      { id: "UCp4OXwfZE1SaCQ4jRAuaoXQ", name: "RNZ" },
      { id: "UCxPAYgO8OpFev3PUTKbsxNw", name: "1News" },
      { id: "UCG0xyRVgb5Yf1lvQxkRrYYQ", name: "nzherald.co.nz" },
      { id: "UCZgnsVbXJPZRg5kmtKyq6Ew", name: "Stuff" },
    ],
    sport: [
      { id: "UC8f1U3h2TAcKOktgonnL0Yw", name: "Sky Sport NZ" },
      { id: "UCsAPiUMyBjtKamxYGbSUnLA", name: "All Blacks" },
    ],
  },
  DE: {
    docs: [
      { id: "UC7FeuS5wwfSR9IwOPkBV7SQ", name: "ZDFinfo Dokus & Reportagen" },
      { id: "UCLLibJTCy3sXjHLVaDimnpQ", name: "ARTEde" },
      { id: "UCA3mpqm67CpJ13YfA8qAnow", name: "Terra X History" },
      { id: "UCUuab1dctZzN5ZmRmQnTzkg", name: "WDR Doku" },
      { id: "UCTPAHk1b-h-WGQn9cfGlw2Q", name: "NDR Doku" },
      { id: "UC1w6pNGiiLdZgyNpXUnA4Zw", name: "DER SPIEGEL" },
      { id: "UCW39zufHfsuGgpLviKh297Q", name: "DW Documentary" },
    ],
    news: [
      { id: "UC5NOEUbkLheQcaaRldYW5GA", name: "tagesschau" },
      { id: "UCeqKIgPQfNInOswGRWt48kQ", name: "ZDFheute Nachrichten" },
      { id: "UCSeil5V81-mEGB1-VNR7YEA", name: "ntv Nachrichten" },
      { id: "UCMIgOXM2JEQ2Pv2d0_PVfcg", name: "DW Deutsch" },
      { id: "UC4zcMHyrT_xyWlgy5WGpFFQ", name: "BILD" },
    ],
    sport: [
      { id: "UCRFsyeKu07-LnHDG44O6uCA", name: "Sportschau" },
      { id: "UC6UL29enLNe4mqwTfAyeNuw", name: "Bundesliga" },
      { id: "UCE0RhriywrL8XhXbo87tMKQ", name: "sportstudio" },
      { id: "UCfMo0xj-sbdzHuzxvKdu1hw", name: "DFB" },
      { id: "UCPj_Vtw0hKnhJapQuATBUrA", name: "SPORT1" },
    ],
    humor: [
      { id: "UCNNEMxGKV1LsKZRt4vaIbvw", name: "ZDF MAGAZIN ROYALE" },
      { id: "UCjhkuC_Pi85wGjnB0I1ydxw", name: "extra 3" },
      { id: "UCFqcNI0NaAA21NS9W3ExCRg", name: "ZDF heute-show" },
      { id: "UC61TJJ9hWs2CyDcRskoXlYQ", name: "Die Anstalt" },
    ],
    media: [
      { id: "UCOgPGtSnFR6GM-AkzCnxqMQ", name: "funk" },
      { id: "UCfa7jJFYnn3P5LdJXsFkrjw", name: "STRG_F" },
      { id: "UCLoWcRy-ZjA-Erh0p_VDLjQ", name: "Y-Kollektiv" },
      { id: "UCKGMHVipEvuZudhHD05FOYA", name: "Simplicissimus" },
      { id: "UCZHpIFMfoJJ_1QxNGLJTzyA", name: "MrWissen2go" },
    ],
    radio: [
      { id: "UCwDkddcOJXnEyqzhXixQajA", name: "1LIVE" },
      { id: "UCIiwAmYP0NMyUn28CMmntUQ", name: "N-JOY!" },
    ],
  },
  AT: {
    news: [
      { id: "UCcgq_S80nfVaY2bmDbKHi_g", name: "PULS 24" },
      { id: "UC4qhj5cnX0MkbwXQ5vlI1NQ", name: "Kronen Zeitung" },
      { id: "UCgau4awdKG2ni2Ib4jvUqFA", name: "DER STANDARD" },
      { id: "UCyQpfuhftLvrmjxgEzVH78Q", name: "OE24.TV" },
      { id: "UC-7qscJH_SncZvCm9Ty014Q", name: "ServusTV On" },
    ],
    sport: [
      { id: "UCh5qcupEYm28BAkGFSmr5QQ", name: "ORF Sport" },
      { id: "UC5dCegXiWjE57wKrhWnCo0g", name: "Sky Sport Austria" },
    ],
    radio: [
      { id: "UC4ql-l66k4OGn_gQbiThYOg", name: "Hitradio Ö3" },
      { id: "UC8sHUgh1Z5k_3fiA2VV8V6g", name: "radio FM4" },
    ],
  },
  CH: {
    docs: [
      { id: "UCdFkj0fA6VYJaty-v8_avvg", name: "SRF Dokus & Reportagen" },
      { id: "UCQyyY2Izw8hin7c8T5YY4sg", name: "RTS - Radio Télévision Suisse" },
    ],
    news: [
      { id: "UClTOqr6qe-BmwwXDrcmuEhg", name: "RTS Info" },
      { id: "UCVuR4hBxX3zWY_xUCZeIc3A", name: "Schweizer Radio und Fernsehen" },
      { id: "UCqdXpIZSamBceDmH8uOoTHA", name: "SRF News & Hintergründe" },
      { id: "UCQNjg0-yEA8LoyCcWI-j8mA", name: "Blick" },
    ],
    sport: [
      { id: "UCJnZouZlCJYjPe4wIHvfIJQ", name: "RTS Sport" },
      { id: "UC5vaBYHzkZvJkjGSNrz5tWQ", name: "SRF Sport" },
    ],
    radio: [
      { id: "UCMKTFLrYiRerhOR9-lZnb3Q", name: "RTS Couleur 3" },
    ],
  },
  ES: {
    docs: [
      { id: "UC7QZIf0dta-XPXsp9Hv4dTw", name: "RTVE Noticias" },
      { id: "UCh1OgMIWOlDBhFEYL3DHWjQ", name: "laSexta" },
    ],
    news: [
      { id: "UC_Oni82GyYcabEr3rd-eJkg", name: "Antena 3 Noticias" },
      { id: "UCnsvJeZO4RigQ898WdDNoBw", name: "EL PAÍS" },
      { id: "UCCJs5mITIqxqJGeFjt9N1Mg", name: "laSexta Noticias" },
      { id: "UCh_chnQ7OJPQ8mZ7vbXFpIQ", name: "Europa Press" },
      { id: "UCGXbLrVe8vnkiFv7q2vYv3w", name: "El Mundo" },
      { id: "UC3hQI9c_MZPSDWNLF05OQGQ", name: "Mediaset Infinity España" },
    ],
    sport: [
      { id: "UCTv-XvfzLX3i4IGWAm4sbmA", name: "LALIGA EA SPORTS" },
      { id: "UCop57Z1sYHrtCyxCpE2z2Bg", name: "MARCA" },
      { id: "UCXISYK3xagaK5DHnhQ4X0hw", name: "Diario AS" },
      { id: "UCWV3obpZVGgJ3j9FVhEjF2Q", name: "Real Madrid" },
      { id: "UC14UlmYlSNiQCBe9Eookf_A", name: "FC Barcelona" },
      { id: "UCK-mxP4hLap1t3dp4bPbSBg", name: "DAZN ES" },
    ],
    humor: [
      { id: "UCLNZvDlwQJMaQg477NAxvjQ", name: "El Hormiguero" },
      { id: "UCO5BR4Ex3EM8PSLU7OSqtOw", name: "La Revuelta" },
      { id: "UCgQmxYfWVp_x7gFSZOpRWVw", name: "Comedy Central España" },
      { id: "UCShuVWEZ2KhSb2kAYd7-StQ", name: "EL TERRAT" },
    ],
    media: [
      { id: "UCEw4oyJKvmYPoIpSa8cfr7A", name: "playz" },
      { id: "UClLLRs_mFTsNT5U-DqTYAGg", name: "LaVanguardia" },
      { id: "UCbdSYaPD-lr1kW27UJuk8Pw", name: "QuantumFracture" },
      { id: "UC52hytXteCKmuOzMViTK8_w", name: "CdeCiencia" },
    ],
    radio: [
      { id: "UCQ2Fej5pr1ipVeBWTX8Sc_Q", name: "Cadena SER" },
      { id: "UCDwjiSF4qEb3aeT3ZLkPc_Q", name: "LOS40" },
      { id: "UC-9V-k1ugOGSePgIw3UevTQ", name: "COPE" },
      { id: "UClaoPxKQvy9QQO-mEOdNjqA", name: "Europa FM" },
      { id: "UCPd-Lf5gQkAJD5XdTmT_GGA", name: "Onda Cero" },
    ],
  },
  MX: {
    news: [
      { id: "UCUsm-fannqOY02PNN67C0KA", name: "NMás" },
      { id: "UCFxHplbcoJK9m70c4VyTIxg", name: "MILENIO" },
      { id: "UC32TdiIsh_5X8tKr_9rKQyA", name: "N+ UNIVISION" },
      { id: "UC2SEk1w7DgoHs_G3w1biz-w", name: "El Universal" },
      { id: "UCUP6qv-_EIL0hwTsJaKYnvw", name: "Azteca Noticias" },
    ],
    sport: [
      { id: "UC4vmPjKs8tJM0HMd9JmgZ-g", name: "ESPN MX" },
      { id: "UCq8BPLXtFeiSFOvmJrknWGg", name: "LIGA BBVA MX" },
    ],
    humor: [
      { id: "UCECJDeK0MNapZbpaOzxrUPA", name: "Luisito Comunica" },
      { id: "UCs8qka8tfhdc69wzXYdtZ3A", name: "LosPolinesios" },
    ],
    media: [
      { id: "UCbsRRCNXXAeGRI-8BB-zJuQ", name: "Cultura Colectiva" },
      { id: "UCKuAmo9OGf8kw2jrPWCpHdA", name: "TelediarioMx" },
    ],
    radio: [
      { id: "UC2Rzh4jFfYnk2VkUSDwCpyA", name: "Los 40 México" },
    ],
  },
  AR: {
    news: [
      { id: "UCFgk2Q2mVO1BklRQhSv6p0w", name: "C5N" },
      { id: "UCba3hpU7EFBSk817y9qZkiA", name: "LA NACION" },
      { id: "UCvsU0EGXN7Su7MfNqcTGNHg", name: "Infobae" },
      { id: "UCjMGMWnToRcQRqmyVB4R2xQ", name: "CLARÍN" },
      { id: "UCR9120YBAqMfntqgRTKmkjQ", name: "A24com" },
    ],
    sport: [
      { id: "UC72ZaBKI-Bo5fjmWEYonhJw", name: "TyC Sports" },
    ],
    humor: [
      { id: "UC7mJ2EDXFomeDIRFu5FtEbA", name: "OLGA" },
      { id: "UCTHaNTsP7hsVgBxARZTuajw", name: "LUZU TV" },
      { id: "UCHc3el42hXKKhjs_1vzWk9A", name: "Telefe" },
    ],
    media: [
      { id: "UCl6L85YuyK4rVn5NI--dHUw", name: "Perfil" },
    ],
    radio: [
      { id: "UCYvINPByAdCcpA0sWrF3I_w", name: "Radio Mitre" },
    ],
  },
  CO: {
    news: [
      { id: "UC2Xq2PK-got3Rtz9ZJ32hLQ", name: "Noticias Caracol" },
      { id: "UCnr6pbeXJmkNQJ9PSYle7QQ", name: "Noticias RCN" },
      { id: "UCe5-b0fCK3eQCpwS6MT0aNw", name: "EL TIEMPO" },
      { id: "UCv5Oy_TJFvGKXjeNzzJE_PQ", name: "CityTv" },
    ],
    sport: [
      { id: "UCZjpA3YBPXvJv3pg4SPEjfw", name: "Win Sports" },
    ],
    radio: [
      { id: "UCNAJlRrXYFi8jo889TbxPiw", name: "Caracol Radio" },
      { id: "UCgmI4NN8Q-2Ul-lqEU1OlDA", name: "Radio Uno Colombia" },
    ],
  },
  CL: {
    news: [
      { id: "UCsRnhjcUCR78Q3Ud6OXCTNg", name: "Teletrece" },
      { id: "UCRsUoZYC1ULUspipMRnMhwg", name: "CHV Noticias" },
      { id: "UCkccyEbqhhM3uKOI6Shm-4Q", name: "Meganoticias" },
      { id: "UCuvM3c8rmdApmk-g22shZ7w", name: "Bio Bio" },
    ],
    sport: [
      { id: "UChCovZlgNh2x6Z57MJ5fhFw", name: "TNT Sports Chile" },
      { id: "UC9Hp4yOxl0ngREG_UGVmr4w", name: "ANFP" },
    ],
    humor: [
      { id: "UCTqDzPyS7dDBxjywNROdAUg", name: "FESTIVALDEVINACHILE" },
    ],
    radio: [
      { id: "UC13uZwIWmnmBJQuiTJWbVhQ", name: "CooperativaFM" },
      { id: "UCczkrFICr0xEgDsk51zZojA", name: "ADN Chile" },
    ],
  },
  IT: {
    docs: [
      { id: "UCx7EWheHmjCW3vX8K2d09vg", name: "Geopop" },
    ],
    news: [
      { id: "UCxqR9g_1XlnfrqwHK9viwCw", name: "RaiNews" },
      { id: "UCz6E3lF72mb6uoJ-mOlNo2A", name: "Sky tg24" },
      { id: "UCxrPzaf2B_l6NvnmIRp5EKg", name: "La7" },
      { id: "UCWJhBqnyVdHAuxexgjghNFw", name: "Fanpage.it" },
      { id: "UC9ePmjVRHLL8x8vq5fOKflg", name: "La Repubblica" },
    ],
    sport: [
      { id: "UCAvNr5DMVncoJnJAotXOjOQ", name: "Sky Sport" },
      { id: "UCBJeMCIeLQos7wacox4hmLQ", name: "Serie A" },
      { id: "UC7N8IuYFhU8Hs1ruCTsXTbg", name: "DAZN Italia" },
      { id: "UCLzKhsxrExAC6yAdtZ-BOWw", name: "Juventus" },
    ],
    humor: [
      { id: "UCaUp13HIYcggceVT3qBuBLg", name: "The jackal tv" },
      { id: "UCpB9uxBH-Hjoj_Jd9cnRC_w", name: "The Jackal" },
      { id: "UCRAliCc1FUVqufAMICMw9fw", name: "Zelig" },
    ],
    media: [
      { id: "UCZM5aON36Iw0o0ngTaQSWVA", name: "Will Media" },
      { id: "UC4V3oCikXeSqYQr0hBMARwg", name: "Breaking Italy" },
      { id: "UCGe1EHmk2SHt9fnpIRchvqg", name: "Il Post" },
    ],
    radio: [
      { id: "UCuNnpwvG5E-hGKM2F-U5YRg", name: "radiodeejay" },
      { id: "UCdRQAy9c5cJ4oQG_US3qq-g", name: "RTL 102.5" },
      { id: "UCcm6KpwkAsyZ5U4LtCGjBcA", name: "Radio 105" },
      { id: "UCqxWYf1b5068EQvP22Rvr5Q", name: "Radio Italia - Solo musica Italiana" },
      { id: "UCuiPzxEpLJLTRu2HXzY3gfA", name: "Radio 24" },
    ],
  },
  PT: {
    news: [
      { id: "UCIM-wfyv9hg2oEiA81mQc2A", name: "RTP Notícias" },
      { id: "UC5lg8zKcnJ1rnxR6lPgD1ug", name: "TVI" },
      { id: "UC35F6ktZodINwjQZjuwLcjg", name: "Observador" },
    ],
    sport: [
      { id: "UClLezIYClTchcd4_jGFQ0Cg", name: "A BOLA" },
      { id: "UC8zrah5cNf2c3jKKeD_Z3fw", name: "Sport Lisboa e Benfica" },
      { id: "UCQegzQwEExHgXvm_yHptzQg", name: "FC Porto" },
      { id: "UCnJj6L93JX3Jrhzv81ayywA", name: "Sporting Clube de Portugal" },
    ],
    media: [
      { id: "UCWPpeeDOykyH5ducPITCDPw", name: "RTP" },
    ],
    radio: [
      { id: "UCAFtSyiazoL-f6ufljgJzzA", name: "Rádio Comercial" },
      { id: "UCfERDgElV5be78xxJBSlkTA", name: "RTP Antena 3" },
    ],
  },
  BR: {
    docs: [
      { id: "UCDiJeuOsv766JDMAlpbSMHg", name: "Globoplay" },
      { id: "UCRP5p2RfxJgnKyWgve5pJ-Q", name: "Canal History Brasil" },
      { id: "UCteW9b13yFu8Kf8hnt12__A", name: "Canal Brasil" },
    ],
    news: [
      { id: "UCaGmdJSSiR7fkh2A-c6emsA", name: "g1" },
      { id: "UCvdwhh_fDyWccR42-rReZLw", name: "CNN Brasil" },
      { id: "UCoa-D_VfMkFrCYodrOC9-mA", name: "Band Jornalismo" },
      { id: "UCP391YRAjSOdM_bwievgaZA", name: "Jovem Pan News" },
      { id: "UCVFbXI6Gu8U2f9Gjtxw4A-Q", name: "UOL" },
      { id: "UCuiLR4p6wQ3xLEm15pEn1Xw", name: "Record News" },
      { id: "UC376n347Ob5Lwzq2WGzF1AA", name: "SBT News" },
    ],
    sport: [
      { id: "UCgCKagVhzGnZcuP9bSMgMCg", name: "ge tv" },
      { id: "UCZiYbVptd3PVPf4f6eR6UaQ", name: "CazéTV" },
      { id: "UCOa-WaNwQaoyFHLCDk7qKIw", name: "Flamengo TV" },
      { id: "UCqRraVICLr0asn90cAvkIZQ", name: "Corinthians TV" },
      { id: "UCs-6sCz2LJm1PrWQN4ErsPw", name: "TNT Sports Brasil" },
    ],
    humor: [
      { id: "UCEWHPFNilsT0IfQfutVzsag", name: "Porta dos Fundos" },
      { id: "UC3KQ5GWANYF8lChqjZpXsQw", name: "whinderssonnunes" },
      { id: "UCV306eHqgo0LvBf3Mh36AHg", name: "Felipe Neto" },
    ],
    media: [
      { id: "UCKHhA5hN2UohhFDfNXB_cvQ", name: "Manual do Mundo" },
      { id: "UCn9Erjy00mpnWeLnRqhsA1g", name: "Ciência Todo Dia" },
      { id: "UCthbIFAxbXTTQEC7EcQvP1Q", name: "BBC News Brasil" },
    ],
    radio: [
      { id: "UC7_duacVg8zWMPno3mqKI3A", name: "Jovem Pan FM" },
      { id: "UC11JFCoslUUMTuAsUPH8RdQ", name: "Multishow" },
    ],
  },
  NL: {
    news: [
      { id: "UC5xziMuoFAOpX9mwUVhe2Jw", name: "NOS" },
      { id: "UCv4NUJ5BGSpJz_leIfayDzQ", name: "RTL Nieuws" },
      { id: "UCCw1aOc9x3sEjrUzT-qmMGw", name: "NU.nl" },
      { id: "UCf63l7Wp_wX7T-5ChM_Km9Q", name: "NOS+" },
      { id: "UC1Et9K-hHf-P_LzQkE_Q3Jw", name: "De Telegraaf" },
    ],
    sport: [
      { id: "UCXnPiEv1DoUCDAqDUXT9shQ", name: "ESPN NL" },
      { id: "UCGpf7WX7R1one-NwOvg_PbQ", name: "AFC Ajax" },
    ],
    humor: [
      { id: "UCn7xknPbWDjGQCzBLhtubiA", name: "LUBACH" },
    ],
    radio: [
      { id: "UCP4FJ4p9zcRq8XyyOeqO1Nw", name: "3FM" },
      { id: "UCUTojEaP3mXFaNUdeBI1cYQ", name: "Qmusic - Nederland" },
      { id: "UCVOaYjNLMhIqW0faahP7uZw", name: "SLAM! - Music" },
    ],
  },
  BE: {
    news: [
      { id: "UCNG9VVd57cl3Rcq8cSgpZlQ", name: "RTBF" },
      { id: "UC4f0qvPJLqGTuLyy2iHOd-g", name: "RTBF Info" },
      { id: "UC59gT3bFTFNSqafRcluDIsQ", name: "VRT NWS" },
      { id: "UCRZJB6penggh9e_vUkI2-LQ", name: "Lesoir" },
    ],
    sport: [
      { id: "UCLrFHKfx_Fs8vBJBRBeGIKg", name: "RTBFSport" },
      { id: "UCDTPBrTd_E9t0beseSGP_Pw", name: "Sporza" },
      { id: "UCZYeLruZnUvYvO6QRTiy88Q", name: "Pro League" },
    ],
    radio: [
      { id: "UCEAgugIw6pHGg7MRlkOU1Dw", name: "Studio Brussel" },
      { id: "UCCDccz7bJ9XdwTBkEX1qKlg", name: "Qmusic - België" },
      { id: "UCY6mEUA-8ybHksKP7Xb1nhw", name: "MNMbe" },
    ],
  },
  LU: {
    news: [
      { id: "UCWWn73x0JSlI1xLA9DViW4w", name: "RTL Luxembourg" },
      { id: "UCNtRctmQkZpwYmhFqMpFLVw", name: "Wort" },
    ],
  },
  TR: {
    news: [
      { id: "UCBgTP2LOFVPmq15W-RH-WXA", name: "TRT Haber" },
      { id: "UCV6zcRug6Hqp1UX_FdyUeBg", name: "CNN TÜRK" },
      { id: "UCeMQiXmFNTtN3OHlNJxnnUw", name: "BBC News Türkçe" },
      { id: "UCOulx_rep5O4i9y6AyDqVvw", name: "SÖZCÜ Televizyonu" },
    ],
    sport: [
      { id: "UCPe9vNjHF1kEExT5kHwc7aw", name: "beIN SPORTS Türkiye" },
      { id: "UCQpeujIamj2ZOKXZnrxTRhA", name: "Galatasaray" },
      { id: "UCgqlho3-8a6FmDqQm7Q6gJw", name: "Fenerbahçe SK" },
      { id: "UCfYNqluOf8EbQkL44otydMw", name: "TRT SPOR" },
    ],
  },
  PL: {
    news: [
      { id: "UC3R8278fJUWn2ysrOCJrmAQ", name: "tvn24" },
      { id: "UCkNOjcTcgLaNL0-XNoe4gtw", name: "Polsat" },
      { id: "UCzQZbOb86WvhOPoR7jgAfsA", name: "TVP Info" },
      { id: "UCPiu4CZlknkTworskK79CPg", name: "wPolsce24" },
      { id: "UC_vMDcmkuEvw0N-gaP35wTA", name: "Onet" },
    ],
    sport: [
      { id: "UCEwSN6jGhHB2GCTnEGmjIPA", name: "Polsat Sport" },
      { id: "UCJG1t39gQNB5dD4rmLOi5lw", name: "Meczyki" },
      { id: "UCFlGSuyqfui9DwttuET8MzQ", name: "Łączy nas piłka" },
    ],
    humor: [
      { id: "UCUW_toiiUg8fn4OHqhA1gnQ", name: "Kabaret Moralnego Niepokoju" },
      { id: "UCEe12n7pL9Pl-i6qxBmpyeg", name: "Abelard Giza" },
    ],
    radio: [
      { id: "UCoiRZbfYK3ztTX4LWuaA3fQ", name: "RMF FM" },
      { id: "UCvHFbkohgX29NhaUtmkzLmg", name: "Radio ZET" },
    ],
  },
  SA: {
    docs: [
      { id: "UC0LSnqrwqtMwl2YwfUpO66g", name: "Al Jazeera Documentary الجزيرة الوثائقية" },
      { id: "UCLiTe0aOHShx7hXGyqZ9UIw", name: "Nat Geo Abu Dhabi" },
    ],
    news: [
      { id: "UCahpxixMCwoANAftn6IxkTg", name: "AlArabiya العربية" },
      { id: "UCIJXOvggjKtCagMfxvcCzAA", name: "سكاي نيوز عربية" },
      { id: "UCdTyuXgmJkG_O8_75eqej-w", name: "فرانس 24 / FRANCE 24 Arabic" },
      { id: "UC30ditU5JI16o5NbFsHde_Q", name: "DW عربية" },
      { id: "UCRJUVYt9gjg8MnlGacySUdg", name: "Asharq News - الشرق للأخبار" },
    ],
    sport: [
      { id: "UCJUCcJUeh0Cz2xyKwkw5Q1w", name: "beIN SPORTS" },
      { id: "UCqXAWrjSgLb0EPa_icPt-pw", name: "الدوري السعودي للمحترفين - Saudi Pro League" },
      { id: "UChM_8YeNCava2-OSbgbpe_w", name: "نادي الهلال السعودي - AlHilal Saudi Club" },
    ],
    humor: [
      { id: "UCGA_iwc3t5I1dVFff54wYGA", name: "TheSaudiReporters | سعودي ريبورترز" },
      { id: "UCu8IbV0yWIiK2QjYFVVD4AA", name: "تلفاز١١" },
    ],
    media: [
      { id: "UCnVGseMUtv2yFNC-dQ2JdSw", name: "AJ+ عربي" },
      { id: "UC4kRorAXuIkyIX6vwXKaLWg", name: "المخبر الاقتصادي - Mokhbir Eqtisadi" },
      { id: "UCqW7G8SmyeEeQYzLOk5tdSg", name: "Da7ee7 - الدحيح" },
    ],
    radio: [
      { id: "UCNhqvQMXIgRfjAGmxQqdNRw", name: "Rotana" },
      { id: "UCy2CIDKYZqqbeJ0NHNcJ9sQ", name: "MBC GROUP" },
    ],
  },
  AE: {
    news: [
      { id: "UCIJXOvggjKtCagMfxvcCzAA", name: "سكاي نيوز عربية" },
      { id: "UCahpxixMCwoANAftn6IxkTg", name: "AlArabiya العربية" },
      { id: "UCdtycQv7-W8TQJ_EE5YnvWg", name: "AAN MEDIA NETWORK" },
      { id: "UCuyiRRgNobUdBqKBJ-ItyTw", name: "Dubai Media -  دبي للإعلام" },
      { id: "UC6V13T-dU0k5ixFo6lgOpHg", name: "The National" },
      { id: "UCXTuTQZarVcFR_fgQXvsLpw", name: "Gulf News" },
    ],
    sport: [
      { id: "UCF8Fpc7bPHC8Jrflci-mUiQ", name: "AD Sports" },
      { id: "UCmJr9VRnC8Q1TCIrf2G8bcg", name: "Dubai Sports I دبي الرياضية" },
    ],
    media: [
      { id: "UCPvObfhnwu_QNi6mc4z5UPQ", name: "MBC1" },
    ],
    radio: [
      { id: "UCmIFS5Sg7xSJwRi8kv45Jkg", name: "Virgin Radio Dubai" },
    ],
  },
  EG: {
    news: [
      { id: "UCB6sc84dcg6VQGB_d89sx2g", name: "CBC Egypt" },
      { id: "UCJWuV-EkLmRrGZ4afwUBenw", name: "Sada Elbalad - صدى البلد" },
      { id: "UCGyS7uRX_tmdfAgf-4tsUlg", name: "eXtra news" },
      { id: "UCktyejXTxWaKfrgp1Oq7CMQ", name: "AlQahera News -  القاهرة الإخبارية" },
      { id: "UCWuj6cpZL_T1U508Y082u3g", name: "Alhayah TV Network" },
    ],
    sport: [
      { id: "UCmeqakSoEdmxEtTnCFSbunw", name: "Al AHLY TV" },
      { id: "UCeFU0ebL1MK2KlBFniRs6Iw", name: "Zamalek TV - قناة الزمالك" },
    ],
    humor: [
      { id: "UCoZnEQMqVvv_DkF50fupMKw", name: "Bassem Youssef" },
    ],
    media: [
      { id: "UCrj5BGAhtWxDfqbza9T9hqA", name: "AlHadath الحدث" },
    ],
    radio: [
      { id: "UCkOITFiEWFc0xI5DdNbRWjQ", name: "NileFM" },
      { id: "UCDMH4NSh_y-AMKivPCvPIhg", name: "NogoumFM - نجوم إف إم" },
    ],
  },
  MA: {
    news: [
      { id: "UClozwh5URilIQpDFeXch8qw", name: "2MTV" },
      { id: "UCvyivffb2WwNKonKiLwVAEQ", name: "Hespress" },
      { id: "UCI3ESb2GoE1w5MIKosbmutQ", name: "Chouftv - شوف تيفي" },
      { id: "UCfXlL8avQjg74WbRyksr9bQ", name: "MEDI1 TV" },
      { id: "UCvtQeUIfmelyvCDMbEPw9vw", name: "SNRTnews" },
    ],
    sport: [
      { id: "UCRN5ho3UGhUi7ZCBe2G2f2w", name: "Arryadia TV" },
      { id: "UCbQlejA3nCVMq-9qw-oZEtQ", name: "Fédération Royale Marocaine de Football" },
      { id: "UCFfmKY2mqofI8d6XcxkFATA", name: "Raja Club Athletic" },
      { id: "UCf65dQ8syRzRPpALKZQUcOQ", name: "Wydad Athletic Club" },
    ],
    radio: [
      { id: "UCoS0xYkuJq07NU92yFBEfKA", name: "HIT RADIO" },
    ],
  },
  DZ: {
    news: [
      { id: "UCISILw7UC9gYmVtlyQOS9aw", name: "Ennahar Tv Plus" },
      { id: "UCd9ox6D3VbhNp3kJNTxQzCQ", name: "EchoroukTV" },
      { id: "UCfF6CkUvCBleM19CkgNyrYw", name: "ELBILAD TV" },
      { id: "UC2TJu-b6OCHIxW-TvoF5NSQ", name: "AL24news - قناة الجزائر الدولية" },
      { id: "UCoAqxtPwSGstLWHo4ANgujQ", name: "المؤسسة العمومية للتلفزيون الجزائري" },
    ],
    humor: [
      { id: "UChFui4035fKbJbRxu1RBqCQ", name: "Dzjoker Chemsou" },
      { id: "UCHCsGx9byqxSw6f1JQVBk6Q", name: "Anes Tina" },
    ],
  },
  TN: {
    news: [
      { id: "UC6y8T-vG9SeQ-FKOCt_o8MA", name: "Mosaique FM" },
      { id: "UC-48PCT3flS86JkLzxlTA9g", name: "Nessma TV" },
      { id: "UCXzmMkXaHxMVlutDBD8goHA", name: "Elhiwar Ettounsi" },
      { id: "UCQS3ejF2jBAhwmbGD9Q3oeA", name: "Attessia TV" },
      { id: "UCdvWVsmQBROkgcGzVep73oA", name: "Watania Replay" },
      { id: "UCOvTt3b378hpuUXgb46UdMQ", name: "Diwan FM Live" },
    ],
    sport: [
      { id: "UCArUYyYBngpwiklYtqZPPfg", name: "Espérance Sportive de Tunis" },
    ],
  },
  QA: {
    news: [
      { id: "UCNye-wNBqNL5ZzHSJj3l8Bg", name: "Al Jazeera English" },
      { id: "UC65i3Fyq91uiUkIS0i5GLNQ", name: "العربي - أخبار" },
    ],
    sport: [
      { id: "UCJUCcJUeh0Cz2xyKwkw5Q1w", name: "beIN SPORTS" },
      { id: "UC55yDKHTJcYllsWMSlYMWrg", name: "QSL" },
    ],
  },
  IN: {
    docs: [
      { id: "UC-CSyyi47VX1lD9zyeABW3w", name: "Dhruv Rathee" },
      { id: "UCBLF5teKEUzTN5gZ2zgR0kQ", name: "DiscoveryChannelInd" },
      { id: "UCD6YjjeAJQiT9ytdM2R8BeQ", name: "National Geographic India" },
    ],
    news: [
      { id: "UCt4t-jeY85JegMlZ-E5UWtA", name: "Aaj Tak" },
      { id: "UCZFMm1mMw0F81Z37aaEzTUA", name: "NDTV" },
      { id: "UCYPvAwZP8pZhSMW8qs7cVCw", name: "India Today" },
      { id: "UCRWFSbif-RFENbBrSiez1DA", name: "ABP NEWS" },
      { id: "UCIvaYmXn910QMdemBG3v1pQ", name: "Zee News" },
      { id: "UCN7B-QD0Qgn2boVH5Q0pOWg", name: "BBC News Hindi" },
      { id: "UCx8Z14PpntdaxCt2hakbQLQ", name: "The Lallantop" },
      { id: "UCwqusr8YDwM-3mEYTDeJHzw", name: "Republic World" },
      { id: "UCttspZesZIDEwwpVIgoZtWQ", name: "IndiaTV" },
    ],
    sport: [
      { id: "UCt2JXOLNxqry7B_4rRZME3Q", name: "ICC" },
    ],
    humor: [
      { id: "UCNJcSUSzUeFm8W9P7UUlSeQ", name: "The Viral Fever" },
      { id: "UCqwUrj10mAEsqezcItqvwEw", name: "BB Ki Vines" },
      { id: "UCj22tfcQrWG7EMEKS0qLeEg", name: "CarryMinati" },
      { id: "UC7eHZXheF8nVOfwB2PEslMw", name: "ashish chanchlani vines" },
      { id: "UC1-BQ2oxqBVtCjMHF-Wf98w", name: "Kapil Sharma" },
      { id: "UC6WCgnZ7NBQOHC6wclkCaCg", name: "The Kapil Sharma Show" },
      { id: "UC7IMq6lLHbptAnSucW1pClA", name: "FilterCopy" },
      { id: "UCC89oVFqenaffhBoyqxd6qw", name: "Dice Media" },
    ],
    media: [
      { id: "UCx2HcmpB-UZGkMXOCJ4QIVA", name: "ScoopWhoop" },
      { id: "UCOQNJjhXwvAScuELTT_i7cQ", name: "Sony LIV" },
      { id: "UCZSNzBgFub_WWil6TOTYwAg", name: "Netflix India" },
    ],
    radio: [
      { id: "UCq-Fj5jknLsUf-MWSy4_brA", name: "T-Series" },
      { id: "UC56gTxNs4f9xZ7Pa2i5xNzg", name: "Sony Music India" },
      { id: "UCFFbwnve3yF62-tVXkTyHqg", name: "Zee Music Company" },
      { id: "UCJrDMFOdv1I2k8n9oK_V21w", name: "Tips Official" },
      { id: "UC_A7K2dXFsTMAciGmnNxy-Q", name: "Saregama Music" },
      { id: "UCXuO_AmrcE16fDoNiq9JZZg", name: "Coke Studio India" },
    ],
  },
  PK: {
    news: [
      { id: "UC_vt34wimdCzdkrzVejwX9g", name: "Geo News" },
      { id: "UCMmpLL2ucRHAXbNHiCPyIyg", name: "ARY News" },
      { id: "UCaxR-D8FjZ-2otbU0_Y2grg", name: "DawnNews" },
      { id: "UCvm8V4Dwtz0fbPGbpk7RYAg", name: "BBC News اردو" },
      { id: "UCJekW1Vj5fCVEGdye_mBN6Q", name: "SAMAA TV" },
      { id: "UCTur7oM6mLL0rM2k0znuZpQ", name: "Express News" },
      { id: "UCsgC5cbz3DE2Shh34gNKiog", name: "92 News HD" },
      { id: "UCAvhohWtYwPdpKVGiMkkKOQ", name: "Independent Urdu" },
    ],
    sport: [
      { id: "UCRkZIkHEQHpRvCoegO_jqfA", name: "ARY Plus" },
      { id: "UCF73oBsmZPG6YRZV-vVN1-A", name: "GEO SUPER" },
    ],
    humor: [
      { id: "UC6HQ4d3xq9EgSeJgMhc-4AQ", name: "Hasna Mana Hai" },
      { id: "UCRyTiea063y4QA-YOedu6lQ", name: "Masti TV" },
      { id: "UCXoPXbISoa64CLH5NLIeYlg", name: "Syed Basit Ali" },
    ],
    media: [
      { id: "UCe9JSDmyqNgA_l2BzGHq1Ug", name: "HAR PAL GEO" },
      { id: "UC4JCksJF76g_MdzPVBJoC3Q", name: "ARY Digital HD" },
      { id: "UCEeEQxm6qc_qaTE7qTV5aLQ", name: "HUM TV" },
      { id: "UCF2ltLX1dnPa6-L1paPaMzw", name: "Green TV Entertainment" },
      { id: "UCU1r97baEf3JJI5fY6NtMpA", name: "Express TV" },
    ],
    radio: [
      { id: "UCM1VesJtJ9vTXcMLLr_FfdQ", name: "Coke Studio Pakistan" },
    ],
  },
  BD: {
    news: [
      { id: "UCxHoBXkY88Tb8z1Ssj6CWsQ", name: "SOMOY TV" },
      { id: "UCDj9HHrRUzlsTuPQN0PHxjw", name: "Jamuna TV Plus" },
      { id: "UCAz6rveBalVnE6qTmfQnvyQ", name: "Channel i Tv" },
      { id: "UChPD2BQ2dJ-w00klQQkc-Qg", name: "BBC News বাংলা" },
      { id: "UCeG7m5-AJ4I0H4EIleIty4Q", name: "Prothom Alo" },
      { id: "UCATUkaOHwO9EP_W87zCiPbA", name: "Independent Television" },
      { id: "UCUvXoiDEKI8VZJrr58g4VAw", name: "DBC NEWS" },
      { id: "UCtqvtAVmad5zywaziN6CbfA", name: "Ekattor TV" },
      { id: "UCPREnbhKQP-hsVfsfKP-mCw", name: "NEWS24" },
    ],
    sport: [
      { id: "UC0gsMYK1dqQ5KqOQfavVNkg", name: "Bangladesh Cricket : The Tigers" },
      { id: "UCjddF3EFoYVAooFNN-2kKPw", name: "T Sports Football" },
      { id: "UCNU0Vv6U1xZS82cIQrgDeqw", name: "Rabbitholebd Sports" },
    ],
    humor: [
      { id: "UCivHZmJcD6mvSrpkI9k9htg", name: "SalmoN TheBrownFish" },
    ],
    media: [
      { id: "UCA4y9g_GRdNrZLH_u5LLSdw", name: "BanglaVision NEWS" },
    ],
    radio: [
      { id: "UCIB65_E_7XEScU2NB135wDw", name: "Coke Studio Bangla" },
      { id: "UCEm3_CDVtH0uMtT5lrM5nTQ", name: "G Series Bangla Natok" },
      { id: "UCIjLRyywnG8olYXAEVYGYgQ", name: "CMV" },
    ],
  },
  ID: {
    docs: [
      { id: "UChY9AGfB7AzAS0Ji8pF93OA", name: "NATIONAL GEOGRAPHIC INDONESIA" },
      { id: "UC5BMIWZe9isJXLZZWPWvBlg", name: "KOMPASTV" },
    ],
    news: [
      { id: "UCKII0Ml9S5wneKbHswmUrIQ", name: "CNN Indonesia" },
      { id: "UCER4rvDnRBPr_ncYW4UCZjg", name: "tvOneNews" },
      { id: "UCzl0OrB3-ehunyotIQvK77A", name: "METRO TV" },
      { id: "UC46q-QSvoJz-1iSxPeuOqWA", name: "BBC News Indonesia" },
      { id: "UCm2Fz7aL464TC_0uG_yagng", name: "kumparan" },
      { id: "UCnOf30K0d0e8M7mc4FUzR0A", name: "Narasi Newsroom" },
      { id: "UCuMAjEaSMj7q7YLf0xW1MjQ", name: "detikcom" },
      { id: "UCmxAIW7RDDC88EPk4ry16Kg", name: "Tribunnews" },
    ],
    sport: [
      { id: "UCbOdQk9540V09ff51nFEDKw", name: "PSSI TV" },
      { id: "UCyJejTAHiCrIRqWmFrbgQfQ", name: "Liga1Match" },
      { id: "UCoRuKUdWlO77YDg8XoTArjQ", name: "Vidio Sports" },
      { id: "UCViN2fPWI6zuZDXwn0O54xg", name: "beIN SPORTS Indonesia" },
    ],
    humor: [
      { id: "UC15VpzK4og3NLmCVZQOroFw", name: "MLI" },
      { id: "UC2glGt4lW9hd7bZ0AzJw7vQ", name: "STANDUPINDO" },
      { id: "UC8zZ084em5pohjs6kk2Bpaw", name: "Stand Up Kompas TV" },
      { id: "UC0rzsIrAxF4kCsALP6J2EsA", name: "Raditya Dika" },
      { id: "UCxVsd8kibThrLeCvzFxAMHw", name: "Dustin Tiffani" },
    ],
    media: [
      { id: "UCzI8ArgVBHXN3lSz-dI0yRw", name: "Narasi" },
      { id: "UCIohHXwCEKxWCLvAguJ-GjA", name: "TRANS TV Official" },
      { id: "UCE9-bV_MCGgLnH7v4HSApDg", name: "Official RCTI" },
      { id: "UC_vsErcsq56hOscPHkG-aVw", name: "Surya Citra Televisi (SCTV)" },
      { id: "UC24_Z2L-8Ki183AI9zJJzNQ", name: "TRANS7 OFFICIAL" },
    ],
    radio: [
      { id: "UCvA9_f5Lwk-poMynabtrZPg", name: "Rans Entertainment" },
      { id: "UCaKLg1ELiX0zTJ6Je3c5esA", name: "AH" },
      { id: "UCNlU3oSU8UnJ_V9uMB-cPOg", name: "Musica Studios" },
      { id: "UCRJnDr4k5AS8mb2EOL1V3bw", name: "Aquarius by Aquarius" },
    ],
  },
  MY: {
    news: [
      { id: "UC5dYmq91e5_g54krpO06NJw", name: "Astro AWANI" },
      { id: "UCoV8oT-GyqYSJkxzuAKG3Jw", name: "Berita Harian Online" },
      { id: "UCpWvshQVx1d7BqCsPnVuNIw", name: "The Star" },
      { id: "UC9ULnkwvyofZ_sWrzRpyvrg", name: "KiniTV" },
      { id: "UC2p8wkJVSjsMsRv0MjTikgA", name: "Buletin TV3" },
    ],
    sport: [
      { id: "UCU9GQSAhb4JxdSZKNJ_Ib6w", name: "Astro Arena" },
    ],
  },
  CN: {
    docs: [
      { id: "UCAYkj2Fz9EvAe2fGJEGMXnQ", name: "CCTV纪录" },
      { id: "UCq2Cg1w0sfmo_HcxbUMsXqA", name: "CGTN Documentary" },
    ],
    news: [
      { id: "UCgrNz-aDmcr2uuto8_DL2jg", name: "CGTN" },
      { id: "UCmv5DbNpxH8X2eQxJBqEjKQ", name: "CCTV Video News Agency" },
      { id: "UCb3TZ4SD_Ys3j4z0-8o6auA", name: "BBC News 中文" },
      { id: "UC99XkAM3Y82ONvdpwUYmOZg", name: "DW 中文 - 德國之聲" },
      { id: "UCahujLjSL34EPNxtwKRi_vg", name: "China Daily 中国日报" },
      { id: "UCcLK3j-XWdGBnt5bR9NJHaQ", name: "CCTV中国中央电视台" },
      { id: "UCt5zpwa264A0B-gaYtv1IpA", name: "美国之音中文网" },
    ],
    humor: [
      { id: "UCMUnInmOkrWN4gof9KlhNmQ", name: "老高與小茉 Mr & Mrs Gao" },
    ],
    media: [
      { id: "UCQFyMGc6h30NMCd6HCk0ZPA", name: "Made By Bilibili - Chinese Donghua Animation" },
    ],
  },
  TW: {
    news: [
      { id: "UC5nwNW4KdC0SzrhF9BXEYOQ", name: "TVBS NEWS" },
      { id: "UCIU8ha-NHmLjtUwU7dFiXUA", name: "SETN News Network" },
      { id: "UC2VmWn8dAqkzlQqvy02E1PA", name: "民視新聞網 Formosa TV News network" },
      { id: "UCpu3bemTQwAU8PqM4kJdoEQ", name: "中天新聞" },
      { id: "UCexpzYDEnfmAvPSfG4xbcjA", name: "公視新聞網" },
      { id: "UCOhrz3uRCOHmK6ueUstw7_Q", name: "EBC" },
    ],
    sport: [
      { id: "UCDt9GAqyRzc2e5BNxPrwZrw", name: "CPBL 中華職棒" },
    ],
    humor: [
      { id: "UCxUzQ3wu0oJP_8YLWt71WgQ", name: "HowFun" },
    ],
    media: [
      { id: "UCMUnInmOkrWN4gof9KlhNmQ", name: "老高與小茉 Mr & Mrs Gao" },
    ],
    radio: [
      { id: "UC8CU5nVhCQIdAGrFFp4loOQ", name: "周杰倫 Jay Chou" },
    ],
  },
  HK: {
    news: [
      { id: "UC_ifDTtFAcsj-wJ5JfM27CQ", name: "TVB NEWS Official 無綫新聞" },
      { id: "UC6of7UYhctnYmqABjUqzuxw", name: "RTHK 香港電台" },
      { id: "UCTxyBu9VWUq5LXezXwy_SGg", name: "香港01" },
    ],
    sport: [
      { id: "UCiFY7cDoGAdc757dQNuqX-g", name: "HKFA Official" },
      { id: "UCf1RN5E-JrLCzEzmXafYiQg", name: "HKJC" },
    ],
    humor: [
      { id: "UC5dp6FxyIJmXLQv-9RYOTfA", name: "TVB 娛樂新聞台" },
      { id: "UCiJnCs2K5gP-DXnMxlstC9A", name: "毛記電視" },
    ],
  },
  RU: {
    docs: [
      { id: "UC1eFXmJNkjITxPFWTy6RsWg", name: "Редакция" },
      { id: "UCMCgOm8GZkHp8zJ6l7_hIuA", name: "вДудь" },
      { id: "UCSPd93is2UQsd_jZ6yHBfqQ", name: "ПостНаука" },
      { id: "UCVgvnGSFU41kIhEc09aztEg", name: "Arzamas" },
    ],
    news: [
      { id: "UCdubelOloxR3wzwJG9x8YqQ", name: "Телеканал Дождь" },
      { id: "UC8zQiuT0m1TELequJ5sp5zw", name: "BBC News - Русская служба" },
      { id: "UCXoAjrdHFa2hEL3Ug8REC1w", name: "DW на русском" },
      { id: "UCFzJjgVicCtFxJ5B0P_ei8A", name: "Euronews по-русски" },
      { id: "UCBG57608Hukev3d0d-gvLhQ", name: "Current Time" },
      { id: "UC-30BJyAAObw1irWxu6IPkw", name: "Meduza" },
      { id: "UCb7cviReEe74-qfk_MREglw", name: "MBK" },
    ],
    humor: [
      { id: "UCsIEFXNO4bxh0hW3-_z2-0g", name: "Comedy Club" },
      { id: "UC_1O5w8-Gv812YiZwxd1qSw", name: "Иван Абрамов" },
      { id: "UCNqktdxgAADBj36dC7VGOgg", name: "LABELCOM" },
    ],
    media: [
      { id: "UC101o-vQ2iOj9vr00JUlyKw", name: "varlamov" },
      { id: "UCt7sv-NKh44rHAEb-qCCxvA", name: "Wylsacom" },
    ],
    radio: [
      { id: "UClmFKhaIZT4pwPlOg-ZK9OA", name: "Европа Плюс" },
      { id: "UCRKIdBctvF1TY9z62m-jazg", name: "Radio Record" },
      { id: "UC5oMqPJv6OT9Zs33cOmW0yA", name: "Русское Радио" },
    ],
  },
  JP: {
    docs: [
      { id: "UCSPEjw8F2nQDtmUKPFNF7_A", name: "NHK WORLD-JAPAN" },
      { id: "UC1N2_2vCoyd3EvGcVuwTfmw", name: "ナショナル ジオグラフィック TV" },
    ],
    news: [
      { id: "UCGCZAYq5Xxojl_tSXcVJhiQ", name: "ANNnewsCH" },
      { id: "UC6AG81pAkf6Lbi_1VC5NmPA", name: "TBS NEWS DIG Powered by JNN" },
      { id: "UCip8ve30-AoX2y2OtAAmqFA", name: "NHK" },
      { id: "UCoQBJMzcwmXrRSHBFAlTsIw", name: "FNNプライムオンライン" },
      { id: "UC4LWNegp6rg21PMebmbmrOw", name: "NTV News" },
      { id: "UCHL12woHGeiqAqLrK-pJe7g", name: "日本経済新聞" },
    ],
    sport: [
      { id: "UCoFLB_Gw_AoxUuuzKjXrc_Q", name: "DAZN Japan" },
      { id: "UC0v-pxTo1XamIDE-f__Ad0Q", name: "Pacific League TV Official" },
      { id: "UCmQp6ZaAejJKKkXc_Y_lh1A", name: "J.LEAGUE International" },
      { id: "UCDZwDKMh1kgfh9jQs8fpH6Q", name: "NPB News" },
      { id: "UCuMEtx7F1xSEZgnC71TItXA", name: "J SPORTS サイクルロードレース【公式】" },
    ],
    humor: [
      { id: "UCutJqz56653xV2wwSvut_hQ", name: "東海オンエア" },
      { id: "UCZf__ehlCEBPop-_sldpBUQ", name: "HikakinTV" },
      { id: "UCibEhpu5HP45-w7Bq1ZIulw", name: "Fischer's-フィッシャーズ-" },
      { id: "UCgMPP6RRjktV7krOfyUewqw", name: "はじめしゃちょー（hajime）" },
    ],
    media: [
      { id: "UC9zY_E8mcAo_Oq772LEZq8Q", name: "THE FIRST TAKE" },
      { id: "UC8yHePe_RgUBE-waRWy6olw", name: "PIVOT 公式チャンネル" },
    ],
    radio: [
      { id: "UC1oPBUWifc0QOOY8DEKhLuQ", name: "avex" },
      { id: "UCCy_q-N7F2FOIZ6ZggHIAKg", name: "Sony Music (Japan)" },
      { id: "UCtK2jtkcUh59o3RdfinlZ4Q", name: "TBSラジオ公式" },
    ],
  },
  KR: {
    news: [
      { id: "UChlgI3UHCOnwUGzWzbJ3H5w", name: "YTN" },
      { id: "UCuuTCooIMbBFHNbPcSS70uw", name: "SBS News" },
      { id: "UCcQTRi69dsVYHN3exePtZ1A", name: "KBS News" },
      { id: "UCsU-I-vHLiaMfV_ceaYz5rQ", name: "JTBC News" },
      { id: "UC-PHIZjV-oX8H7zD1cCN2NQ", name: "Arirang TV" },
    ],
    sport: [
      { id: "UCoVz66yWHzVsXAFG8WhJK9g", name: "KBO" },
      { id: "UCak5ZEX4BjijJcf7fdppuIQ", name: "K LEAGUE" },
      { id: "UCtm_QoN2SIxwCE-59shX7Qg", name: "SPOTV" },
    ],
    humor: [
      { id: "UCaKod3X1Tn4c7Ci0iUKcvzQ", name: "런닝맨 - 스브스 공식 채널" },
      { id: "UCiBr0bK06imaMbLc8sAEz0A", name: "MBCentertainment" },
      { id: "UCeLPm9yH_a_QH8n6445G-Ow", name: "KBS Kpop" },
    ],
    radio: [
      { id: "UC3IZKseVpdzPSBaWxBxundA", name: "HYBE LABELS" },
      { id: "UCEf_Bc-KVd7onSeifS3py9g", name: "SMTOWN" },
      { id: "UCaO6TYtlC8U5ttz62hTrZgg", name: "JYP Entertainment" },
      { id: "UCbD8EppRX3ZwJSou-TVo90A", name: "Mnet K-POP" },
      { id: "UCweOkPb1wVVH0Q0Tlj4a5Pw", name: "1theK (원더케이)" },
    ],
  },
  SG: {
    news: [
      { id: "UC_Lnb8ZHqqgLbp-7hltuT9w", name: "CNA Insider" },
      { id: "UC83jt4dlz1Gjl58fzQrrKZg", name: "CNA" },
      { id: "UC4p_I9eiRewn2KoU-nawrDg", name: "The Straits Times" },
      { id: "UCNWh9GuY0APdpm6jwbX5JsA", name: "Mothership" },
    ],
    humor: [
      { id: "UCGwcH4qnJ2qM_ZJUSFcAMAA", name: "JianHao Tan" },
    ],
  },
  INT_EN: {
    docs: [
      { id: "UCW39zufHfsuGgpLviKh297Q", name: "DW Documentary" },
      { id: "UCsXVk37bltHxD1rDPwtNM8Q", name: "Kurzgesagt – In a Nutshell" },
      { id: "UCijcd0GR0fkxCAZwkiuWqtQ", name: "Free Documentary" },
      { id: "UCsooa4yRKGN_zEE8iknghZA", name: "TED-Ed" },
      { id: "UCAuUUnT6oDeKwE6v1NGQxug", name: "TED" },
    ],
    news: [
      { id: "UCknLrEdhRCp1aegoMqRaCZg", name: "DW News" },
      { id: "UCSrZ3UV4jOidv8ppoVuvW9Q", name: "euronews" },
      { id: "UCNye-wNBqNL5ZzHSJj3l8Bg", name: "Al Jazeera English" },
      { id: "UCQfwfsi5VrQ8yKZ-UWmAEFg", name: "FRANCE 24 English" },
      { id: "UC_gUM8rL-Lrg6O3adPW9K1g", name: "WION" },
      { id: "UCj7wKsOBhRD9Jy4yahkMRMw", name: "CGTN America" },
      { id: "UCSPEjw8F2nQDtmUKPFNF7_A", name: "NHK WORLD-JAPAN" },
      { id: "UC7fWeaHhqgM4Ry-RMpM2YYw", name: "TRT World" },
      { id: "UChqUTb7kYRX8-EiaN3XFrSQ", name: "Reuters" },
      { id: "UCIALMKvObZNtJ6AmdCLP7Lg", name: "Bloomberg Television" },
    ],
  },
};
