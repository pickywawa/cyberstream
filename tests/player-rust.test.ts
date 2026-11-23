import { it, expect } from 'vitest';
import { detail_header, playback_settings, preferred_tracks, player_watchdog, remote_command, resume_plan, seek_command, series_panel, program_html } from '../src/rust/generated/cyberstream';

it('chooses preferred audio and external-language subtitles and remembers stream languages', () => {
  const track = (id:string, language:string, selected = false) => ({id,language,label:language,selected,height:-1});
  const tracks = {audio:[track('1','de',true),track('2','fr')], text:[track('s','fr')],video:[]};
  expect(JSON.parse(preferred_tracks(JSON.stringify(tracks),['fr'],['fr'],'auto'))).toEqual(['2',null,['de','fr'],['fr']]);
  expect(JSON.parse(preferred_tracks(JSON.stringify({...tracks,audio:tracks.audio.slice(0,1)}),['fr'],['fr'],'auto'))[1]).toBe('s');
  expect(player_watchdog('error','HTTP 429',0,2)).toBe('retry');
  expect(player_watchdog('error','HTTP 429',0,3)).toBe('next');
  expect(remote_command('ArrowRight', false, false, true, false, false)).toBe('right');
});
it('seeks in the live buffer, provider catch-up, shifted programme and VOD', () => {
  const state={position:270,duration:0,buffered:300,seekableStart:100,seekableEnd:300};
  const base={mode:'live',state,shiftStart:0,now:1_000_000,lag:2,catchup:true,start:400000,end:1000000,fallback:900};
  const run=(options:Partial<typeof base>,ratio:boolean,amount:number)=>JSON.parse(seek_command(JSON.stringify({...base,...options}),ratio,amount));
  expect(run({},false,-10)).toEqual(['seek',260]);
  expect(run({},false,-270)).toEqual(['shift',702000]);
  expect(run({mode:'shift',shiftStart:730000},false,10)).toEqual(['live',0]);
  expect(run({mode:'vod'},true,.5)).toEqual(['seek',450]);
});
it('renders audio, quality, subtitle offset and format controls without duplicate qualities', () => {
  const track = (id:string,label:string,height:number) => ({id,label,height,selected:false});
  const html=playback_settings(JSON.stringify({tracks:{audio:[],text:[],video:[track('v1','HD',720),track('v2','HD',720)]},
    labels:['Principal','Autre'],index:0,fit:'fit',rate:1,vod:true,ext:{enabled:true,status:'ready',active:4,results:[],offset:.5}}),'fr');
  for(const cmd of ['text-off','video-auto','video:v1','candidate:1','fit:zoom','rate:0.75','earlier','later'])expect(html).toContain('data-cmd="'+cmd+'"');
  expect(html).not.toContain('video:v2');
});
it('resumes the right series entry and skips completed, recently hidden and short items', () => {
  const row={key:'m',kind:'movie',positionSec:35,durationSec:1000,updatedAt:5,completed:false};
  const rows=[row,{...row,key:'e',kind:'episode',seriesId:'s',completed:true},{...row,key:'e2',kind:'episode',seriesId:'s'},
    {...row,key:'hidden'},{...row,key:'short',positionSec:2}];
  expect(JSON.parse(resume_plan(JSON.stringify(rows),'{"hidden":7}'))).toEqual([[0,false],[1,true]]);
});
it('opens the successor across seasons while keeping the last-watched season available', () => {
  const ep=(id:string,season:number)=>({id,title:'Episode 1',episode:1,season});
  const data={title:'Saga',episodes:[ep('a',1),ep('b',2)],watch:[{itemId:'a',completed:true,updatedAt:5}],similar:[],season:null,tab:'episodes',loading:false};
  const p=JSON.parse(series_panel(JSON.stringify(data),'fr'));
  expect([p.id,p.at,p.season,p.label]).toEqual(['b',0,1,'S2 E1']);
  expect(p.html).toContain('data-ep="a"');
  const header=detail_header(JSON.stringify({item:{title:'Saga',cast:['A'],imdbRating:8.3,certAge:12},playable:true,series:true,resumeLabel:p.label}),'fr');
  expect(header).toContain('S2 E1');expect(header).toContain('IMDb');expect(header).toContain('-12');
});
it('shows restart only inside the channel catch-up window', () => {
  const ch=JSON.stringify({name:'Demo',catchupDays:1,catchupMode:'xc'});
  const program=JSON.stringify({start:100000,stop:200000,title:'Demo'});
  expect(program_html(ch,program,'fr',150000)).toContain('data-cmd="restart"');
  expect(program_html(ch,program,'fr',90000000)).not.toContain('data-cmd="restart"');
});
