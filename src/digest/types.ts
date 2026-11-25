export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job for one night. Times keep the offset from the log.
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

// Log entries per status, over the lines that parsed.
export type Counts = Record<RunStatus, number>;

export type Night = {
  night: string;
  rows: DigestRow[];
  counts: Counts;
  badLines: number;
};

// null when runs/<night>.jsonl does not exist.
export type ReadNight = (runsDir: string, night: string) => Night | null;
