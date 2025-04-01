import styles from './HomePage.module.css';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';

function HomePage() {
    const navigate = useNavigate();
    
    return (
        <div className={styles.Home}>
            <div>
                <h1 className={styles.headerText}>Whose On Your Team?</h1>
            </div>
            <Button className={styles.findOutButton}  variant="outline-light" onClick={() => navigate('/AllCharacters')}>Find Out</Button>
        </div>
    );
}

export default HomePage;
