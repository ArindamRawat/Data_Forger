import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import './Main.css'
const Main = () => {
  const [numData, setNumData] = useState(1);
  const [category, setCategory] = useState("Collection Analytics");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false); // Tracks whether the payment is made
  const [userDetails, setUserDetails] = useState(null); // Tracks user details

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("https://nft-nexus-backend.onrender.com/api/auth/getuser", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        });

        if (response.ok) {
          const json = await response.json();
          setUserDetails(json); // Save the entire user object
        } else {
          console.error("Failed to fetch user details.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, []);

  const handleGenerate = async () => {
    if (numData > 1000 && !isPaid) {
      alert("Please pay 50 BCUT tokens to generate datasets > 1000 entries.");
      return;
    }

    if (!userDetails) {
      alert("User details not available. Please refresh the page or try again later.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          num_data: numData,
          category: category,
          userId: userDetails._id, // Pass the userId from the userDetails object
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `generated_dataset_${category}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Error generating dataset");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while generating the dataset.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-container">
      {/* Navbar */}
      <div className="main-navbar">
        <div className="main-navbar-left">
          <h1 className="main-logo">DataForge</h1>
        </div>
        <div className="main-navbar-right">
          {userDetails && (
            <>
              <div className="main-user-avatar">{userDetails.name.charAt(0).toUpperCase()}</div>
              <h3 className="main-user-welcome">Welcome, {userDetails.name}!</h3>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="main-content">
        {/* Header Section */}
        <div className="main-header">
          <h1>NFT Dataset Generator</h1>
          <p>Generate customized datasets for your blockchain analytics needs.</p>
        </div>

        {/* User Details Section */}
        <div className="main-user-details">
          {userDetails ? (
            <div className="main-user-card">
              <h3>User Information</h3>
              <p><b>Name:</b> {userDetails.name}</p>
              <p><b>Email:</b> {userDetails.email}</p>
              <p><b>Wallet Address:</b> {userDetails.walletAddress}</p>
            </div>
          ) : (
            <p className="main-loading">Loading user details...</p>
          )}
        </div>

        {/* Form Section */}
        <div className="main-form">
          <label className="main-label">Blockchain:</label>
          <select className="main-input" disabled>
            <option value="ethereum">Ethereum</option>
          </select>

          <label className="main-label">Marketplace:</label>
          <select className="main-input" disabled>
            <option value="opensea">OpenSea</option>
          </select>

          <label className="main-label">Number of Data Points:</label>
          <input
            type="number"
            className="main-input"
            value={numData}
            onChange={(e) => setNumData(e.target.value)}
            min="1"
            max="10000"
            required
          />

          <label className="main-label">Category:</label>
          <select
            className="main-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Collection Analytics">Collection Analytics</option>
            <option value="Collection Holders">Collection Holders</option>
            <option value="Collection Scores">Collection Scores</option>
            <option value="Collection Traders">Collection Traders</option>
            <option value="Collection Washtrade">Collection Washtrade</option>
            <option value="Collection Whales">Collection Whales</option>
            <option value="Collection Profile">Collection Profile</option>
          </select>

          <button
            className={`main-button ${isLoading ? "main-button-disabled" : ""}`}
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate Dataset"}
          </button>
        </div>

        {/* Footer Section */}
        <div className="main-footer">
          <Link to="/files" className="main-footer-link">
            <button className="main-footer-button">Show Datasets</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Main;
