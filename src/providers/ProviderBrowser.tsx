import React from "react";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Link, Stack, Typography } from "@mui/material";
import { ChevronRight as ChevronIcon, Home as HomeIcon } from "@mui/icons-material";
import { type ContentFile, type ProviderInfo } from "@churchapps/content-providers";
import { PillTabs } from "../components/ui";
import { BrowseGrid } from "./BrowseGrid";
import { type Crumb, useBrowser } from "./useProviders";

interface CrumbProps {
  providerName: string;
  crumbs: Crumb[];
  onGo: (index: number) => void;
}

export const BrowseCrumbs: React.FC<CrumbProps> = ({ providerName, crumbs, onGo }) => (
  <Stack direction="row" alignItems="center" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ typography: "body2", color: "text.secondary" }}>
    <HomeIcon sx={{ fontSize: 16 }} />
    {crumbs.length ? <Link component="button" type="button" onClick={() => onGo(-1)}>{providerName}</Link> : <b>{providerName}</b>}
    {crumbs.map((c, i) => (
      <React.Fragment key={c.path}>
        <ChevronIcon sx={{ fontSize: 16 }} />
        {i < crumbs.length - 1 ? <Link component="button" type="button" onClick={() => onGo(i)}>{c.title}</Link> : <b>{c.title}</b>}
      </React.Fragment>
    ))}
  </Stack>
);

export const ProviderLabel: React.FC<{ provider: ProviderInfo }> = ({ provider }) => (
  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
    {provider.logos?.light && <Box component="img" src={provider.logos.light} alt="" sx={{ height: 18, maxWidth: 40, objectFit: "contain" }} />}
    {provider.name}
  </Box>
);

interface DialogProps {
  open: boolean;
  providers: ProviderInfo[];
  initialProviderId?: string;
  title: string;
  onClose: () => void;
  onSelectFolder?: (providerId: string, path: string, label: string) => void;
  onSelectFile?: (file: ContentFile, providerId: string, path: string) => void;
}

export const ProviderBrowseDialog: React.FC<DialogProps> = ({ open, providers, initialProviderId, title, onClose, onSelectFolder, onSelectFile }) => {
  const browser = useBrowser();
  const { selectProvider } = browser;

  React.useEffect(() => {
    if (open) selectProvider(initialProviderId || providers[0]?.id || "");
  }, [open]);

  const provider = providers.find((p) => p.id === browser.providerId);
  const label = [provider?.name, ...browser.crumbs.map((c) => c.title)].filter(Boolean).join(" › ");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {providers.length > 1 && <PillTabs value={browser.providerId} onChange={selectProvider} options={providers.map((p) => ({ value: p.id, label: <ProviderLabel provider={p} /> }))} />}
          {provider && <BrowseCrumbs providerName={provider.name} crumbs={browser.crumbs} onGo={browser.goTo} />}
          {browser.loading
            ? <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
            : browser.folders.length + browser.files.length === 0
              ? <Typography color="text.secondary">{providers.length ? "Nothing in this folder." : "Connect a provider first."}</Typography>
              : (
                <BrowseGrid
                  folders={browser.folders}
                  files={browser.files}
                  selectedProviderId={browser.providerId}
                  isLeafFolder={(f) => !!f.isLeaf}
                  onFolderClick={browser.openFolder}
                  onFileClick={onSelectFile ? (file) => onSelectFile(file, browser.providerId, browser.currentPath) : undefined}
                />
              )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose}>{onSelectFolder ? "Cancel" : "Close"}</Button>
        {onSelectFolder && (
          <Button variant="contained" disabled={!browser.crumbs.length} onClick={() => onSelectFolder(browser.providerId, browser.currentPath, label)}>
            Use this folder
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
