import migration from '../../supabase/migrations/008_timer_accounting.sql?raw';
import {describe,expect,it} from 'vitest';

// Static guard only. Execute real RPC/RLS scenarios against an approved LOCAL PostgreSQL
// before merging; no database is started or contacted by these checks.
describe('migration 008 static security contract',()=>{
  it('retains source rows and restricts the accounting helper',()=>{
    expect(migration).toMatch(/revoke all on function public\.studyflow_counted_intervals\(timestamptz,timestamptz\) from public, anon, authenticated/i);
    expect(migration).toMatch(/if not public\.is_studyflow_admin\(\)/i);
    expect(migration).toMatch(/if auth\.uid\(\) is null/i);
    expect(migration).not.toMatch(/drop table|disable row level security|grant execute on function public\.studyflow_counted_intervals/i);
  });
  it('rejects malformed, future and mismatched segment timelines',()=>{
    expect(migration).toMatch(/jsonb_array_length\(new\.active_segments\) > 500/i);
    expect(migration).toMatch(/new\.end_time > now\(\) \+ interval '5 minutes'/i);
    expect(migration).toMatch(/last_at <= first_at/i);
    expect(migration).toMatch(/first_at < previous_end/i);
    expect(migration).toMatch(/total_ms <> new\.study_seconds\*1000/i);
  });
});
