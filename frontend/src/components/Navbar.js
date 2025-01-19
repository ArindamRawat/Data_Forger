import React from 'react';

const Navbar = ({ userDetails }) => {
  const styles = {
    navbar: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 40px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
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
    },
    welcomeText: {
      fontSize: '1.1rem',
      color: '#a9b2c3',
    },
  };

  return (
    <div style={styles.navbar}>
      <div style={styles.logo}>DataForge</div>
      <div style={styles.rightSection}>
        {userDetails && (
          <>
            <div style={styles.avatar}>
              {userDetails.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.welcomeText}>Welcome, {userDetails.name}!</div>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
