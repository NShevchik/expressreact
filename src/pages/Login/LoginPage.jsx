import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../../hooks/hookFetch";
const google = window.google;

// https://developers.google.com/identity/gsi/web/reference/js-reference

export const LoginPage = () => {
  const { handleGoogle, loading, error } = useFetch(
    "http://localhost:5000/login"
  );

  useEffect(() => {
    // /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id:
          "1084790864810-i4ik45g29hsubr09c28u4f7sv7bvmomm.apps.googleusercontent.com",
        callback: handleGoogle,
      });

      google.accounts.id.renderButton(document.getElementById("loginDiv"), {
        theme: "filled_black",
        text: "signin_with",
        shape: "pill",
        locale: "uk",
      });
      // google.accounts.id.prompt();
    }
  }, [handleGoogle]);

  return (
    <>
      <header style={{ textAlign: "center" }}>
        <h1>Login to continue</h1>
      </header>
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading ? <div>Loading....</div> : <div id="loginDiv"></div>}
      </main>
      <footer></footer>
    </>
  );
};
