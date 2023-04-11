import React from "react";
import { Link, Navigate } from "react-router-dom";
import "./welcome-style.css";

const WelcomePage = () => {
  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h1>Dear user!</h1>
      <p>
        Welcome to SITETESTER, before start to use our service, log in Softteco
        Account
      </p>

      <div>
        <Link to="/login" className="login__button">
          Log in
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;
