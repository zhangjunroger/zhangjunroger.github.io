import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LabPage from "@/pages/LabPage";
import ClassroomPage from "@/pages/ClassroomPage";
import JoinPage from "@/pages/JoinPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="/lab/:expId" element={<LabPage />} />
        <Route path="/classroom" element={<ClassroomPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
      </Routes>
    </Router>
  );
}
