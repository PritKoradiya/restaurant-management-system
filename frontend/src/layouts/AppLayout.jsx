import { Outlet } from "react-router-dom";

function AppLayout() {
  // layout simply passes through routing; shared state is now provided by App.jsx
  return <Outlet />;
}

export default AppLayout;