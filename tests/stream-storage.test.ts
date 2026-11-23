import 'fake-indexeddb/auto';
import { gzipSync } from 'node:zlib';
import { afterEach, expect, it } from 'vitest';
import { db } from '../src/core/db';
import { GuideImport } from '../src/core/epg/staging';
import { decodeTextBody } from '../src/core/net/http';
import { PlaylistCatalog } from '../src/rust/generated/cyberstream';

afterEach(async () => { await db.programs.clear(); await db.guideStage.clear(); });

it('keeps prior schedules during import, discards incomplete downloads and replaces published channels', async () => {
  const program = (epgId: string, title: string) => ({ epgId, title, start: 1, stop: 2 });
  await db.programs.bulkAdd([program('a','old'), program('b','other')]);
  const failed = new GuideImport();
  await failed.append([program('a','partial')]);
  await failed.discard();
  const complete = new GuideImport();
  await complete.append([program('a','new')]);
  expect((await db.programs.toArray()).map(p=>p.title)).toEqual(['old','other']);
  await complete.publish();
  expect((await db.programs.toArray()).map(p=>[p.id,p.title])).toEqual([[1,'new'],[2,'other']]);
  expect(await db.guideStage.count()).toBe(0);
});

it('decodes fragmented gzip and plain UTF-8 even when the first byte arrives by itself', async () => {
  const expected = 'Émission 🎞️'.repeat(8000);
  for (const bytes of [gzipSync(expected), new TextEncoder().encode(expected)]) {
    const source = new ReadableStream<Uint8Array>({start(c){c.enqueue(bytes.subarray(0,1));c.enqueue(bytes.subarray(1));c.close();}});
    const reader = decodeTextBody(source).getReader();
    let text = '';
    for (;;) { const part = await reader.read(); if (part.done) break; text += part.value; }
    expect(text).toBe(expected);
  }
});

it('streams M3U rows with stable keys and one season-independent series entry across batches', () => {
  const parser = new PlaylistCatalog('src','profile',1);
  try {
    const first = JSON.parse(parser.feed('#EXTM3U\n#EXTINF:-1 group-title="France" tvg-id="TV.FR",Télé\nhttps://example.invalid/1.ts\n#EXTINF:-1,Paris S01E01\nhttps://example.invalid/series/1.mp4\n',false));
    const last = JSON.parse(parser.feed('#EXTINF:-1,Paris S02E01\nhttps://example.invalid/series/2.mp4\n#EXTINF:-1,Dune (2021)\nhttps://example.invalid/movie/a.mp4',true));
    expect(first.channels[0]).toMatchObject({ epgId:'tv.fr', extId:'1', sourceId:'src' });
    expect(first.series).toHaveLength(1);
    expect(last.series).toHaveLength(0);
    expect(last.episodes[0]).toMatchObject({ seriesId:first.series[0].id, season:2, episode:1 });
    expect(last.movies[0]).toMatchObject({title:'Dune',year:2021,groupKey:'mv:dune:2021'});
  } finally { parser.free(); }
});

it('skips unchanged Xtream entries while detecting category edits and conflicting duplicate IDs', async () => {
  const { XtreamList } = await import('../src/rust/generated/cyberstream');
  const read = (p: InstanceType<typeof XtreamList>, rows: unknown[]) => JSON.parse(p.feed(new TextEncoder().encode(JSON.stringify(rows)),true));
  const item = { stream_id: 7, name:'Film',category_id:'1' };
  const cats = JSON.stringify([{category_id:'1',category_name:'Films FR'}]);
  const first = new XtreamList('vod','s','p',cats);
  const warm = new XtreamList('vod','s','p',cats);
  const recategorized = new XtreamList('vod','s','p',cats.replace('FR','ES'));
  try {
    expect(read(first,[item])[0].title).toBe('Film');
    warm.restore(first.snapshot());
    const result=read(warm,[item,{...item,name:'Nouveau'},item]);
    expect(result[0]).toBe('s:m:7');
    expect(result[1].title).toBe('Nouveau');
    expect(result[2].title).toBe('Film');
    recategorized.restore(first.snapshot());
    expect(read(recategorized,[item])[0].id).toBe('s:m:7');
  } finally { first.free(); warm.free(); recategorized.free(); }
});

it('maps TMDB age ratings and credits, preserves reserved credential characters and orders series episodes', async () => {
  const {tmdb_result,xtream_endpoint,xtream_episodes} = await import('../src/rust/generated/cyberstream');
  const data={id:2,name:'Série',first_air_date:'2020-05-10',content_ratings:{results:[{iso_3166_1:'US',rating:'TV-14'}]},credits:{cast:[{name:'Zoé',id:3}]}};
  expect(JSON.parse(tmdb_result('details','tv','fr-FR',JSON.stringify(data)))).toMatchObject({year:2020,title:'Série',certAge:14,people:[{id:3,name:'Zoé'}]});
  const url = new URL(xtream_endpoint('http://example.invalid','u +','a&b',false,'get_live_streams',[]));
  expect(url.searchParams.get('username')).toBe('u +');
  expect(url.searchParams.get('password')).toBe('a&b');
  const info={episodes:{'10':[{id:2,title:'Série - B',episode_num:'1'}],'2':[{id:1,title:'Série - A',episode_num:4}]}};
  const result=JSON.parse(xtream_episodes(JSON.stringify(info),'src','sid','Série'));
  expect(result.map((x:{season:number;title:string})=>[x.season,x.title])).toEqual([[2,'A'],[10,'B']]);
});

it('keeps long subtitles active when many shorter cues overlap them', async () => {
  const {cueTrack}=await import('../src/core/subs/parse');
  const track=cueTrack([{start:0,end:99,text:'long'},...Array.from({length:20},(_,i)=>({start:i+1,end:i+1.5,text:'short'}))]);
  try { const ids=track.active(20.25);expect([...ids]).toEqual([0,20]);expect(track.next_change(20.25,ids)).toBe(20.5); } finally {track.free();}
});

it('handles Trakt linking, cached sessions and personalised lists against a fake transport', async () => {
  const {trakt_action,trakt_lists}=await import('../src/rust/generated/cyberstream');
  const media={ids:{tmdb:31},title:'Fixture',year:2020};
  const fake=async(spec:string)=>{
    const {url}=JSON.parse(spec);
    const path=new URL(url).pathname;
    const payload=path==='/oauth/device/token'?{access_token:'test',refresh_token:'next',created_at:10,expires_in:60}:
      path==='/users/settings'?{user:{username:'demo'}}:path==='/users/me/lists'?[{name:'Test',ids:{trakt:1}}]:
      path.includes('/recommendations/')?[media]:[{movie:media}];
    return JSON.stringify({status:200,data:payload});
  };
  const polled=JSON.parse(await trakt_action('poll',JSON.stringify({id:'demo',secret:'demo',code:'demo'}),10000,fake));
  expect(polled).toMatchObject({status:'ok',token:{access:'test',exp:70000}});
  const session=JSON.parse(await trakt_action('session',JSON.stringify({id:'demo',token:{access:'cached',exp:999999999}}),0,()=>{throw Error('unexpected request')}));
  expect(session.access).toBe('cached');
  const lists=JSON.parse(await trakt_lists('demo','demo',10000,fake));
  expect(lists).toMatchObject({user:'demo',forYouMovies:[{tmdbId:31}],lists:[{name:'Test',movies:[{tmdbId:31}]}]});
});
