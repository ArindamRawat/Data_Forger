import Web3 from "web3";

let web3;

if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  window.ethereum.enable(); // Request wallet connection
} else {
  console.error("MetaMask not detected. Please install MetaMask.");
}

export default web3;
