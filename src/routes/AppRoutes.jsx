import { Route, Routes } from "react-router-dom";

import Home from "../pages/public/Home";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ChooseRole from "../pages/auth/ChooseRole";

import UserDashboard from "../pages/user/UserDashboard";
import ProviderDashboard from "../pages/provider/ProviderDashboard";

import ComingSoon from "../pages/common/ComingSoon";

import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminComingSoon from "../pages/admin/AdminComingSoon";
import HowItWorks from "../pages/public/HowItWorks";
import Activities from "../pages/public/Activities";
import Safety from "../pages/public/Safety";
import Contact from "../pages/public/Contact";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/choose-role" element={<ChooseRole />} />

      <Route path="/app/user/dashboard" element={<UserDashboard />} />
      <Route
        path="/app/user/search"
        element={<ComingSoon type="user" title="Search Providers" />}
      />
      <Route
        path="/app/user/bookings"
        element={<ComingSoon type="user" title="User Bookings" />}
      />
      <Route
        path="/app/user/wallet"
        element={<ComingSoon type="user" title="Wallet & Payments" />}
      />

      <Route path="/app/provider/dashboard" element={<ProviderDashboard />} />
      <Route
        path="/app/provider/services"
        element={<ComingSoon type="provider" title="Services & Pricing" />}
      />
      <Route
        path="/app/provider/availability"
        element={<ComingSoon type="provider" title="Availability Calendar" />}
      />
      <Route
        path="/app/provider/bookings"
        element={<ComingSoon type="provider" title="Booking Requests" />}
      />
      <Route
        path="/app/provider/earnings"
        element={<ComingSoon type="provider" title="Earnings & Payouts" />}
      />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route
        path="/admin/users"
        element={<AdminComingSoon title="Manage Users" />}
      />
      <Route
        path="/admin/providers"
        element={<AdminComingSoon title="Manage Providers" />}
      />
      <Route
        path="/admin/kyc"
        element={<AdminComingSoon title="KYC Approvals" />}
      />
      <Route
        path="/admin/payments"
        element={<AdminComingSoon title="Payments, Refunds & Payouts" />}
      />
      <Route
        path="/admin/reports"
        element={<AdminComingSoon title="Reports & Disputes" />}
      />
      <Route path="/" element={<Home />} />
<Route path="/how-it-works" element={<HowItWorks />} />
<Route path="/activities" element={<Activities />} />
<Route path="/safety" element={<Safety />} />
<Route path="/contact" element={<Contact />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}