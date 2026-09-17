const LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const;
type Level = typeof LEVELS[number];
const LVL: Record<Level, number> = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5 };
const MIN_LVL: number = LVL[(process.env.LOG_LEVEL as Level) || 'INFO'];

function pad(n: number) { return n < 10 ? `0${n}` : String(n); }
function ts() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (LVL[level] < MIN_LVL) return;
  const color =
    level === 'ERROR' || level === 'FATAL' ? '\x1b[31m' :
    level === 'WARN' ? '\x1b[33m' :
    level === 'INFO' ? '\x1b[36m' :
    level === 'DEBUG' ? '\x1b[35m' : '\x1b[37m';
  const RESET = '\x1b[0m';
  const prefix = `${color}[${ts()}] [${level.padEnd(5)}]${RESET}`;
  const line = `${prefix} ${msg}${meta ? ' ' + JSON.stringify(meta) : ''}`;
  if (level === 'ERROR' || level === 'FATAL') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

export const logger = {
  trace: (m: string, meta?: Record<string, unknown>) => log('TRACE', m, meta),
  debug: (m: string, meta?: Record<string, unknown>) => log('DEBUG', m, meta),
  info: (m: string, meta?: Record<string, unknown>) => log('INFO', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log('WARN', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log('ERROR', m, meta),
  fatal: (m: string, meta?: Record<string, unknown>) => log('FATAL', m, meta),
};
