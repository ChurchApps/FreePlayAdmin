import { request, type APIRequestContext } from "@playwright/test";

export const API_BASE = process.env.API_BASE || "http://localhost:8084";
export const GRACE_CHURCH_ID = "CHU00000001";

export interface ApiSession {
  ctx: APIRequestContext;
  headers: Record<string, string>;
  get: (path: string) => Promise<any>;
  post: (path: string, data: unknown) => Promise<any>;
  del: (path: string) => Promise<void>;
  dispose: () => Promise<void>;
}

// Demo user belongs to two churches with Accra first; always act as Grace.
export async function apiSession(): Promise<ApiSession> {
  const ctx = await request.newContext();
  const loginRes = await ctx.post(API_BASE + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } });
  const body = await loginRes.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === GRACE_CHURCH_ID) || body.userChurches?.[0];
  const headers = { Authorization: "Bearer " + uc?.jwt };
  return {
    ctx,
    headers,
    get: async (path) => (await ctx.get(API_BASE + path, { headers })).json(),
    post: async (path, data) => (await ctx.post(API_BASE + path, { headers, data })).json(),
    del: async (path) => { await ctx.delete(API_BASE + path, { headers }); },
    dispose: () => ctx.dispose()
  };
}

export async function removeE2EData(session: ApiSession) {
  const isE2E = (name?: string) => /^E2E /.test(name || "");
  const groups = await session.get("/doing/screenGroups");
  for (const g of (Array.isArray(groups) ? groups : []).filter((x: any) => isE2E(x.name))) {
    const entries = await session.get("/doing/scheduleEntries/group/" + g.id);
    for (const e of Array.isArray(entries) ? entries : []) await session.del("/doing/scheduleEntries/" + e.id);
    await session.del("/doing/screenGroups/" + g.id);
  }
  const playlists = await session.get("/doing/playlists");
  for (const p of (Array.isArray(playlists) ? playlists : []).filter((x: any) => isE2E(x.name))) await session.del("/doing/playlists/" + p.id);
}
