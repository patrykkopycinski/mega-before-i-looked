import type { DigestRow, Night } from '../digest/types.js';

const dash = (v: string | null) => v ?? '—';

function Row({ row }: { row: DigestRow }) {
  return (
    <tr>
      <td>{row.job}</td>
      <td>{dash(row.owner)}</td>
      <td>{row.runs}</td>
      <td class={row.retries >= 3 ? 'warn' : undefined}>{row.retries}</td>
      <td class={row.lastStatus === 'fail' ? 'warn' : undefined}>{row.lastStatus}</td>
      <td>{dash(row.lastError)}</td>
      <td>{row.firstAt}</td>
      <td>{row.lastAt}</td>
    </tr>
  );
}

export function Digest({ night }: { night: Night }) {
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {night.rows.map((row) => (
              <Row row={row} />
            ))}
          </tbody>
        </table>
      )}
      {night.badLines > 0 && (
        <p class="warn">
          {night.badLines} {night.badLines === 1 ? 'line' : 'lines'} in the log did not parse
        </p>
      )}
    </>
  );
}
