import { Guide } from '../../rust/generated/cyberstream';
export { xmltv_date as parseXmltvDate } from '../../rust/generated/cyberstream';
import type { Program } from '../types';

export interface XmltvChannel {
  id: string;
  names: string[];
  icon?: string;
}

export interface XmltvOptions {
  /** called once, when the first <programme> is reached, with all <channel> definitions.
   *  Must return a map xmltvId -> our epgId (programmes for unmapped ids are skipped). null = keep all */
  onChannels: (channels: XmltvChannel[]) => Map<string, string> | null;
  onPrograms: (batch: Program[]) => Promise<void> | void;
  from: number;
  to: number;
  batchSize?: number;
}


export async function parseXmltv(stream: ReadableStream<string>, o: XmltvOptions) {
  const guide = new Guide(o.from, o.to);
  const reader = stream.getReader();
  let channels: XmltvChannel[] = [];
  let count = 0, programs = 0;
  let mapping: Map<string,string> | null | undefined;
  let pending: Program[] = [];
  try {
    for (;;) {
      const {value, done} = await reader.read();
      const batch: {channels:XmltvChannel[]; programs:Program[]; started:boolean} = JSON.parse(guide.feed(value || '',done));
      count += batch.channels.length;
      if (mapping === undefined) {
        for (const c of batch.channels) channels.push(c);
        if (batch.started || done) { mapping = o.onChannels(channels); channels = []; }
      }
      for (const p of batch.programs) {
        const id = mapping ? mapping.get(p.epgId) : p.epgId.toLowerCase();
        if (!id) continue;
        p.epgId = id;
        pending.push(p);
        programs++;
        if (pending.length >= (o.batchSize ?? 2000)) {
          await o.onPrograms(pending);
          pending = [];
        }
      }
      if (done) break;
    }
    if (pending.length) await o.onPrograms(pending);
    return { channels:count, programs };
  } finally { guide.free(); reader.releaseLock(); }
}
