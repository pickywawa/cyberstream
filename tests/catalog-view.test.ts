import { expect, it } from 'vitest';
import { GridCatalog, artwork_failed, artwork_html, home_html, library_html, person_html, search_results_html } from '../src/rust/generated/cyberstream';

it('selects the right version and stable order for each catalogue sort and genre', () => {
  const index = new GridCatalog('{}', true, ['fr','en'], [], JSON.stringify([['c','Comédie']]));
  const row = (id:string, groupKey:string, langs:string[], year:number, extra={}) => ({id,groupKey,langs,year,title:id,categoryId:'c',...extra});
  try {
    index.append(JSON.stringify([row('a1','a',['es'],2020),row('b','b',['en'],2026),row('c','c',[],2010,{origLang:'fr'})]));
    index.append(JSON.stringify([row('a2','a',['fr'],2024,{genres:['Action']}),row('d','d',['fr'],2012),row('hidden','hidden',['fr'],2025,{universe:'adult'})]));
    index.finish();
    expect(JSON.parse(index.select('year',0))[0]).toEqual(['a2','d','c','b']);
    const [filtered,counts] = JSON.parse(index.select('year',1));
    expect(filtered).toEqual(['a2']);
    expect(counts.slice(0,2)).toEqual([1,4]);
    index.alphabet(Uint32Array.of(3,0,1,2));
    expect(JSON.parse(index.select('title',0))[0]).toEqual(['d','a2','c','b']);
  } finally { index.free(); }
});
it('filters variants before selecting representatives and recognizes children’s TMDB genres', () => {
  const i = new GridCatalog('{"universe":"kids"}',false,['fr'],[],'[]');
  try {
    i.append(JSON.stringify([{id:'in',groupKey:'a',genres:['Animation'],langs:['en']},{id:'out',groupKey:'a',langs:['fr']}]));
    i.finish(); expect(JSON.parse(i.select('added',0))[0]).toEqual(['in']);
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
  expect(h).toContain('1:00'); expect(h).toContain('data-cmd="tile:docs"');
});
it('keeps the catalogue actions on person and search pages', () => {
  const items=[{it:{id:'a',title:'Ancien',year:1992},kind:'movie'},{it:{id:'b',title:'Nouveau',year:2020},kind:'series'}];
  const html=person_html(JSON.stringify({p:{name:'Camille',bio:'z'.repeat(401)},items}),'','fr',false);
  expect(html.indexOf('series:b')).toBeLessThan(html.indexOf('movie:a'));
  expect(html).toContain('data-cmd="bio"');
  const hits=search_results_html(JSON.stringify({movies:[],series:[],channels:[{id:'ch:1',name:'Chaîne'}],programs:[]}),'[]','','en');
  expect(hits).toContain('data-cmd="channel:ch:1" data-lp');
});
it('uses the next image once a candidate fails and displays a label if every candidate fails', () => {
  const data=JSON.stringify({srcs:['/first-test','/second-test'],label:'Illustration <2>'});
  expect(artwork_html(data)).toContain('src="/first-test"');
  expect(artwork_failed('/first-test',data)).toContain('src="/second-test"');
  expect(artwork_failed('/second-test',data)).toContain('Illustration &lt;2&gt;');
});
