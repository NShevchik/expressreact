import React, { useEffect, useState } from "react";

const Home = () => {
  const [user, setUser] = useState({});
  const logout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };
  useEffect(() => {
    const theUser = localStorage.getItem("user");

    if (theUser && !theUser.includes("undefined")) {
      setUser(JSON.parse(theUser));
    }
  }, []);
  return (
    <div style={{ textAlign: "center", margin: "3rem" }}>
      <h1>Dear {user?.email}</h1>

      <p>
        You are viewing this page because you are logged in or you just signed
        up
      </p>

      <div>
        <button
          onClick={logout}
          style={{
            color: "red",
            border: "1px solid gray",
            backgroundColor: "white",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;
