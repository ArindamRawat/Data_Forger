import React, { useState, useEffect } from "react";

const Files = () => {
  const [datasets, setDatasets] = useState([]); // To store the list of user datasets
  const [isLoading, setIsLoading] = useState(true); // To show a loading state
  const [error, setError] = useState(null); // To handle errors
  const [userId, setUserId] = useState(null); // To store the user ID

  // Fetch user details and datasets on component mount
  useEffect(() => {
    const fetchUserDetailsAndDatasets = async () => {
      try {
        // Fetch user details
        const userResponse = await fetch("https://nft-nexus-backend.onrender.com/api/auth/getuser", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"), // Assuming auth-token is stored in localStorage
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserId(userData._id); // Set the user ID
          
          // Fetch datasets for the user
          const datasetsResponse = await fetch(`http://127.0.0.1:5000/datasets?userId=${userData._id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (datasetsResponse.ok) {
            const datasetsData = await datasetsResponse.json();
            setDatasets(datasetsData.datasets || []); // Assume backend returns { datasets: [...] }
          } else {
            setError("Failed to fetch datasets.");
          }
        } else {
          setError("Failed to fetch user details.");
        }
      } catch (err) {
        setError("An error occurred while fetching user details or datasets.");
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetailsAndDatasets();
  }, []);

  // Function to download a file
  const downloadFile = async (fileId, filename) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/fetch-file/${fileId}`, {
        method: "GET",
      });

      if (response.ok) {
        // Convert the response to a Blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Create an anchor element to trigger the download
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "dataset.xlsx"; // Use the provided filename or a default one
        a.click();

        // Revoke the object URL to free memory
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to fetch the file.");
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("An error occurred while downloading the file.");
    }
  };

  if (isLoading) {
    return <p>Loading datasets...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Your Generated Datasets</h1>
      {datasets.length > 0 ? (
        datasets.map((dataset) => (
          <div key={dataset.fileId} style={styles.datasetItem}>
            <p>
              <strong>Type:</strong> {dataset.datasetType}
            </p>
            <p>
              <strong>Generated On:</strong>{" "}
              {new Date(dataset.timestamp).toLocaleString()}
            </p>
            <p>
              <strong>Number of Entries:</strong> {dataset.numEntries}
            </p>
            <button
              onClick={() => downloadFile(dataset.fileId, `dataset_${dataset.datasetType}.xlsx`)}
              style={styles.button}
            >
              Download
            </button>
          </div>
        ))
      ) : (
        <p>No datasets available.</p>
      )}
    </div>
  );
};

// Inline styles
const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  datasetItem: {
    padding: "15px",
    marginBottom: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    backgroundColor: "#f9f9f9",
  },
  button: {
    padding: "10px 15px",
    fontSize: "14px",
    color: "#fff",
    backgroundColor: "#007BFF",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default Files;
