import React, { useState, useEffect } from 'react';

const Navbar = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State to manage dropdown visibility

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (!localStorage.getItem('token')) {
          console.log('Authentication token is missing. Please log in again.');
          return;
        }

        const response = await fetch(
          'https://nft-nexus-backend.onrender.com/api/auth/getuser',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'auth-token': localStorage.getItem('token'),
            },
          }
        );

        if (response.ok) {
          const json = await response.json();
          setUserDetails(json); // Save the entire user object
        } else {
          console.error('Failed to fetch user details.');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Redirect to login page or home page
    window.location.href = '/login'; // Assuming login page is at /login
  };

  const styles = {
    navbar: {
      width: '100%',
      maxWidth: '100vw', // Ensure it doesn’t exceed viewport width
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px', // Adjust padding for better containment
      background: 'rgba(255, 255, 255, 0.05)',
      borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
      boxSizing: 'border-box', // Prevent overflow due to padding
    },
    logo: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#58A6FF',
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#58A6FF',
      color: '#151F2B',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    welcomeText: {
      fontSize: '1.1rem',
      color: '#a9b2c3',
    },
    dropdown: {
      position: 'absolute',
      top: '50px',
      right: '20px',
      backgroundColor: '#151F2B',
      color: '#fff',
      borderRadius: '8px',
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
      width: '200px',
      display: isDropdownOpen ? 'block' : 'none',
    },
    dropdownItem: {
      padding: '10px',
      textAlign: 'center',
      cursor: 'pointer',
      borderBottom: '1px solid #ddd',
    },
    dropdownItemLast: {
      padding: '10px',
      textAlign: 'center',
      cursor: 'pointer',
      borderBottom: 'none',
    },
    dropdownItemHover: {
      backgroundColor: '#58A6FF',
    },
  };

  return (
    <div style={styles.navbar}>
      <div style={styles.logo}>DataForge</div>
      <div style={styles.rightSection}>
        {userDetails ? (
          <>
            <div
              style={styles.avatar}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle dropdown visibility
            >
              {userDetails.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.welcomeText}>Welcome, {userDetails.name}!</div>
            <div style={styles.dropdown}>
              <div
                style={styles.dropdownItem}
                onClick={() => console.log('Profile clicked')}
              >
                Profile
              </div>
              <div
                style={styles.dropdownItemLast}
                onClick={handleLogout} // Logout and remove token
              >
                Logout
              </div>
            </div>
          </>
        ) : (
          <div style={styles.welcomeText}>Loading user details...</div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
