import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Web3 from 'web3';
import Loader from '../../components/Loader';
import './SignUp.css';

export default function SignUp(props) {
  const [signup, setSignUp] = useState({ name: "", email: "", password: "", cpassword: "", walletAddress: "" });
  const [loading, setLoading] = useState(false); // State to track loading status
  let navigate = useNavigate();

  const handleConnectWallet = async () => {
    try {
      setLoading(true); // Start loader
      if (!window.ethereum) {
        alert('MetaMask not detected', 'warning');
        setLoading(false);
        return;
      }

      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      const walletAddress = accounts[0];

      setSignUp({ ...signup, walletAddress });
      alert('Wallet connected successfully', 'success');
    } catch (error) {
      alert('Failed to connect wallet', 'warning');
    } finally {
      setLoading(false); // Stop loader
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, cpassword, walletAddress } = signup;

    if (password !== cpassword) {
      return alert('Password does not match', 'warning');
    }
    if (!walletAddress) {
      return alert('Wallet address is required', 'warning');
    }

    try {
      setLoading(true); // Start loader
      const response = await fetch("https://nft-nexus-backend.onrender.com/api/auth/createuser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, walletAddress }),
      });

      const json = await response.json();
      if (json.success) {
        localStorage.setItem('token', json.authToken);
        alert("Account created Successfully", "success");
        navigate("/main");
      } else {
        alert("Invalid Credentials", "warning");
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      alert("An error occurred. Please try again.", "warning");
    } finally {
      setLoading(false); // Stop loader
    }
  };

  const onchange = (e) => {
    setSignUp({ ...signup, [e.target.name]: e.target.value });
  };

  return (
    <div className="signuppage-body">
      {loading && <Loader />} {/* Display loader when loading */}
      <div id="signuppage-background-text">Data Forge</div>
      <div id="signuppage-background-text2">Data Forge</div>

      <div className="signuppage-container">
        <form onSubmit={handleSubmit} className="signuppage-form">
          <h2 className="signuppage-title">Create Account</h2>
          <div className="signuppage-mb-3">
            <label htmlFor="signuppage-name" className="signuppage-form-label">Name</label>
            <input
              type="text"
              className="signuppage-form-control"
              onChange={onchange}
              required
              minLength={3}
              id="signuppage-name"
              name="name"
              placeholder="Enter your name"
            />
          </div>
          <div className="signuppage-mb-3">
            <label htmlFor="signuppage-email" className="signuppage-form-label">Email Address</label>
            <input
              type="email"
              className="signuppage-form-control"
              onChange={onchange}
              required
              id="signuppage-email"
              name="email"
              placeholder="Enter your email"
            />
          </div>
          <div className="signuppage-mb-3">
            <label htmlFor="signuppage-password" className="signuppage-form-label">Password</label>
            <input
              type="password"
              className="signuppage-form-control"
              onChange={onchange}
              minLength={5}
              required
              name="password"
              id="signuppage-password"
              placeholder="Enter your password"
            />
          </div>
          <div className="signuppage-mb-3">
            <label htmlFor="signuppage-cpassword" className="signuppage-form-label">Confirm Password</label>
            <input
              type="password"
              className="signuppage-form-control"
              onChange={onchange}
              minLength={5}
              required
              name="cpassword"
              id="signuppage-cpassword"
              placeholder="Confirm your password"
            />
          </div>
          <div className="signuppage-mb-3">
            <label htmlFor="signuppage-walletAddress" className="signuppage-form-label">Wallet Address</label>
            <input
              type="text"
              className="signuppage-form-control"
              value={signup.walletAddress}
              onChange={onchange}
              placeholder="Enter wallet address or connect your wallet"
              id="signuppage-walletAddress"
              name="walletAddress"
            />
          </div>
          <button type="button" className="signuppage-btn-secondary signuppage-mb-3" onClick={handleConnectWallet}>
            Connect Wallet
          </button>
          <button type="submit" className="signuppage-btn-primary">Sign Up</button>
          <p className="signuppage-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
