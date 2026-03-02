import { useState } from "react";

import "./App.css";
import Layout from "./components/Layout";
import Link from "./components/Link";
import PDFInput from "./components/PDFInput";
import Summary from "./components/Summary";
import EmbedVideo from "./components/EmbedVideo";
import Spinner from "./components/Spinner";

function App() {
  function convertToEmbedLink(youtubeLink) {
    let videoId;
    if (youtubeLink.includes("youtube.com")) {
      // Extract video ID from regular YouTube link
      const urlParams = new URLSearchParams(youtubeLink.split("?")[1]);
      videoId = urlParams.get("v");
    } else if (youtubeLink.includes("youtu.be")) {
      // Extract video ID from shortened YouTube link
      videoId = youtubeLink.split("/").pop().split("?")[0];
    } else {
      return "Invalid YouTube link";
    }
    // Use youtube-nocookie.com to reduce tracking requests and errors
    // This domain has fewer tracking endpoints and is less likely to be blocked
    const embedLink = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    return embedLink;
  }

  const [isLoading, setIsLoading] = useState(false);
  const onSubmit = (e) => {
    e.preventDefault();
    const pdf = document.getElementById("dropzone-file");
    const url = document.getElementById("website-url");
    if (pdf.files[0] === undefined && url.value === "") {
      alert("Please upload a PDF or enter a URL");
      return;
    }

    setIsLoading(true);
    const summary = document.getElementById("summary");

    const embed = document.getElementById("embed");
    let youtubeLink = "";

    if (url.value !== "") {
      embed.src = convertToEmbedLink(url.value);
      youtubeLink = url.value;
    }

    if (youtubeLink === "") {
      const formData = new FormData();
      if (pdf.files[0] !== undefined) {
      } else {
        alert("Please upload a PDF or enter a URL");
        return;
      }
      formData.append("file", pdf.files[0]);
      console.log(formData.get("file"));
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout: The server is taking too long to respond. The model might still be loading or the PDF is very large. Please try again in a moment.')), 300000); // 5 minutes timeout
      });

      // Race between fetch and timeout
      Promise.race([
        fetch("http://127.0.0.1:5000/upload-pdf", {
          method: "POST",
          headers: {
            Accept: "*/*",
          },
          body: formData,
        }),
        timeoutPromise
      ])
        .then((response) => {
          if (!response.ok) {
            return response.json().then(err => { 
              throw new Error(err.error || `Server error: ${response.status}`); 
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Response data:", data);
          
          // Check for error in response
          if (data.error) {
            alert("Error: " + data.error);
            setIsLoading(false);
            return;
          }
          
          // Handle both string and array formats
          let summaryText = "";
          if (typeof data.summary === "string") {
            summaryText = data.summary;
          } else if (Array.isArray(data.summary) && data.summary.length > 0) {
            summaryText = data.summary[0].summary_text || data.summary[0];
          } else {
            summaryText = "No summary generated";
          }

          if (!summaryText || summaryText.trim() === "") {
            alert("Error: Summary is empty. The PDF might not contain extractable text.");
            setIsLoading(false);
            return;
          }

          summary.textContent = summaryText;
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Error: " + (error.message || "Failed to generate summary. Please check the console for details."));
          setIsLoading(false);
        });
    } else {
      fetch("http://127.0.0.1:5000/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Set the Content-Type header to indicate JSON data
        },
        body: JSON.stringify({
          // Serialize the request body as JSON
          video_link: youtubeLink,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Failed to generate summary'); });
          }
          return response.json();
        })
        .then((data) => {
          console.log(data);
          
          if (data.error) {
            alert("Error: " + data.error);
            setIsLoading(false);
            return;
          }

          let summaryText = data.summary || "";
          if (summaryText) {
            const summ = summaryText.split(". ");
            if (
              summ.length >= 2 &&
              summ[0].startsWith("This is a very short film") &&
              summ[1].startsWith("It does not advance our plot")
            ) {
              // Remove the first two summ
              summ.splice(0, 2);
            }
            summaryText = summ.join(". ");
          }

          summary.textContent = summaryText;
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Error: " + (error.message || "Failed to generate summary"));
          setIsLoading(false);
        });
    }
  };
  return (
    <Layout>
      <div className="w-full flex-1 flex flex-col gap-5">
        <div className="flex flex-wrap gap-2 items-end justify-between">
          <Link></Link>
          <button
            onClick={(e) => {
              onSubmit(e);
            }}
            className="text-white bg-emerald-600 sm:px-4 rounded-lg p-3"
          >
            Generate
          </button>
        </div>
        <PDFInput></PDFInput>
        <EmbedVideo></EmbedVideo>
      </div>
      <div className="flex-1">
        <div className={isLoading ? "hidden" : ""}>
          <Summary></Summary>
        </div>
        <div className={isLoading ? "" : "hidden"}>
          <Spinner></Spinner>
        </div>
      </div>
    </Layout>
  );
}

export default App;


