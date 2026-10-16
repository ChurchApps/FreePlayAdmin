import { createRoot } from "react-dom/client";
import App from "./App";
import { EnvironmentHelper } from "./helpers";

EnvironmentHelper.init().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
