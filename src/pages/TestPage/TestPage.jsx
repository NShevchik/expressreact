import React from "react";
import { useEffect, useState } from "react";
import { API_URL } from "../../constants/constants";

const TestDataPage = () => {
  const [backendData, setBackendData] = useState([{}]);

  useEffect(() => {
    fetch(`${API_URL}/api`)
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data);
      });
  }, []);
  return (
    <div>
      {typeof backendData.users === "undefined" ? (
        <p>Loading...</p>
      ) : (
        backendData.users.map((user, i) => <p key={i}>{user}</p>)
      )}
    </div>
  );
};

export default TestDataPage;
