import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Loader from '../../components/Loader'; // Import Loader
import './Login.css';

export default function Login(props) {
    const [loginDetails, setLoginDetails] = useState({ email: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    let navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const response = await fetch("https://nft-nexus-backend.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(loginDetails),
        });
        const json = await response.json();
        setIsLoading(false);

        if (json.flag) {
            localStorage.setItem('token', json.authToken);
            navigate("/main");
        } else {
            alert("Invalid Credentials, Try Again", "warning");
        }
    };

    const onchange = (e) => {
        setLoginDetails({ ...loginDetails, [e.target.name]: e.target.value });
    };

    return (
        <div className="bdy">
            {/* Background text */}
            <div id="emailHelp-background">Data Forge</div>
            <div id="emailHelp-background2">Data Forge</div>

            {/* Loader (visible when isLoading is true) */}
            {isLoading && <Loader />}

            {/* Login container */}
            <div className="login-container">
                <form onSubmit={handleSubmit} className="login-form">
                    <h2 className="login-title">Welcome Back to DataForge</h2>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            onChange={onchange}
                            id="email"
                            name="email"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            onChange={onchange}
                            name="password"
                            id="password"
                            placeholder="Enter your password"
                        />
                    </div>
                    <button type="submit" className="btn-primary">Login</button>
                    <p className="signup-text">
                        Don't have an account? <Link to="/signup">Create Account</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
