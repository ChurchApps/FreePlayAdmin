import { ApiHelper } from "@churchapps/apphelper";
import type { ContentProviderAuthData } from "@churchapps/content-providers";
import type { ContentProviderAuthInterface } from "./interfaces";

// FreePlay connects providers for the whole church: rows with no ministryId.
export class ContentProviderAuthHelper {
  static async getLinked(): Promise<ContentProviderAuthInterface[]> {
    try {
      const data = await ApiHelper.get("/contentProviderAuths/church", "DoingApi");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  static async getAuth(providerId: string): Promise<ContentProviderAuthInterface | null> {
    try {
      const record = await ApiHelper.get(`/contentProviderAuths/church/${providerId}`, "DoingApi");
      return record?.accessToken || record?.id ? record : null;
    } catch {
      return null;
    }
  }

  static async storeAuth(providerId: string, auth: ContentProviderAuthData): Promise<void> {
    const expiresAt = new Date((auth.created_at + auth.expires_in) * 1000);
    await ApiHelper.post(`/contentProviderAuths/church/${providerId}`, {
      accessToken: auth.access_token,
      refreshToken: auth.refresh_token,
      tokenType: auth.token_type,
      expiresAt,
      scope: auth.scope
    }, "DoingApi");
  }

  static async exchangeCode(providerId: string, code: string, codeVerifier: string, redirectUri: string): Promise<boolean> {
    try {
      const result = await ApiHelper.post("/contentProviderAuths/exchange", { providerId, code, codeVerifier, redirectUri }, "DoingApi");
      return !result?.error;
    } catch {
      return false;
    }
  }

  static async refresh(providerId: string): Promise<boolean> {
    try {
      const result = await ApiHelper.post("/contentProviderAuths/refresh", { providerId }, "DoingApi");
      return !!result && !result.error;
    } catch {
      return false;
    }
  }

  static async removeAuth(authId: string): Promise<void> {
    await ApiHelper.delete(`/contentProviderAuths/${authId}`, "DoingApi");
  }
}
