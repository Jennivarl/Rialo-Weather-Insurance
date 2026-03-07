import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { GetQuotePage } from "./pages/GetQuotePage";
import { DashboardPage } from "./pages/DashboardPage";
import { ClaimsPage } from "./pages/ClaimsPage";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "quote", Component: GetQuotePage },
      { path: "dashboard", Component: DashboardPage },
      { path: "claims", Component: ClaimsPage },
    ],
  },
]);
