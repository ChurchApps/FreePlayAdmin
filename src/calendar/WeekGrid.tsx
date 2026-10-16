import React from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { END_BEHAVIOR_SHORT, TARGET_COLORS, formatWallTime, wallDateKey, type Occurrence, type ScheduleEntry } from "../helpers";

const START_HOUR = 6;
const END_HOUR = 22;
const ROW = 28;
const SLOTS = (END_HOUR - START_HOUR) * 2;
const DAY_MS = 86400000;

interface Props {
  weekStart: Date;
  today: Date;
  occurrences: Occurrence[];
  hasDefaultLoop: boolean;
  describe: (entry: ScheduleEntry) => string;
  onSelect: (entry: ScheduleEntry) => void;
  onEmptyClick: (day: Date, minutes: number) => void;
}

export const hatchSx = { backgroundImage: "repeating-linear-gradient(135deg, var(--b1-wash) 0 4px, transparent 4px 8px)" };

const slotLabel = (slot: number) => {
  const minutes = START_HOUR * 60 + slot * 30;
  const h = Math.floor(minutes / 60);
  return `${h % 12 || 12}:${(minutes % 60).toString().padStart(2, "0")}${slot === 0 ? (h < 12 ? " AM" : " PM") : ""}`;
};

export const WeekGrid: React.FC<Props> = ({ weekStart, today, occurrences, hasDefaultLoop, describe, onSelect, onEmptyClick }) => {
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS));
  const todayKey = wallDateKey(today);

  const segmentsFor = (day: Date) => {
    const dayStart = day.getTime() + START_HOUR * 3600000;
    const dayEnd = day.getTime() + END_HOUR * 3600000;
    return occurrences
      .filter((o) => o.start.getTime() < dayEnd && o.end.getTime() > dayStart)
      .map((o) => {
        const top = Math.max(o.start.getTime(), dayStart);
        const bottom = Math.min(o.end.getTime(), dayEnd);
        return { o, top: ((top - dayStart) / 1800000) * ROW, height: Math.max(((bottom - top) / 1800000) * ROW, 14) };
      });
  };

  const nowOffset = (() => {
    const mins = today.getUTCHours() * 60 + today.getUTCMinutes() - START_HOUR * 60;
    return mins >= 0 && mins <= (END_HOUR - START_HOUR) * 60 ? (mins / 30) * ROW : null;
  })();

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "56px repeat(7, minmax(96px, 1fr))", minWidth: 760 }} data-testid="week-grid">
        <Box sx={{ borderBottom: 1, borderColor: "divider" }} />
        {days.map((d) => {
          const isToday = wallDateKey(d) === todayKey;
          return (
            <Box key={d.getTime()} sx={{ py: 1, textAlign: "center", borderBottom: 1, borderLeft: 1, borderColor: "divider", typography: "body2", fontWeight: isToday ? 700 : 600, color: isToday ? "primary.main" : "text.secondary", bgcolor: isToday ? "var(--b1-selected)" : "transparent" }}>
              {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", timeZone: "UTC" })}
            </Box>
          );
        })}
        <Box>
          {Array.from({ length: SLOTS }, (_, s) => (
            <Box key={s} sx={{ height: ROW, pr: 1, textAlign: "right", typography: "caption", color: "text.secondary", lineHeight: "14px", transform: "translateY(-7px)" }}>{s % 2 === 0 || s === 0 ? slotLabel(s) : ""}</Box>
          ))}
        </Box>
        {days.map((d) => (
          <Box key={d.getTime()} sx={{ position: "relative", height: SLOTS * ROW, borderLeft: 1, borderColor: "divider", ...(hasDefaultLoop ? hatchSx : {}) }}>
            {Array.from({ length: SLOTS }, (_, s) => (
              <Box
                key={s}
                onClick={() => onEmptyClick(d, START_HOUR * 60 + s * 30)}
                sx={{ height: ROW, borderBottom: 1, borderColor: s % 2 === 1 ? "divider" : "transparent", borderBottomStyle: "solid", cursor: "pointer", "&:hover": { bgcolor: "var(--b1-hover)" } }}
              />
            ))}
            {wallDateKey(d) === todayKey && nowOffset !== null && <Box sx={{ position: "absolute", left: 0, right: 0, top: nowOffset, height: 2, bgcolor: "error.main", zIndex: 3, pointerEvents: "none" }} />}
            {segmentsFor(d).map(({ o, top, height }) => {
              const rule = o.entry.recurrenceRule ? "weekly" : "once";
              return (
                <ButtonBase
                  key={(o.entry.id || "") + o.start.getTime()}
                  onClick={(e) => { e.stopPropagation(); onSelect(o.entry); }}
                  data-testid="calendar-entry"
                  sx={{ position: "absolute", left: 3, right: 3, top: top + 1, height: height - 2, zIndex: 2, display: "block", textAlign: "left", overflow: "hidden", borderRadius: "4px", px: 0.75, py: 0.25, color: "#FFF", bgcolor: TARGET_COLORS[o.entry.targetType || "playlist"], boxShadow: "0 0 0 1px var(--b1-surface)" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: "16px" }} noWrap>{describe(o.entry)}</Typography>
                  {height > 30 && (
                    <Typography sx={{ fontSize: 11, lineHeight: "14px", opacity: 0.9 }}>
                      {`${formatWallTime(o.start)} – ${formatWallTime(o.end)} · ${rule} · ${END_BEHAVIOR_SHORT[o.entry.endBehavior || "loop"]}`}
                    </Typography>
                  )}
                </ButtonBase>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
