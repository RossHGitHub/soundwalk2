import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Gigs from "./pages/Gigs";
import MediaPage from "./pages/Media";
import ContactPage from "./pages/Contact";
import Admin from "./pages/Admin";
import Login from "./pages/login";
import ProtectedRoute from "./components/protectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="gigs" element={<Gigs />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>
  );
}

export default App;
