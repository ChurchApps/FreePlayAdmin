import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { Box } from "@mui/material";
import { LoginPage } from "@churchapps/apphelper/login";
import UserContext from "./UserContext";

export const Login: React.FC = () => {
  const [errors] = React.useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const context = React.useContext(UserContext);
  const [cookies] = useCookies(["jwt"]);

  const search = new URLSearchParams(window.location.search);
  const fromLocation = location.state?.from;
  const fromUrl = fromLocation ? fromLocation.pathname + (fromLocation.search || "") : null;
  const returnUrl = search.get("returnUrl") || fromUrl || "/screens";

  const jwt = search.get("jwt") || cookies.jwt || "";
  const auth = search.get("auth") || "";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ mx: "auto" }}>
        <LoginPage
          auth={auth}
          context={context!}
          jwt={jwt}
          appName="FreePlay"
          appUrl={window.location.href}
          callbackErrors={errors}
          returnUrl={returnUrl}
          handleRedirect={(url: string) => navigate(url)}
        />
      </Box>
    </Box>
  );
};
