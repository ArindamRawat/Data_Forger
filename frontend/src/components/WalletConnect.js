import React, { useState } from "react";
import Web3 from "web3";
import contractABI from "../abi/contractABI.json";

const CONTRACT_ADDRESS = "0xd457540c3f08f7F759206B5eA9a4cBa321dE60DC";

const WalletConnect = ({ walletAddress, onPaymentSuccess }) => {
  const [isPaying, setIsPaying] = useState(false);

  const payTokens = async () => {
    if (!walletAddress) {
      alert("No wallet address found. Please check your account details.");
      return;
    }

    setIsPaying(true);

    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
      const tokenAmount = web3.utils.toWei("50", "ether"); // 50 BCUT tokens

      await contract.methods.payTokens(tokenAmount).send({ from: walletAddress });
      alert("Payment successful! You can now generate datasets > 1000 entries.");
      onPaymentSuccess();
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div style={styles.container}>
      <p>Connected Wallet: {walletAddress}</p>
      <button onClick={payTokens} style={styles.button} disabled={isPaying}>
        {isPaying ? "Processing..." : "Pay 50 BCUT Tokens"}
      </button>
    </div>
  );
};

const styles = {
  container: {
    margin: "20px 0",
    textAlign: "center",
  },
  button: {
    padding: "10px 15px",
    fontSize: "16px",
    backgroundColor: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default WalletConnect;
