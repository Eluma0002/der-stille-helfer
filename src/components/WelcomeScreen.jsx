import { useUser, USERS } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import './WelcomeScreen.css';

export default function WelcomeScreen() {
  const { switchUser } = useUser();
  const navigate = useNavigate();

  const handleUserSelect = (userId) => {
    switchUser(userId);
    navigate('/uebersicht');
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <h1 className="welcome-title">Willkommen!</h1>
        <p className="welcome-subtitle">Wer bist du?</p>

        <div className="user-buttons">
          {Object.values(USERS).map((user) => (
            <button
              key={user.id}
              className="user-button"
              style={{ backgroundColor: user.accentColor }}
              onClick={() => handleUserSelect(user.id)}
            >
              <span className="user-emoji">{user.emoji}</span>
              <span className="user-name">{user.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
