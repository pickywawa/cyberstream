import { expect, it } from 'vitest';
import { GridCatalog, artwork_failed, artwork_html, hero_html, home_blocks, home_categories, home_html, set_low_end, replay_blocks, replay_shelves, library_html, person_html, search_results_html } from '../src/rust/generated/cyberstream';

it('selects the right version and stable order for each catalogue sort and genre', () => {
  const index = new GridCatalog('{}', true, ['fr','en'], [], JSON.stringify([['c','Comédie']]));
  const row = (id:string, groupKey:string, langs:string[], year:number, extra={}) => ({id,groupKey,langs,year,title:id,categoryId:'c',...extra});
  try {
    index.append(JSON.stringify([row('a1','a',['es'],2020),row('b','b',['en'],2026),row('c','c',[],2010,{origLang:'fr'})]));
    index.append(JSON.stringify([row('a2','a',['fr'],2024,{genres:['Action']}),row('d','d',['fr'],2012),row('hidden','hidden',['fr'],2025,{universe:'adult'})]));
    index.finish();
    // a chosen sort runs across the user's languages (fr, en): the English 2026 title comes first
    expect(JSON.parse(index.select('year',0))[0]).toEqual(['b','a2','d','c']);
    expect(JSON.parse(index.select('added',0))[0].slice(0,2)).toEqual(['a2','d']);
    const [filtered,counts] = JSON.parse(index.select('year',1));
    expect(filtered).toEqual(['a2']);
    expect(counts.slice(0,2)).toEqual([1,4]);
    index.alphabet(Uint32Array.of(3,0,1,2));
    expect(JSON.parse(index.select('title',0))[0]).toEqual(['d','a2','b','c']);
  } finally { index.free(); }
});
it('filters variants before selecting representatives and recognizes children’s TMDB genres', () => {
  const i = new GridCatalog('{"universe":"kids"}',false,['fr'],[],'[]');
  try {
    i.append(JSON.stringify([{id:'in',groupKey:'a',genres:['Animation'],langs:['en']},{id:'out',groupKey:'a',langs:['fr']}]));
    i.finish(); expect(JSON.parse(i.select('added',0))[0]).toEqual(['in']);
  } finally { i.free(); }
});
it('keeps Home category titles by TMDB genre or provider category, or by universe', () => {
  const pick = (filter: object) => {
    const i = new GridCatalog(JSON.stringify(filter),false,['fr'],[],JSON.stringify([['sp','VOD | Spectacles'],['c','Concerts']]));
    try {
      i.append(JSON.stringify([
        {id:'tmdb',groupKey:'a',genres:['Musique']},{id:'cat',groupKey:'b',categoryId:'c'},{id:'uni',groupKey:'c',universe:'music'},
        {id:'stage',groupKey:'d',categoryId:'sp'},{id:'action',groupKey:'e',genres:['Action']},
      ]));
      i.finish(); return (JSON.parse(i.select('added',0))[0] as string[]).sort();
    } finally { i.free(); }
  };
  expect(pick({mask:1<<14})).toEqual(['cat','tmdb']);
  expect(pick({universe:'music',mask:1<<14})).toEqual(['cat','tmdb','uni']);
  expect(pick({mask:1<<16})).toEqual(['stage']);
});
it('follows a chosen sort across the user\'s languages, by the IMDb rating shown', () => {
  const i = new GridCatalog('{}',false,['fr','en'],[],'[]');
  try {
    i.append(JSON.stringify([
      {id:'fr-old',groupKey:'a',langs:['fr'],year:1990,rating:9,imdbRating:6,addedAt:3},
      {id:'en-new',groupKey:'b',langs:['en'],year:2024,rating:5,imdbRating:8,addedAt:2},
      {id:'de',groupKey:'c',langs:['de'],year:2025,imdbRating:9.5,addedAt:1},
    ]));
    i.finish();
    expect(JSON.parse(i.select('year',0))[0]).toEqual(['en-new','fr-old','de']);
    expect(JSON.parse(i.select('rating',0))[0]).toEqual(['en-new','fr-old','de']);
    expect(JSON.parse(i.select('added',0))[0]).toEqual(['fr-old','en-new','de']);
  } finally { i.free(); }
});
it('preserves complete history actions and escapes titles, including embedded markup', () => {
  const history = {key:'replay:1',title:'<img onload=x>',kind:'replay',completed:true};
  const html = library_html(JSON.stringify({movies:[],series:[],cont:[],hist:[history,{...history,kind:'live'},{...history,completed:false}]}),'fr');
  expect(html.match(/data-cmd="resume:replay:1"/g)).toHaveLength(1);
  expect(html).toContain('&lt;img onload=x&gt;');
  expect(html).not.toContain('<img onload');
});
it('retains the home actions for restartable items and source category filters', () => {
  const h=home_html(JSON.stringify({cont:[{key:'episode:source:e:2',title:'Épisode',positionSec:30,durationSec:90}]}),'fr');
  expect(h).toContain('data-cmd="remove:resume:episode:source:e:2"');
  expect(h).toContain('1:00');
});
it('splits home into uniquely keyed shelves, with smaller pictures on a weak device', () => {
  const m=(id:string)=>({id,title:id,poster:'https://image.tmdb.org/t/p/w500/p.jpg'});
  const raw=JSON.stringify({hasVod:true,fresh:[m('a'),m('b'),m('c')],genres:[['Drame',[m('d'),m('e'),m('f')]],['Drame',[m('g'),m('h'),m('i')]]]});
  const blocks=JSON.parse(home_blocks(raw,'fr')) as [string,string][];
  const keys=blocks.map(b=>b[0]);
  expect(new Set(keys).size).toBe(keys.length);
  expect(keys[0]).toBe('all:fresh');
  expect(blocks.map(b=>b[1]).join('')).toBe(home_html(raw,'fr'));
  expect(home_html(raw,'fr')).toContain('/w342/');
  set_low_end(true);
  try { expect(home_html(raw,'fr')).toContain('/w185/'); } finally { set_low_end(false); }
});
it('splits Contenus into keyed shelves with card-sized ARTE pictures', () => {
  const it=(id:string)=>({id,provider:'arte',kind:'video',title:id,image:`https://api-cdn.arte.tv/img/v2/image/${id}/940x530?type=TEXT`});
  const cat={rails:[{id:'a',title:'A',provider:'arte',items:[it('x'),it('y')]},{id:'a',title:'A bis',provider:'arte',items:[it('z')]}],kids:[],youtube:[],failed:['francetv']};
  const raw=JSON.stringify(cat);
  const blocks=JSON.parse(replay_blocks(raw,'[]','all','fr',Date.now(),'ready')) as [string,string][];
  const keys=blocks.map(b=>b[0]);
  expect(new Set(keys).size).toBe(keys.length);
  expect(keys).toEqual(['down:francetv','a','a#2','footer']);
  expect(blocks.map(b=>b[1]).join('')).toBe(replay_shelves(raw,'[]','all','fr',Date.now(),'ready'));
  expect(blocks[1][1]).toContain('/480x270?');
  set_low_end(true);
  try { expect(replay_shelves(raw,'[]','all','fr',Date.now(),'ready')).toContain('/400x225?'); } finally { set_low_end(false); }
});
it('shows Home categories as filter chips, the current one marked, no sport / news', () => {
  const h=home_categories('music','fr');
  expect(h).toContain('data-cmd="cat:all"'); expect(h).toContain('data-cmd="cat:shows"');
  expect(h).toMatch(/class="chip cat-chip active"[^>]*data-cmd="cat:music"/);
  expect(h).not.toContain('cat:sport'); expect(h).not.toContain('cat:news');
  expect(h).toContain('Tout'); expect(h).toContain('Spectacles');
});
it('keeps the catalogue actions on person and search pages', () => {
  const items=[{it:{id:'a',title:'Ancien',year:1992},kind:'movie'},{it:{id:'b',title:'Nouveau',year:2020},kind:'series'}];
  const html=person_html(JSON.stringify({p:{name:'Camille',bio:'z'.repeat(401)},items}),'','fr',false);
  expect(html.indexOf('series:b')).toBeLessThan(html.indexOf('movie:a'));
  expect(html).toContain('data-cmd="bio"');
  const hits=search_results_html(JSON.stringify({movies:[],series:[],channels:[{id:'ch:1',name:'Chaîne'}],programs:[]}),'[]','[]','','en');
  expect(hits).toContain('data-cmd="channel:ch:1" data-lp');
  const quick=search_results_html('null','["dune"]',JSON.stringify([{kind:'movie',id:'m:1',title:'Dune',sub:'2021'},{kind:'channel',id:'ch:1',title:'Chaîne',logo:[null,'/l.png']}]),'','en');
  expect(quick).toContain('data-cmd="query:dune"');
  expect(quick).toContain('data-cmd="pick:movie:m:1"');
  expect(quick).toContain('data-cmd="pick:channel:ch:1" data-lp');
});
it('uses the next image once a candidate fails and displays a label if every candidate fails', () => {
  const data=JSON.stringify({srcs:['/first-test','/second-test'],label:'Illustration <2>'});
  expect(artwork_html(data)).toContain('src="/first-test"');
  expect(artwork_failed('/first-test',data)).toContain('src="/second-test"');
  expect(artwork_failed('/second-test',data)).toContain('Illustration &lt;2&gt;');
});

it('renders a featured movie with provider artwork before TMDB enrichment', () => {
  const html = hero_html(JSON.stringify({title:'Nouveau film', poster:'/provider-poster'}), 0, 2, 'fr');
  expect(html).toContain('src="/provider-poster"');
  expect(html).toContain('<h1>Nouveau film</h1>');
  // one selectable banner (opens the page), no Lecture / Infos buttons, no synopsis
  for (const action of ['info', 'go:1']) expect(html).toContain(`data-cmd="${action}"`);
  expect(html).not.toContain('data-cmd="play"');
  expect(hero_html(JSON.stringify({title:'X', plot:'Résumé'}), 0, 1, 'fr')).not.toContain('Résumé');
});
