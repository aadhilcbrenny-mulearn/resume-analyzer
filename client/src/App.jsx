import { Link, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Result from "./pages/Result.jsx";
import History from "./pages/History.jsx";

export default function App() {
  return (
    <>
      <header className="top">
        <Link className="brand" to="/">Resume<mark>Check</mark></Link>
        <nav>
          <NavLink to="/">New analysis</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<p className="muted">Page not found. <Link to="/">Go home</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
