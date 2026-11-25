import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

let runsDir: string;
let app: ReturnType<typeof createApp>;

const line = (o: object) => JSON.stringify(o);

beforeAll(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  writeFileSync(
    join(runsDir, '2026-11-01.jsonl'),
    [
      line({ at: '2026-11-01T23:00:00+01:00', job: 'b/job', status: 'ok', owner: 'rook' }),
      line({ at: '2026-11-01T23:01:00+01:00', job: 'a/job', status: 'fail', owner: null, error: 'boom' }),
      '{"at":"2026-11-02T01:00:00+01:00","job":"b/j',
    ].join('\n'),
  );
  writeFileSync(join(runsDir, '2026-11-02.jsonl'), '');
  app = createApp({ adapter: 'shim', installed: '2026-11-01T00:00:00+01:00', beatEverySeconds: 60, runsDir });
});

afterAll(() => rmSync(runsDir, { recursive: true, force: true }));

describe('GET /digest/:night', () => {
  it('renders a night with a bad line: rows sorted by job, null owner as —, bad line counted', async () => {
    const res = await app.request('/digest/2026-11-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('<td>a/job</td><td>—</td>');
    expect(html).toContain('<td class="warn">fail</td>');
    expect(html).toContain('1 line in the log did not parse');
  });

  it('returns 404 for a night with no file', async () => {
    expect((await app.request('/digest/2026-11-09')).status).toBe(404);
  });

  it('renders "nothing ran" for an empty night', async () => {
    const res = await app.request('/digest/2026-11-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
});

describe('GET /api/digest/:night', () => {
  it('returns the same jobs, in the same order, as the page', async () => {
    const res = await app.request('/api/digest/2026-11-01');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: { job: string; owner: string | null }[]; badLines: number };
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
    expect(body.rows[0]!.owner).toBeNull();
    expect(body.badLines).toBe(1);

    const html = await (await app.request('/digest/2026-11-01')).text();
    const pageJobs = [...html.matchAll(/<tr><td>([^<]+)<\/td>/g)].map((m) => m[1]);
    expect(pageJobs).toEqual(body.rows.map((r) => r.job));
  });

  it('returns 404 for a night with no file', async () => {
    expect((await app.request('/api/digest/2026-11-09')).status).toBe(404);
  });

  it('returns no rows for an empty night', async () => {
    const res = await app.request('/api/digest/2026-11-02');
    expect(res.status).toBe(200);
    expect(((await res.json()) as { rows: unknown[] }).rows).toEqual([]);
  });
});
