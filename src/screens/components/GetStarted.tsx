import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { CheckCircle as DoneIcon, RadioButtonUnchecked as TodoIcon } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { TextAction } from "../../components/ui";

export interface GetStartedStep {
  title: string;
  detail: string;
  done: boolean;
  verb?: { label: string; to?: string; onClick?: () => void };
}

const HIDE_KEY = "freeplay.getStarted.hidden";

const readHidden = () => {
  try { return localStorage.getItem(HIDE_KEY) === "1"; } catch { return false; }
};

export const GetStarted: React.FC<{ steps: GetStartedStep[] }> = ({ steps }) => {
  const [hidden, setHidden] = React.useState(readHidden);
  if (hidden || steps.every((s) => s.done)) return null;

  const hide = () => {
    setHidden(true);
    try { localStorage.setItem(HIDE_KEY, "1"); } catch { /* storage unavailable */ }
  };

  return (
    <Box data-testid="get-started">
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
        <Typography variant="h3" component="h2">Get started</Typography>
        <TextAction small onClick={hide}>Hide</TextAction>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
        {steps.map((s) => (
          <Stack key={s.title} direction="row" spacing={1.5} alignItems="flex-start" sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: "var(--b1-radius-control)", bgcolor: s.done ? "transparent" : "var(--b1-wash)" }}>
            {s.done ? <DoneIcon sx={{ color: "var(--b1-success)" }} /> : <TodoIcon sx={{ color: "text.secondary" }} />}
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, color: s.done ? "text.secondary" : "text.primary" }}>{s.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {s.detail}
                {!s.done && s.verb && (
                  <>
                    {" · "}
                    {s.verb.to
                      ? <TextAction small component={RouterLink} to={s.verb.to}>{s.verb.label}</TextAction>
                      : <TextAction small onClick={s.verb.onClick}>{s.verb.label}</TextAction>}
                  </>
                )}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>
    </Box>
  );
};
