import { guide_delta } from '../../rust/generated/cyberstream';
import { db } from '../db';
import { uid } from '../util/text';
import type { Program } from '../types';

/** Save batches outside the live guide until the entire XML document has been validated. */
export class GuideImport {
  private readonly job = `${Date.now()}-${uid()}`;
  private readonly ids = new Set<string>();

  async append(rows: Program[]) {
    const groups = new Map<string, Program[]>();
    for (const row of rows) {
      let group = groups.get(row.epgId);
      if (!group) groups.set(row.epgId, group = []);
      group.push(row);
      this.ids.add(row.epgId);
    }
    await db.guideStage.bulkAdd([...groups].map(([epgId, programs]) => ({ job: this.job, epgId, programs })));
  }

  async publish() {
    const ids = [...this.ids];
    // Each channel switches to the new schedule in a single transaction. A reader always
    // sees a coherent schedule, including if Android suspends the worker partway through.
    for (let i = 0; i < ids.length; i += 16) {
      const page = ids.slice(i, i + 16);
      await db.transaction('rw', db.programs, db.guideStage, async () => {
        const deltas = await Promise.all(page.map(async id => {
          const [staged, previous] = await Promise.all([
            db.guideStage.where('[job+epgId]').equals([this.job, id]).toArray(),
            db.programs.where('[epgId+start]').between([id, -Infinity], [id, Infinity]).toArray(),
          ]);
          return JSON.parse(guide_delta(JSON.stringify(previous), JSON.stringify(staged.flatMap(s => s.programs)))) as { write: Program[]; remove: number[] };
        }));
        await db.programs.bulkDelete(deltas.flatMap(d => d.remove));
        await db.programs.bulkPut(deltas.flatMap(d => d.write));
        await db.guideStage.where('[job+epgId]').anyOf(page.map(id => [this.job, id])).delete();
      });
    }
    return ids;
  }

  discard() { return db.guideStage.where('job').equals(this.job).delete(); }
  static clearAbandoned() { return db.guideStage.where('job').below(String(Date.now() - 86400000)).delete(); }
}
