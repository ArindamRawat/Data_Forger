import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import WalletConnect from "../../components/WalletConnect";

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
    return <p>Loading user details...</p>;
  }

  // Determine if the button should be enabled
  const isButtonEnabled = numData <= 1000 || isPaid;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>NFT Dataset Generator</h1>
      <div style={styles.userDetails}>
        <h3>Welcome, {userDetails?.name || "User"}!</h3>
        <p>Connected Wallet: {userDetails?.walletAddress || "Not Connected"}</p>
      </div>
      <div style={styles.form}>
        <label style={styles.label}>Blockchain:</label>
        <select disabled style={styles.input}>
          <option value="ethereum">Ethereum</option>
        </select>

        <label style={styles.label}>Marketplace:</label>
        <select disabled style={styles.input}>
          <option value="opensea">OpenSea</option>
        </select>

        <label style={styles.label}>Number of Data Points:</label>
        <input
          type="number"
          value={numData}
          onChange={(e) => setNumData(e.target.value)}
          min="1"
          max="10000"
          required
          style={styles.input}
        />

        <label style={styles.label}>Category:</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.input}
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
          style={{
            ...styles.button,
            backgroundColor: isButtonEnabled ? "#4caf50" : "#d3d3d3", // Green if enabled, grey if disabled
            cursor: isButtonEnabled ? "pointer" : "not-allowed", // Pointer if enabled, not-allowed if disabled
          }}
          disabled={!isButtonEnabled || isLoading} // Disabled if not enabled or loading
        >
          {isLoading ? "Generating..." : "Generate Dataset"}
        </button>
      </div>
      <Link to="/files"><button>Show datasets</button></Link>
    </div>
  );
};

export default Main;
