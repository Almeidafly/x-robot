// "Quantum": run several READ-ONLY paths in parallel, keep the first that works.
export async function race(ctx, browser, paths, run) {
  if (paths.some(p => p.outbound)) throw new Error('only read-only paths may race');
  const pages = await Promise.all(paths.map(() => browser.newPage()));
  try {
    return await Promise.any(paths.map(async (p, i) => {
      const r = await run(pages[i], p);
      if (!r.ok) throw new Error(r.obstacle?.kind || 'failed');
      return { ...r, path: p };
    }));
  } catch (e) {
    return { ok: false, obstacle: { kind: 'all-paths-failed', action: 'stop' } };
  } finally {
    await Promise.all(pages.map(pg => pg.close()));
  }
}
