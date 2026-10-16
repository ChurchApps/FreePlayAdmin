import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiHelper } from "@churchapps/apphelper";
import { getAvailableProviders, type ContentFile, type ContentFolder, type ContentItem, type ProviderInfo } from "@churchapps/content-providers";
import { ContentProviderAuthHelper, FREEPLAY_PROVIDER_IDS, type ContentProviderAuthInterface } from "../helpers";

export const LINKED_PROVIDERS_KEY = ["/contentProviderAuths/church", "DoingApi"];

export const isLanProvider = (p: ProviderInfo) => p.id === "freeshow" || p.authTypes.includes("network_discovery");

export const useProviders = () => {
  const all = useMemo(() => getAvailableProviders(FREEPLAY_PROVIDER_IDS).sort((a, b) => FREEPLAY_PROVIDER_IDS.indexOf(a.id) - FREEPLAY_PROVIDER_IDS.indexOf(b.id)), []);
  const linkedQuery = useQuery<ContentProviderAuthInterface[]>({ queryKey: LINKED_PROVIDERS_KEY, queryFn: () => ContentProviderAuthHelper.getLinked(), placeholderData: [] });
  const linked = linkedQuery.data || [];
  const browsable = useMemo(() => all.filter((p) => p.implemented && !isLanProvider(p) && (!p.requiresAuth || linked.some((l) => l.providerId === p.id))), [all, linked]);
  return { all, linked, browsable, refetch: linkedQuery.refetch, isLoading: linkedQuery.isLoading };
};

export const providerName = (all: ProviderInfo[], id?: string) => all.find((p) => p.id === id)?.name || id || "";

export const browseProvider = async (providerId: string, path: string): Promise<ContentItem[]> => {
  const result = await ApiHelper.post("/providerProxy/browse", { providerId, path: path || null }, "DoingApi");
  return Array.isArray(result) ? result : [];
};

export const getProviderPlaylist = async (providerId: string, path: string): Promise<ContentFile[]> => {
  const result = await ApiHelper.post("/providerProxy/getPlaylist", { providerId, path }, "DoingApi");
  return Array.isArray(result) ? result : [];
};

export interface Crumb { title: string; path: string; leaf?: boolean }

export const useBrowser = () => {
  const [providerId, setProviderId] = useState("");
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async (pid: string, path: string, leaf = false) => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      let items = await browseProvider(pid, path);
      if (leaf && items.length === 0) items = (await getProviderPlaylist(pid, path)).map((f) => ({ ...f, type: "file" as const }));
      if (mine !== seq.current) return;
      setFolders(items.filter((i): i is ContentFolder => i.type === "folder"));
      setFiles(items.filter((i): i is ContentFile => i.type === "file"));
    } catch {
      if (mine !== seq.current) return;
      setFolders([]);
      setFiles([]);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);

  const selectProvider = useCallback((pid: string) => {
    setProviderId(pid);
    setCrumbs([]);
    setFolders([]);
    setFiles([]);
    if (pid) load(pid, "");
  }, [load]);

  const openFolder = useCallback((folder: ContentFolder) => {
    setCrumbs((c) => [...c, { title: folder.title, path: folder.path, leaf: !!folder.isLeaf }]);
    load(providerId, folder.path, !!folder.isLeaf);
  }, [load, providerId]);

  const goTo = useCallback((index: number) => {
    const next = index < 0 ? [] : crumbs.slice(0, index + 1);
    setCrumbs(next);
    const last = next[next.length - 1];
    load(providerId, last?.path || "", !!last?.leaf);
  }, [crumbs, load, providerId]);

  const currentPath = crumbs.length ? crumbs[crumbs.length - 1].path : "";

  return { providerId, selectProvider, crumbs, folders, files, loading, openFolder, goTo, currentPath };
};
