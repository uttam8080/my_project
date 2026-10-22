import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import MainLayout from "./components/layout/MainLayout";
import Career from "./pages/career";
import Contact from "./pages/contact";
import About from "./pages/about";
import CancellationPolicyPage from "./pages/CancellationPolicy";
import PrivacyPolicyPage from "./pages/PrivacyPolicy";
import Service from "./services/index.jsx";
import Product from "./pages/product";
import OAuthRedirect from "./pages/OAuthRedirect";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import MySites from "./pages/dashboard/MySites";
import Domains from "./pages/dashboard/Domains";
import Billing from "./pages/dashboard/Billing";
import Settings from "./pages/dashboard/Settings";
import BuilderPage from "./pages/builder/BuilderPage";

import DeployWizard from "./pages/deploy/DeployWizard";
import DomainStep from "./pages/deploy/DomainStep";
import PaymentStep from "./pages/deploy/PaymentStep";
import DeploymentProgress from "./pages/deploy/DeploymentProgress";
import DeploySuccess from "./pages/deploy/DeploySuccess";
import MagicLogin from "./pages/MagicLogin";


const routing = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="product" element={<Product />} />
          <Route path="/service" element={<Service />} />
          <Route path="career" element={<Career />} />
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
          <Route path="cancellation" element={<CancellationPolicyPage />} />
          <Route path="privacypolicy" element={<PrivacyPolicyPage />} />

        </Route>

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<MySites />} />
          <Route path="sites" element={<MySites />} />
          <Route path="domains" element={<Domains />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Full-screen builder route ( outside MainLayout ) */}
        <Route path="/builder/:siteId" element={<BuilderPage />} />

        <Route path="/deploy/:siteId" element={<DeployWizard />}>
          <Route index element={<DomainStep />} />
          <Route path="domain" element={<DomainStep />} />
          <Route path="payment" element={<PaymentStep />} />
          <Route path="progress" element={<DeploymentProgress />} />
          <Route path="success" element={<DeploySuccess />} />
        </Route>

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        {/* OAuth callback — no layout wrapper */}
        <Route path="/redirect" element={<OAuthRedirect />} />
        {/* Magic Login — deep link bridge for email clients */}
        <Route path="/magic-login" element={<MagicLogin />} />
      </Routes>
    </Router>
  );
};

export default routing;
