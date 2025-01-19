import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import WalletConnect from "../../components/WalletConnect";
import Navbar from "../../components/Navbar";

import './Main.css'
const Main = () => {
  const [numData, setNumData] = useState(1);
  const [category, setCategory] = useState("Collection Analytics");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false); // Tracks whether the payment is made
  const [userDetails, setUserDetails] = useState(null); // Tracks user details
  const [isUserDetailsLoading, setIsUserDetailsLoading] = useState(true); // Tracks if user details are being fetched

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (!localStorage.getItem("token")) {
          alert("Authentication token is missing. Please log in again.");
          return;
        }

        const response = await fetch(
          "https://nft-nexus-backend.onrender.com/api/auth/getuser",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "auth-token": localStorage.getItem("token"),
            }
          }
        );

        if (response.ok) {
          const json = await response.json();
          setUserDetails(json); // Save the entire user object
        } else {
          console.error("Failed to fetch user details.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setIsUserDetailsLoading(false); // Set loading to false regardless of success or failure
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

  // Block rendering until user details are loaded
  if (isUserDetailsLoading) {
    return <p className="mainpage-loading-text">Loading user details...</p>;
  }

  // Determine if the button should be enabled
  const isButtonEnabled = numData <= 1000 || isPaid;

  return (<> <Navbar />
    <div className="mainpage-container">
          {/* Header Section */}
          <div className="main-header">
  <h1>NFT Dataset Generator</h1>
  <p>Generate customized datasets for your blockchain analytics needs.</p>

  {/* Feature Details Section */}
  <div className="main-feature-cards">
    <div className="feature-card">
      <h3>Collection Analytics</h3>
      <p>Analyze overall performance metrics such as volume, sales, and market trends of NFT collections.</p>
    </div>
    <div className="feature-card">
      <h3>Collection Holders</h3>
      <p>Obtain insights about the distribution of NFT ownership and the activity levels of holders.</p>
    </div>
    <div className="feature-card">
      <h3>Collection Scores</h3>
      <p>Evaluate collections based on calculated scores like rarity, popularity, and trading activity.</p>
    </div>
    <div className="feature-card">
      <h3>Collection Traders</h3>
      <p>Explore the behavior and patterns of traders interacting with NFT collections.</p>
    </div>
    <div className="feature-card">
      <h3>Collection Washtrade</h3>
      <p>Detect and analyze suspicious trading patterns and wash trading activities in NFT collections.</p>
    </div>
    <div className="feature-card">
      <h3>Collection Whales</h3>
      <p>Identify and track influential large-scale holders or traders within a collection.</p>
    </div>
    <div className="feature-card last-card">
      <h3>Collection Profile</h3>
      <p>Access a comprehensive profile of the collection, including its creation details, creators, and associated assets.</p>
    </div>
  </div>
</div>

      
      <div className="mainpage-form-container">
        <label htmlFor="mainpage-blockchain-select" className="mainpage-label">Blockchain:</label>
        <select id="mainpage-blockchain-select" disabled className="mainpage-select">
          <option value="ethereum">Ethereum</option>
        </select>

        <label htmlFor="mainpage-marketplace-select" className="mainpage-label">Marketplace:</label>
        <select id="mainpage-marketplace-select" disabled className="mainpage-select">
          <option value="opensea">OpenSea</option>
        </select>

        <label htmlFor="mainpage-num-data" className="mainpage-label">Number of Data Points:</label>
        <input
          type="number"
          id="mainpage-num-data"
          className="mainpage-input"
          value={numData}
          onChange={(e) => setNumData(e.target.value)}
          min="1"
          max="10000"
          required
        />

        <label htmlFor="mainpage-category-select" className="mainpage-label">Category:</label>
        <select
          id="mainpage-category-select"
          className="mainpage-select"
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

        {numData > 1000 && (
          <WalletConnect
            walletAddress={userDetails?.walletAddress}
            onPaymentSuccess={() => setIsPaid(true)}
          />
        )}

        <button
          onClick={handleGenerate}
          disabled={!isButtonEnabled || isLoading} // Disabled if not enabled or loading
          className="mainpage-generate-button"
        >
          {isLoading ? "Generating..." : "Generate Dataset"}
        </button>
      </div>
      <Link to="/files">
        <button className="mainpage-show-datasets-button">Show datasets</button>
      </Link>
    </div>
    </>
  );
};

export default Main;
