import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Step1 from "./pages/Step1Movie";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/step1" element={<Step1 />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
