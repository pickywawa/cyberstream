import { describe, expect, it } from 'vitest';
import { parseVoice } from '../src/core/voice/parse';

const player = (s: string) => parseVoice(s, { inPlayer: true });

describe('voice commands in other languages', () => {
  it('controls the player', () => {
    for (const s of ['Pause', 'pausa', 'пауза', '暂停', '一時停止', 'إيقاف مؤقت', 'বিরতি', 'रोको', 'jeda']) expect(player(s)).toEqual({ type: 'player', action: 'pause' });
    for (const s of ['weiter', 'continuar', 'riprendi', 'продолжить', '继续', '再生', 'lanjutkan']) expect(player(s)).toEqual({ type: 'player', action: 'resume' });
    expect(player('zurück 30 Sekunden')).toEqual({ type: 'player', action: 'back', seconds: 30 });
    expect(player('retrocede 2 minutos')).toEqual({ type: 'player', action: 'back', seconds: 120 });
    expect(player('avanti 10 secondi')).toEqual({ type: 'player', action: 'forward', seconds: 10 });
    expect(player('вперед 20 секунд')).toEqual({ type: 'player', action: 'forward', seconds: 20 });
    expect(player('快进 30 秒')).toEqual({ type: 'player', action: 'forward', seconds: 30 });
    expect(player('en vivo')).toEqual({ type: 'player', action: 'live' });
    expect(player('ao vivo')).toEqual({ type: 'player', action: 'live' });
    expect(player('siguiente canal')).toEqual({ type: 'player', action: 'next' });
    expect(player('nächster Sender')).toEqual({ type: 'player', action: 'next' });
    expect(player('下一个频道')).toEqual({ type: 'player', action: 'next' });
    expect(player('القناة السابقة')).toEqual({ type: 'player', action: 'prev' });
    expect(player('chiudi')).toEqual({ type: 'player', action: 'stop' });
  });

  it('opens tabs', () => {
    expect(parseVoice('Startseite')).toEqual({ type: 'tab', tab: 'home' });
    expect(parseVoice('abre los ajustes')).toEqual({ type: 'tab', tab: 'settings' });
    expect(parseVoice('настройки')).toEqual({ type: 'tab', tab: 'settings' });
    expect(parseVoice('ホーム')).toEqual({ type: 'tab', tab: 'home' });
    expect(parseVoice('设置')).toEqual({ type: 'tab', tab: 'settings' });
    expect(parseVoice('टीवी')).toEqual({ type: 'tab', tab: 'tv' });
  });

  it('plays and searches', () => {
    expect(parseVoice('spiele ZDF')).toEqual({ type: 'play', query: 'zdf' });
    expect(parseVoice('pon el canal 5')).toEqual({ type: 'channel', query: '5', num: 5 });
    expect(parseVoice('metti il film Dune')).toEqual({ type: 'movie', query: 'dune' });
    expect(parseVoice('quero ver a série Lupin')).toEqual({ type: 'series', query: 'lupin' });
    expect(parseVoice('включи канал 1')).toEqual({ type: 'channel', query: '1', num: 1 });
    expect(parseVoice('busca Dune')).toEqual({ type: 'search', query: 'dune' });
    expect(parseVoice('cari Avatar')).toEqual({ type: 'search', query: 'avatar' });
    expect(parseVoice('搜索 沙丘')).toEqual({ type: 'search', query: '沙丘' });
    expect(parseVoice('播放 CCTV')).toEqual({ type: 'play', query: 'cctv' });
    expect(parseVoice('स्टार प्लस चलाओ')).toEqual({ type: 'play', query: 'स्टार प्लस' });
    expect(parseVoice('جیو نیوز لگاؤ')).toEqual({ type: 'play', query: 'جیو نیوز' });
    expect(parseVoice('NHKをつけて')).toEqual({ type: 'play', query: 'nhk' });
    expect(parseVoice('شغل قناة الجزيرة')).toEqual({ type: 'channel', query: 'الجزيرة' });
  });
});
