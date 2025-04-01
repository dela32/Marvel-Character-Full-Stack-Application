import Card from 'react-bootstrap/Card';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useNavigate } from 'react-router-dom';

function AllCharacters() {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchCharacters = async () => {
            try{
                const response = await axios.get('http://127.0.0.1:5000/characters');
                setCharacters(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        
        fetchCharacters();
    }, []);


    return (
        <div>
            <div className="d-flex justify-content-between align-items-center p-3">
                <h2>All Characters</h2>
                <Button variant="dark" onClick={() => navigate('/create')}>Add Character</Button>
            </div>

            {loading && <div>Loading...</div>}
            {error && <div>Error: {error}</div>}
            
            <Row className="justify-content-center">
            {characters.map((character) => (
                <Col key={character.id} xs={12} sm={6} md={4} lg={3} xl={2} className="mb-4 d-flex justify-content-center">
                    <Card style={{width: '12rem'}}>
                        <Card.Img variant="top" src={character.image_url} style={{ maxWidth: '100%', height: '180px', objectFit: 'contain' }}/>
                        <Card.Body style={{ padding: '1rem' }}>
                            <Card.Title>{character.name}</Card.Title>
                            <Card.Text>{character.alias}</Card.Text>
                            <Button 
                            variant="danger"
                            onClick={() => navigate(`/characters/${character.id}`)}
                            >View Details</Button>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
            </Row>
        </div>
    );
}

export default AllCharacters;