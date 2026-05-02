import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BookingProvider } from "./context/BookingContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BookingProvider>
    <App />
  </BookingProvider>
);
