import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import App from "./App";

import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import StaffLayout from "./layouts/StaffLayout";
import CustomerLayout from "./layouts/CustomerLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import Menu from "./pages/admin/Menu";
import Billing from "./pages/admin/Billing";

import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOrders from "./pages/staff/StaffOrders";
import StaffProfile from "./pages/staff/StaffProfile";

import CustomerMenu from "./pages/customer/CustomerMenu";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerCart from "./pages/customer/CustomerCart";
import CustomerProfile from "./pages/customer/CustomerProfile";

import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppLayout />}>

      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="menu" element={<Menu />} />
        <Route path="billing" element={<Billing />} />
      </Route>

      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRole="staff">
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="orders" element={<StaffOrders />} />
        <Route path="profile" element={<StaffProfile />} />
      </Route>

      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRole="customer">
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="menu" element={<CustomerMenu />} />
        <Route path="orders" element={<CustomerOrders />} />
        <Route path="cart" element={<CustomerCart />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

    </Route>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App>
      <RouterProvider router={router} />
    </App>
  </StrictMode>
);
