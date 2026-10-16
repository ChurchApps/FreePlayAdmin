import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import { MANUAL_CONTENT_TYPE, SCREEN_CONTENT_TYPE, type DeviceInterface, type ScreenGroup } from "../../helpers";

export type ScreenMode = "scheduled" | "manual";

export const NEW_GROUP = "__new";

export const ensureGroup = async (groupId: string, newGroupName: string): Promise<string> => {
  if (groupId !== NEW_GROUP) return groupId;
  const saved: ScreenGroup[] = await ApiHelper.post("/screenGroups", [{ name: newGroupName.trim() }], "DoingApi");
  return saved?.[0]?.id || "";
};

export const modeQuery = (mode: ScreenMode, groupId: string) => (mode === "scheduled"
  ? `?contentType=${SCREEN_CONTENT_TYPE}&contentId=${encodeURIComponent(groupId)}`
  : `?contentType=${MANUAL_CONTENT_TYPE}`);

const churchId = () => UserHelper.currentUserChurch?.church?.id || "";

// The pair route answers { success } only, so find the device it just claimed: matching mode, most recently enrolled.
const findPairedDevice = async (mode: ScreenMode, groupId: string): Promise<DeviceInterface | null> => {
  const devices: DeviceInterface[] = await ApiHelper.get("/devices/" + churchId(), "MessagingApi");
  const matches = (devices || []).filter((d) => (mode === "scheduled" ? d.contentType === SCREEN_CONTENT_TYPE && d.contentId === groupId : d.contentType === MANUAL_CONTENT_TYPE));
  matches.sort((a, b) => new Date(b.lastActiveDate || 0).getTime() - new Date(a.lastActiveDate || 0).getTime());
  return matches[0] || null;
};

export const pairScreen = async (code: string, mode: ScreenMode, groupId: string, label: string): Promise<boolean> => {
  const data = await ApiHelper.get("/devices/pair/" + code + modeQuery(mode, groupId), "MessagingApi");
  if (!data?.success) return false;
  if (label.trim()) {
    const id = data.device?.id || data.id;
    const device: DeviceInterface | null = id ? await ApiHelper.get(`/devices/${churchId()}/${id}`, "MessagingApi") : await findPairedDevice(mode, groupId);
    if (device?.id) await ApiHelper.post("/devices", [{ ...device, label: label.trim() }], "MessagingApi");
  }
  return true;
};

export const saveScreen = async (id: string, changes: { label: string; mode: ScreenMode; groupId: string }) => {
  const device: DeviceInterface = await ApiHelper.get(`/devices/${churchId()}/${id}`, "MessagingApi");
  if (!device?.id) return;
  const contentType = changes.mode === "scheduled" ? SCREEN_CONTENT_TYPE : MANUAL_CONTENT_TYPE;
  const contentId = changes.mode === "scheduled" ? changes.groupId : "";
  await ApiHelper.post("/devices", [{ ...device, label: changes.label.trim(), contentType, contentId }], "MessagingApi");
};

export const unpairScreen = (id: string) => ApiHelper.delete(`/devices/${churchId()}/${id}`, "MessagingApi");
