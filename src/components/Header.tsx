import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div 
        className="logo-container" 
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
        <img 
          src="/path/to/giftable-icon.png" 
          alt="Giftable" 
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />
      </div>
      {/* ... rest of header content ... */}
    </header>
  );
}

export default Header; 