// nav.jsx
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import { useEffect } from "react";
import styles from "./nav.module.css";
import { useAuth } from "../contexts/authContext";
import customLogo from "../../assets/medioralogo.png"; 

export default function Nav() {
  const { data, isLoading, error, refetch } = useUser();
  const location = useLocation();
  const { isOnline } = useAuth();
  
  useEffect(() => {
    refetch();
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className={styles.header}>
      <div className={styles.logoFlex}>
        <div className={styles.logoIcon}>
          <img 
            src={customLogo} 
            alt="MEDIORA Logo" 
            style={{ 
              width: '50px', 
              height: '50px', 
              objectFit: 'contain',
              display: 'block',
              mixBlendMode: 'multiply'   
            }}
          />
        </div>
        <div className={styles.logoText}>
          <span className={styles.med}>MEDIORA</span>
          <span className={styles.logoSub}>Healthcare Platform</span>
        </div>
      </div>
      
      <div className={styles.routes}>
        <Link 
          className={`${styles.link} ${isActive('/mainpage/appointements') ? styles.activeLink : ''}`} 
          to="/mainpage/appointements"
        >
          <span className={styles.linkIcon}>📅</span>
          Appointments
        </Link>
        <Link 
          className={`${styles.link} ${isActive('/mainpage/dashboard') ? styles.activeLink : ''}`} 
          to="/mainpage/dashboard"
        >
          <span className={styles.linkIcon}>📊</span>
          Dashboard
        </Link>
        <Link 
          className={`${styles.link} ${isActive('/mainpage/chat') ? styles.activeLink : ''}`} 
          to="/mainpage/chat"
        >
          <span className={styles.linkIcon}>💬</span>
          Chat
        </Link>
        <Link 
          className={`${styles.link} ${isActive('/mainpage/profile') ? styles.activeLink : ''}`} 
          to="/mainpage/profile"
        >
          <span className={styles.linkIcon}>👤</span>
          Profile
        </Link>
      </div>
      
      <div className={styles.pro}>
        <div className={styles.proInfo}>
          <p className={styles.proPara}>{data?.data.first_name}</p>
          <p className={styles.proSpe}>{data?.data.specialty}</p>
        </div>
        <div className={styles.proPicWrapper}>
          <img className={styles.proPic} src={data?.data.picture} alt="Profile" />
          <div 
            className={`${styles.onlineDot} ${isOnline ? styles.onlineDotGreen : styles.onlineDotRed}`}
          ></div>
        </div>
      </div>
    </div>
  );
}