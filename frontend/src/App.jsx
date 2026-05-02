import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Step1Movie from "./pages/Step1Movie";
import Step2Showtime from "./pages/Step2Showtime";
import Step3Seats from "./pages/Step3Seats";
import Step4Food from "./pages/Step4Food";
import Step5CustomerDetails from "./pages/Step5CustomerDetails";
import Step6PaymentSummary from "./pages/Step6PaymentSummary";
import Step7Confirmation from "./pages/Step7Confirmation";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/step1" element={<Step1Movie />} />
        <Route path="/step2" element={<Step2Showtime />} />
        <Route path="/step3" element={<Step3Seats />} />
        <Route path="/step4" element={<Step4Food />} />
        <Route path="/step5" element={<Step5CustomerDetails />} />
        <Route path="/step6" element={<Step6PaymentSummary />} />
        <Route path="/step7" element={<Step7Confirmation />} />
      </Routes>
    </BrowserRouter>
  );
}
