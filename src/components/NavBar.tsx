// src/components/NavBar.tsx
import { makeStyles } from "@fluentui/react-components";
import { Link } from "react-router-dom";
import { Button } from "@fluentui/react-components";
import { Home24Regular, Chat24Regular, DataTrending24Regular, Settings24Regular } from "@fluentui/react-icons";
import HarisLogo from '../assets/Harislogo.png';
import VoiceSettingsModal from './VoiceSettingsModal';

const useStyles = makeStyles({
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderBottom: `1px solid #e8eaed`,
  },
  logo: {
    fontWeight: 600,
    fontSize: "1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#3c4043",
  },
  links: {
    display: "flex",
    gap: "0.75rem",
    fontWeight: 500,
    alignItems: "center",
  },
  buttonLink: {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
  },
  navButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: "#5f6368",
    ":hover": {
      backgroundColor: "#f1f3f4",
      color: "#3c4043",
    },
  },
  settingsButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: "#5f6368",
    border: "1px solid #dadce0",
    ":hover": {
      backgroundColor: "#f1f3f4",
      color: "#3c4043",
    },
  },
});

export default function NavBar() {
  const styles = useStyles();
  return (
    <header className={styles.nav}>
      <div className={styles.logo}>
        <img src={HarisLogo} alt="Haris" style={{ height: '32px', width: 'auto' }} />
        Haris
      </div>
      <nav className={styles.links}>
        <Link to="/" className={styles.buttonLink}>
          <Button icon={<Home24Regular />} appearance="transparent" className={styles.navButton}>
            Home
          </Button>
        </Link>
        <Link to="/chat" className={styles.buttonLink}>
          <Button icon={<Chat24Regular />} appearance="transparent" className={styles.navButton}>
            Chat
          </Button>
        </Link>
        <Link to="/telemetry" className={styles.buttonLink}>
          <Button icon={<DataTrending24Regular />} appearance="transparent" className={styles.navButton}>
            Telemetry
          </Button>
        </Link>
        
        {/* Voice Settings Modal */}
        <VoiceSettingsModal 
          trigger={
            <Button 
              icon={<Settings24Regular />} 
              appearance="outline" 
              className={styles.settingsButton}
            >
              Voice Settings
            </Button>
          }
        />
      </nav>
    </header>
  );
}
