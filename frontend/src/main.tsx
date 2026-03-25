
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import App from "./app/App.tsx";
import "./styles/index.css";

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID as string;

if (!privyAppId) {
  console.error(
    "[PayOnRain] VITE_PRIVY_APP_ID is not set in frontend/.env\n" +
    "Get your App ID at https://dashboard.privy.io and add it:\n" +
    "VITE_PRIVY_APP_ID=your-app-id-here"
  );
}

createRoot(document.getElementById("root")!).render(
  <PrivyProvider
    appId={privyAppId || "placeholder-replace-me"}
    config={{
      appearance: {
        theme: "dark",
        accentColor: "#0EA5E9",
      },
      loginMethods: ["email", "wallet"],
      embeddedWallets: {
        solana: {
          createOnLogin: "users-without-wallets",
        },
      },
      externalWallets: {
        solana: {
          connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }),
        },
      },
    }}
  >
    <App />
  </PrivyProvider>
);
