import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import About from './pages/About';
import HomePage from './pages/HomePage';
import CreateUserPage from './pages/CreateUserPage';
import ChangeUsername from './pages/ChangeUsername';
import ChangePassword from './pages/ChangePassword';
import UserLanding from './pages/UserLanding';
import UserProfile from './pages/UserProfile';
import CatalogInput from './pages/CatalogInput';
import EditUserInfo from './pages/EditUserInfo';
import ImageUpload from './pages/UploadImage';
import SponsorLanding from './pages/SponsorLanding';
import SponsorProfile from './pages/SponsorProfile';
import SponsorCreateUserPage from './pages/SponsorCreateUserPage';
import AdminLanding from './pages/AdminLanding';
import AdminCreateUserPage from './pages/AdminCreateUserPage';
import AdminProfile from './pages/AdminProfile';
import DriverApplication from './pages/DriverApplication';
import SponsorApplications from './pages/SponsorApplications';
import AdminCreateOrg from './pages/AdminCreateOrg';
import CatalogDisplay from './pages/CatalogDisplay';
import CartPage from './pages/CartPage';
import SponsorUserList from './pages/SponsorUserList';
import SponsorEditUser from './pages/SponsorEditUser';
import ApplicationConfirmation from './pages/ApplicationConfirmation';
import SponsorPoints from "./pages/SponsorPoints"
import SponsorTimeFrame from './pages/SponsorTimeFrame';
import AdminReport from './pages/AdminReport';
import Checkout from './pages/Checkout';
import UserPoints from './pages/UserPoints';
import SponsorReport from './pages/SponsorReport';
import SponsorPurchase from'./pages/SponsorPurchase';
import SponsorCartPage from './pages/SponsorCartPage';
import AdminUserList from './pages/AdminUserList';
import AdminEditUser from './pages/AdminEditUser';
import AdminAssignSponsor from './pages/AdminAssignSponsor';
import TermsAndConditions from './pages/TermsAndConditions';
import AdminNotify from './pages/AdminNotify';
import DrivingTips from './pages/DrivingTips';
import ApplicationStatusList from './pages/ApplicationStatusList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/user/create" element={<CreateUserPage />} />
        <Route path="/user/modify/username" element={<ChangeUsername />} />
        <Route path="/user/modify/password" element={<ChangePassword />} />
        <Route path="/user/landing" element={<UserLanding />} />
        <Route path="/user/profile" element={<UserProfile />} />
        <Route path="/sponsor/catalog/input" element={<CatalogInput />} /> 
        <Route path="/user/modify/name" element={<EditUserInfo type="name" />} />
        <Route path="/user/modify/phone" element={<EditUserInfo type="phone" />} />
        <Route path="/user/modify/email" element={<EditUserInfo type="email" />} />
        <Route path="/user/modify/shipping-address" element={<EditUserInfo type="shipping" />} />
        <Route path="/user/modify/bio" element={<EditUserInfo type="bio" />} />
        <Route path="/user/modify/truck-info" element={<EditUserInfo type="truck-info" />} />
        <Route path="/user/upload/pfp" element={<ImageUpload />} />
        <Route path="/sponsor/landing" element={<SponsorLanding />} />
        <Route path="/sponsor/profile" element={<SponsorProfile />} />
        <Route path="/sponsor/create" element={<SponsorCreateUserPage />} />
        <Route path="/admin/landing" element={<AdminLanding />} />
        <Route path="/admin/create" element={<AdminCreateUserPage />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/user/application/submit" element={<DriverApplication />} />
        <Route path="/sponsor/applications" element={<SponsorApplications />} />
        <Route path="/admin/create-org" element={<AdminCreateOrg />} />
        <Route path="/catalog/display" element={<CatalogDisplay />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/sponsor/users" element={<SponsorUserList />} />
        <Route path="/sponsor/edit-user/:userId/:userType" element={<SponsorEditUser />} />
        <Route path="/user/application-confirmation" element={<ApplicationConfirmation />} />
        <Route path="/sponsor/points" element={<SponsorPoints />} />
        <Route path="/sponsor/timeframe" element={<SponsorTimeFrame />} />
        <Route path="/admin/reports" element={<AdminReport />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/user/points" element={<UserPoints />} />
        <Route path="/sponsor/reports" element={<SponsorReport />} />
        <Route path="/sponsor/purchase" element={<SponsorPurchase />} />
        <Route path="/sponsor/cart" element={<SponsorCartPage />} />
        <Route path="/admin/users" element={<AdminUserList />} />
        <Route path="/admin/edit-user/:userId/:userType" element={<AdminEditUser />} />
        <Route path="/admin/assign-sponsor" element={<AdminAssignSponsor />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/admin/notify" element={<AdminNotify />} />
        <Route path="/driving-tips" element={<DrivingTips />} />
        <Route path="/user/application/status" element={<ApplicationStatusList />} />
      </Routes>
    </Router>
  );
}

export default App;