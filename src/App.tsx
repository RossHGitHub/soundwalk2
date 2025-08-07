import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Gigs from "./pages/Gigs";
import MediaPage from "./pages/Media";
import ContactPage from "./pages/Contact";
//import Admin from "./pages/Admin";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="Gigs" element={<Gigs />} />
        <Route path="Contact" element={<ContactPage />} />
        <Route path="Media" element={<MediaPage />} />
      </Route>
    </Routes>
  );
}

export default App;
