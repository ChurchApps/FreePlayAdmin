import { CommonEnvironmentHelper, ApiHelper, Locale } from "@churchapps/apphelper";

export class EnvironmentHelper {
  static B1AdminUrl = "";

  static get Common() { return CommonEnvironmentHelper; }

  static init = async () => {
    const stage = process.env.REACT_APP_STAGE;
    EnvironmentHelper.Common.init(stage || "");
    EnvironmentHelper.B1AdminUrl = stage === "prod" ? "https://admin.b1.church" : "https://admin.staging.b1.church";

    ApiHelper.apiConfigs = [
      { keyName: "MembershipApi", url: CommonEnvironmentHelper.MembershipApi, jwt: "", permissions: [] },
      { keyName: "MessagingApi", url: CommonEnvironmentHelper.MessagingApi, jwt: "", permissions: [] },
      { keyName: "DoingApi", url: CommonEnvironmentHelper.DoingApi, jwt: "", permissions: [] }
    ];

    await Locale.init([`/locales/{{lng}}.json?v=1`, `/apphelper/locales/{{lng}}.json`]);
  };
}
