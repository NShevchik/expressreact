import React, { useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import "./layout-style.css";

export const Layout = () => {
  const pathname = useLocation().pathname;

  const homeClass =
    pathname === "/" ? "layout__button _active" : "layout__button";
  const testDataClass =
    pathname === "/testdatapage" ? "layout__button _active" : "layout__button";
  const loginClass =
    pathname === "/login" ? "layout__button _active" : "layout__button";
  const checkSiteClass =
    pathname === "/checksite" ? "layout__button _active" : "layout__button";

  return (
    <>
      <header style={{ textAlign: "center" }}>
        <h1>Welcome to SITESTER</h1>
      </header>
      <main style={{ display: "flex", justifyContent: "center", gap: "2rem" }}>
        <Link to="/" className={homeClass}>
          Home
        </Link>
        <Link to="/testdatapage" className={testDataClass}>
          Test Page
        </Link>
        <Link to="/login" className={loginClass}>
          Log in Page
        </Link>
        <Link to="/checksite" className={checkSiteClass}>
          Check Web Site
        </Link>
      </main>
      <Outlet />
    </>
  );
};
