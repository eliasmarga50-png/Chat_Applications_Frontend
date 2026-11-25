
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "../context/useAuth";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Chat from "../pages/Chat";
import Developer from "../pages/Developer";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "./ProtectedRoute";

function HomeRedirect() {
  const { isAuthenticated } = useAuth();

  return (
    <Navigate
      to={isAuthenticated ? "/chat" : "/login"}
      replace
    />
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:slug" element={<Chat />} />

          <Route
            path="/developer"
            element={<Developer />}
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
