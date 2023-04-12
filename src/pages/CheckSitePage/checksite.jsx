import React, { useState } from "react";
import axios from "axios";
import { API_URL, urlRegex } from "../../constants/constants";
import download from "downloadjs";
import "./checksite-style.css";
import { FallingLines } from "react-loader-spinner";

export const CheckSite = () => {
  const [inputValue, setInputValue] = useState("");
  const [waitingResponse, setWaitingResponse] = useState(false);
  const [pdfLink, setPdfLink] = useState("");
  const [apiError, setApiError] = useState("");
  function sendLogin(e) {
    if (waitingResponse) {
      e.preventDefault();
      return;
    }
    setApiError("");
    const requiredInputText = document.querySelector(".checker__status");
    e.preventDefault();
    if (inputValue.match(urlRegex)) {
      setWaitingResponse(true);
      axios
        .post(
          `${API_URL}/check`,
          { url: inputValue },
          { withCredentials: true }
        )
        .then((res) => {
          setWaitingResponse(false);
          const content = res.headers["content-type"];
          download(res.data, "report", content);
          const url = URL.createObjectURL(
            new Blob([res.data], { type: "application/pdf" })
          );
          setPdfLink(url);
        })
        .catch((error) => {
          setApiError(error.message);
          console.log(error);
          setWaitingResponse(false);
        });
    } else {
      requiredInputText.innerHTML = "Invalid url";
    }
  }
  return (
    <div className="container">
      <div className="checker">
        <form onSubmit={sendLogin} className="checker__form">
          <input
            className="checker__input"
            type="text"
            placeholder="Site url..."
            value={inputValue}
            onChange={(event) => {
              const requiredInputText =
                document.querySelector(".checker__status");
              requiredInputText.innerHTML = "";
              setInputValue(event.target.value);
              setApiError("");
            }}
          />
          <p className="checker__error">{apiError}</p>
          <p className="checker__status"></p>
          {waitingResponse ? (
            <>
              <div className="checker__loading">
                <FallingLines
                  color="#b2d6e3"
                  width="24"
                  visible={true}
                  ariaLabel="falling-lines-loading"
                />
                <p className="checker__status">Building PDF report..</p>
              </div>
              <p className="checker__status checker__status_s">
                It may take up to 5 minutes
              </p>
            </>
          ) : (
            <button className="check__button">Send</button>
          )}
        </form>
        <button
          className="check__button"
          onClick={() => {
            axios.get(`${API_URL}/pdf`).then((res) => {
              const content = res.headers["content-type"];
              download(res.data, "testfrompdf", content);
            });
          }}
        >
          Get Test PDF
        </button>
        {pdfLink ? (
          <a href={pdfLink} download={true} className="checker__link">
            Download didn't started? Click here
          </a>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

// export const CheckSite = () => {
//   // const [loginStatus, setLoginStatus] = useState(false);
//   // const [serverData, setServerDate] = useState();
//   const [inputValue, setInputValue] = useState("");
//   const [waitingResponse, setWaitingResponse] = useState(false);
//   const urlRegex =
//     /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
//   function sendLogin(e) {
//     const requiredInputText = document.querySelector(".requiredSiteUrl");
//     e.preventDefault();
//     if (inputValue.match(urlRegex)) {
//       setWaitingResponse(true);
//       axios.post("/check", { url: inputValue }).then((res) => {
//         setWaitingResponse(false);
//         console.log(res.data);
//       });
//       //   setLoginStatus(true);
//       //   axios.get("/auth/google/callback").then((response) => {
//       //     setLoginStatus(false);
//       //     setServerDate(response.data);
//       //   });
//       //   axios
//       //     .post(`/user?name=${inputValue}`, { name: inputValue })
//       //     .then((response) => {
//       //       console.log(response.data);
//       //     })
//       //     .catch((error) => {
//       //       console.log(error);
//       //     });
//     } else {
//       requiredInputText.innerHTML = "Invalid url";
//     }
//   }
//   return (
//     <div>
//       <form onSubmit={sendLogin}>
//         <input
//           type="text"
//           placeholder="Site url..."
//           value={inputValue}
//           onChange={(event) => {
//             const requiredInputText =
//               document.querySelector(".requiredSiteUrl");
//             requiredInputText.innerHTML = "";
//             setInputValue(event.target.value);
//           }}
//         />
//         <p className="requiredSiteUrl"></p>
//         {waitingResponse ? <p>Loading...</p> : <button>Send</button>}
//       </form>
//       {/* {loginStatus ? <p>Loading...</p> : <p></p>}
//       {serverData ? (
//         serverData.users.map((user, i) => {
//           return <p key={i}>{user}</p>;
//         })
//       ) : (
//         <p></p>
//       )} */}
//     </div>
//   );
// };
