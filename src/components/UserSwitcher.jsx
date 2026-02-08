import { useRef } from 'react';
import { useUser, USERS } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import './UserSwitcher.css';

export default function UserSwitcher() {
  const { activeUser, switchUser } = useUser();
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  if (!activeUser) return null;

  // Get the other user
  const otherUser = Object.values(USERS).find(u => u.id !== activeUser.id);

  const openDialog = () => {
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  const handleSwitch = () => {
    closeDialog();
    switchUser(otherUser.id);
    // Add animation class to main content
    const main = document.querySelector('main');
    if (main) {
      main.classList.add('user-switch-animation');
      setTimeout(() => main.classList.remove('user-switch-animation'), 300);
    }
    navigate('/uebersicht');
  };

  return (
    <>
      <button className="user-display" onClick={openDialog}>
        <span className="user-display-emoji">{activeUser.emoji}</span>
        <span className="user-display-name">{activeUser.name}</span>
      </button>

      <dialog ref={dialogRef} className="user-switch-dialog">
        <div className="dialog-content">
          <p className="dialog-question">
            Zu {otherUser.emoji} {otherUser.name} wechseln?
          </p>
          <div className="dialog-buttons">
            <button className="dialog-btn dialog-btn-cancel" onClick={closeDialog}>
              Abbrechen
            </button>
            <button
              className="dialog-btn dialog-btn-confirm"
              style={{ backgroundColor: otherUser.accentColor }}
              onClick={handleSwitch}
            >
              Ja, wechseln
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
