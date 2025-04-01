import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

function CharacterDetail() {
    const { id } = useParams();  // <---- This get the character ID from the URL
    const [character, setCharacter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCharacter = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:5000/characters/${id}`);
                setCharacter(response.data);
                setLoading(false);
            } catch (err) {
                setError("Character not found or server error");
                setLoading(false);
            }
        };
        
        fetchCharacter();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this character?")) {
            return;
        }

        try {
            await axios.delete(`http://127.0.0.1:5000/characters/${id}`);
            setDeleteSuccess("Character successfully deleted.");
            setTimeout(() => navigate('/AllCharacters'), 1000);
        } catch (err) {
            setDeleteError("Failed to delete character.");
        }
    };

    if (loading) return <p>Loading character...</p>;
    if (error) return <p>{error}</p>;


    return (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col md={6}>
                <Card className="text-center shadow p-3 mb-5 mt-5 bg-body rounded">
                    <Card.Img variant="top" src={character.image_url} style={{ objectFit: 'contain', maxHeight: '300px', padding: '10px' }} />
                    <Card.Body>
                        <Card.Title>{character.name}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">Alias: {character.alias}</Card.Subtitle>
                        <Card.Text><strong>Alignment:</strong> {character.alignment}</Card.Text>
                        <Card.Text><strong>Powers:</strong> {character.powers}</Card.Text>

                        {deleteError && <Alert variant="danger">{deleteError}</Alert>}
                        {deleteSuccess && <Alert variant="success">{deleteSuccess}</Alert>}

                        <Button variant="danger" className="mt-2" onClick={handleDelete}>
                            Delete Character
                        </Button>

                        <Button variant="secondary" className="mt-2 ms-2" onClick={() => navigate('/AllCharacters')}>
                            Back to Characters
                        </Button>

                        <Button variant="dark" className="mt-2 ms-2" onClick={() => navigate(`/edit/${character.id}`)}>
                            Edit Character
                        </Button>

                    </Card.Body>
                </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default CharacterDetail;
