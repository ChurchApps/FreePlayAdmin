import { useCallback, useEffect, useRef, useState } from "react";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { getProvider, type DeviceAuthorizationResponse, type IProvider, type ProviderInfo } from "@churchapps/content-providers";
import { ContentProviderAuthHelper } from "../helpers";
import { type AuthStatus } from "./AuthFlowDialog";

// Same device-flow / PKCE-popup flow as B1Admin's ContentProviderAuthManager, stored at church level.
export const useProviderConnect = (providers: ProviderInfo[], onLinked: () => void) => {
  const [authProviderId, setAuthProviderId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [deviceFlowData, setDeviceFlowData] = useState<DeviceAuthorizationResponse | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    generation.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  const fail = (message: string) => {
    setAuthError(message);
    setAuthStatus("error");
  };

  const succeed = (isCancelled: () => boolean) => {
    setAuthStatus("success");
    onLinked();
    timer.current = setTimeout(() => {
      if (isCancelled()) return;
      setAuthProviderId(null);
      setAuthStatus("idle");
      setDeviceFlowData(null);
    }, 2000);
  };

  const startDeviceFlow = async (provider: IProvider) => {
    if (!provider.initiateDeviceFlow || !provider.pollDeviceFlowToken) return fail(Locale.label("plans.contentProviderAuth.deviceFlowUnsupported"));
    const response = await provider.initiateDeviceFlow();
    if (!response) return fail(Locale.label("plans.contentProviderAuth.deviceFlowFailed"));
    setDeviceFlowData(response);
    setAuthStatus("device_flow");

    cancel();
    const gen = generation.current;
    const isCancelled = () => gen !== generation.current;
    let interval = response.interval || 5;
    const poll = async () => {
      if (isCancelled()) return;
      try {
        const result = await provider.pollDeviceFlowToken!(response.device_code);
        if (isCancelled()) return;
        if (result && "access_token" in result) {
          await ContentProviderAuthHelper.storeAuth(provider.id, result);
          if (!isCancelled()) succeed(isCancelled);
          return;
        }
        if (result && "error" in result && (result.error === "authorization_pending" || result.error === "slow_down")) {
          if (result.error === "slow_down") interval += 5;
          timer.current = setTimeout(poll, interval * 1000);
          return;
        }
        fail((result as { error_description?: string; error?: string })?.error_description || (result as { error?: string })?.error || Locale.label("plans.contentProviderAuth.authExpired"));
      } catch {
        if (!isCancelled()) fail(Locale.label("plans.contentProviderAuth.authFailed"));
      }
    };
    timer.current = setTimeout(poll, interval * 1000);
  };

  const startPkce = async (provider: IProvider) => {
    if (!provider.generateCodeVerifier || !provider.buildAuthUrl) return fail(Locale.label("plans.contentProviderAuth.pkceUnsupported"));
    const relay = await ApiHelper.post("/oauth/relay/sessions", { provider: provider.id }, "MembershipApi");
    if (!relay?.sessionCode || !relay?.redirectUri) return fail(Locale.label("plans.contentProviderAuth.sessionFailed"));
    const { sessionCode, redirectUri, expiresIn } = relay;
    const verifier = provider.generateCodeVerifier.call(provider);
    const authResult = await provider.buildAuthUrl.call(provider, verifier, redirectUri, sessionCode);
    const width = 600, height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(authResult.url, "oauth_popup", `width=${width},height=${height},left=${left},top=${top},popup=yes`);
    if (!popup) return fail(Locale.label("plans.contentProviderAuth.popupBlocked"));
    popupRef.current = popup;
    setAuthStatus("pkce_waiting");

    cancel();
    const gen = generation.current;
    const isCancelled = () => gen !== generation.current;
    const expiresAt = Date.now() + (expiresIn || 300) * 1000;
    const poll = async () => {
      if (isCancelled()) return;
      if (popup.closed) {
        setAuthStatus("idle");
        setAuthProviderId(null);
        return;
      }
      if (Date.now() >= expiresAt) {
        popup.close();
        return fail(Locale.label("plans.contentProviderAuth.sessionExpired"));
      }
      try {
        const result = await ApiHelper.getAnonymous(`/oauth/relay/sessions/${sessionCode}`, "MembershipApi");
        if (isCancelled()) return;
        if (result?.status === "completed" && result?.authCode) {
          popup.close();
          const ok = await ContentProviderAuthHelper.exchangeCode(provider.id, result.authCode, verifier, redirectUri);
          if (isCancelled()) return;
          if (ok) succeed(isCancelled);
          else fail(Locale.label("plans.contentProviderAuth.tokenExchangeFailed"));
          return;
        }
        timer.current = setTimeout(poll, 3000);
      } catch {
        if (!isCancelled()) timer.current = setTimeout(poll, 5000);
      }
    };
    timer.current = setTimeout(poll, 3000);
  };

  const connect = useCallback(async (providerId: string) => {
    const info = providers.find((p) => p.id === providerId);
    if (!info) return;
    if (!info.requiresAuth) {
      const now = Math.floor(Date.now() / 1000);
      await ContentProviderAuthHelper.storeAuth(providerId, { access_token: "public_api", refresh_token: "", token_type: "none", created_at: now, expires_in: 60 * 60 * 24 * 365 * 10, scope: "" });
      onLinked();
      return;
    }
    const provider = getProvider(providerId);
    if (!provider) return;
    setAuthProviderId(providerId);
    setAuthStatus("loading");
    setAuthError(null);
    setDeviceFlowData(null);
    try {
      if (provider.authTypes.includes("device_flow")) await startDeviceFlow(provider);
      else if (provider.authTypes.includes("oauth_pkce")) await startPkce(provider);
      else fail(Locale.label("plans.contentProviderAuth.pkceUnsupported"));
    } catch {
      fail(Locale.label("plans.contentProviderAuth.startAuthFailed"));
    }
  }, [providers, onLinked]);

  const close = useCallback(() => {
    cancel();
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    popupRef.current = null;
    setAuthProviderId(null);
    setAuthStatus("idle");
    setDeviceFlowData(null);
    setAuthError(null);
  }, [cancel]);

  const provider = providers.find((p) => p.id === authProviderId) || null;

  return { connect, close, provider, authStatus, deviceFlowData, authError, retry: () => { if (authProviderId) connect(authProviderId); } };
};
