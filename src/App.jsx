import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TestDataPage from "./pages/TestPage/TestPage";
import Home from "./pages/HomePage/Home";
import { Layout } from "./pages/Layout/Layout";
import { LoginPage } from "./pages/Login/LoginPage";
import { CheckSite } from "./pages/CheckSitePage/checksite";
import WelcomePage from "./pages/WelcomePage/WelcomePage";

function App() {
  const [user, setUser] = useState({});
  useEffect(() => {
    const theUser = localStorage.getItem("user");

    if (theUser && !theUser.includes("undefined")) {
      setUser(JSON.parse(theUser));
    }
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={user?.email ? <Home /> : <WelcomePage />} />
          <Route path="/testdatapage" element={<TestDataPage />} />
          <Route
            path="/login"
            element={user?.email ? <Navigate to="/" /> : <LoginPage />}
          />
          <Route
            path="/checksite"
            element={user?.email ? <CheckSite /> : <Navigate to="/" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
