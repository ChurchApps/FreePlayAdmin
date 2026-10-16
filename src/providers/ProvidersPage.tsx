import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Lan as LanIcon } from "@mui/icons-material";
import { type ProviderInfo } from "@churchapps/content-providers";
import { PageContainer, PageHeader, StatusBadge, Surface, TextAction, VerbRow } from "../components/ui";
import { ContentProviderAuthHelper, formatLongDate, type ContentProviderAuthInterface } from "../helpers";
import { AuthFlowDialog } from "./AuthFlowDialog";
import { ProviderBrowseDialog } from "./ProviderBrowser";
import { isLanProvider, useProviders } from "./useProviders";
import { useProviderConnect } from "./useProviderConnect";

const signInLabel = (p: ProviderInfo) => {
  if (p.id === "googledrive") return "Sign in with Google · opens a popup";
  if (p.id === "onedrive") return "Sign in with Microsoft · opens a popup";
  if (p.authTypes.includes("oauth_pkce")) return `Sign in with ${p.name} · opens a popup`;
  return `Sign in with your ${p.name} account`;
};

export const ProvidersPage: React.FC = () => {
  const { all, linked, refetch } = useProviders();
  const [browseId, setBrowseId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const auth = useProviderConnect(all, () => { refetch(); });

  const linkFor = (id: string) => linked.find((l) => l.providerId === id);
  const connected = all.filter((p) => linkFor(p.id));
  const available = all.filter((p) => !linkFor(p.id));

  const handleUnlink = async (link: ContentProviderAuthInterface) => {
    if (!link.id) return;
    await ContentProviderAuthHelper.removeAuth(link.id);
    refetch();
  };

  const handleRefresh = async (id: string) => {
    setBusyId(id);
    await ContentProviderAuthHelper.refresh(id);
    setBusyId(null);
    refetch();
  };

  const statusLine = (p: ProviderInfo, link?: ContentProviderAuthInterface) => {
    if (isLanProvider(p)) {
      return (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
          <LanIcon sx={{ fontSize: 16 }} />
          <span>On your church network · each TV finds it itself. Nothing to connect here.</span>
        </Stack>
      );
    }
    if (!p.requiresAuth) return link ? <StatusBadge tone="success" variant="dot">Public · no sign-in needed</StatusBadge> : "Public · no sign-in needed";
    if (link) {
      const expires = link.expiresAt ? " · expires " + formatLongDate(link.expiresAt) : "";
      return <StatusBadge tone="success" variant="dot">{"Account linked" + expires}</StatusBadge>;
    }
    return signInLabel(p);
  };

  const row = (p: ProviderInfo) => {
    const link = linkFor(p.id);
    const lan = isLanProvider(p);
    return (
      <Stack key={p.id} direction="row" spacing={2} alignItems="center" sx={{ py: 1.5, "& + &": { borderTop: 1, borderColor: "divider" } }} data-testid={"provider-row-" + p.id}>
        <Box sx={{ width: 48, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {p.logos?.light && <Box component="img" src={p.logos.light} alt="" sx={{ maxHeight: 32, maxWidth: 48, objectFit: "contain" }} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
          <Box sx={{ typography: "body2", color: "text.secondary" }}>{statusLine(p, link)}</Box>
        </Box>
        {!lan && (
          <VerbRow plain sx={{ flexShrink: 0, alignItems: "center" }}>
            {(link || !p.requiresAuth) && <TextAction small onClick={() => setBrowseId(p.id)}>Browse</TextAction>}
            {link && p.requiresAuth && <TextAction small disabled={busyId === p.id} onClick={() => handleRefresh(p.id)}>Refresh</TextAction>}
            {link && <TextAction small onClick={() => handleUnlink(link)}>Unlink</TextAction>}
            {!link && <Button variant="outlined" size="small" onClick={() => auth.connect(p.id)} data-testid={"connect-" + p.id}>Connect</Button>}
          </VerbRow>
        )}
      </Stack>
    );
  };

  const browseProviders = all.filter((p) => p.id === browseId);

  return (
    <>
      <PageHeader title="Providers" subtitle="Content sources your playlists can pull from · connected for the whole church" />
      <PageContainer>
        <Stack spacing={3}>
          <Surface>
            <Typography variant="h2" sx={{ mb: 1 }}>Connected</Typography>
            {connected.length === 0 ? <Typography color="text.secondary" sx={{ py: 1.5 }}>Nothing connected yet. Connect a provider below.</Typography> : connected.map(row)}
          </Surface>
          <Surface>
            <Typography variant="h2" sx={{ mb: 1 }}>Available</Typography>
            {available.map(row)}
          </Surface>
        </Stack>
      </PageContainer>
      <AuthFlowDialog open={!!auth.provider} onClose={auth.close} provider={auth.provider} authStatus={auth.authStatus} deviceFlowData={auth.deviceFlowData} authError={auth.authError} onTryAgain={auth.retry} />
      <ProviderBrowseDialog open={!!browseId} providers={browseProviders} initialProviderId={browseId || undefined} title={browseProviders[0]?.name || "Browse"} onClose={() => setBrowseId(null)} />
    </>
  );
};
