import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import http from '../../Services/http';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {
        fetchCharacterById,
        fetchCharacterFromDb
        } from "../../Services/api"; // adjust path if needed

function ensureHttps(url) {
    if (!url) return '';
    return url.startsWith('http://') ? 'https://' + url.slice(7) : url;
    }

    export default function CharacterDetail() {
    const { id } = useParams(); // character ID from URL
    const navigate = useNavigate();
    const [character, setCharacter] = useState(null);
    const [source, setSource] = useState(''); // 'marvel' or 'db'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState('');

        useEffect(() => {
        async function fetchCharacter() {
            setLoading(true);
            setError(null);

            try {
            // 1) Try Marvel API (through your backend)
            const resMarvel = await fetchCharacterById(id);
            setCharacter(resMarvel);
            setSource("marvel");

            } catch (e1) {
            try {
                // 2) Fallback to your local DB
                const resDb = await fetchCharacterFromDb(id);
                setCharacter(resDb);
                setSource("db");

            } catch (e2) {
                setError("Character not found or server error");
            }
            } finally {
            setLoading(false);
            }
        }

        fetchCharacter();
        }, [id]);

    const handleDelete = async () => {
    if (source !== 'db') return; // Only DB characters can be deleted
    if (!window.confirm('Are you sure you want to delete this character?')) return;

    try {
        await http.delete(`/characters-db/${id}`);
        setDeleteSuccess('Character successfully deleted.');
        setTimeout(() => navigate('/AllCharacters'), 1000);
    } catch (err) {
        setDeleteError('Failed to delete character.');
    }
    };

    if (loading) return <p>Loading character...</p>;
    if (error) return <p>{error}</p>;
    if (!character) return null;

    const img = ensureHttps(character.image_url);
    const isDb = source === 'db';

    return (
    <Container className="mt-4">
        <Row className="justify-content-center">
        <Col md={6}>
            <Card className="text-center shadow p-3 mb-5 mt-5 bg-body rounded">
            <Card.Img
                variant="top"
                src={img}
                style={{ objectFit: 'contain', maxHeight: '300px', padding: '10px' }}
            />
            <Card.Body>
                <Card.Title>{character.name}</Card.Title>

                {isDb ? (
                <>
                    <Card.Subtitle className="mb-2 text-muted">
                    Alias: {character.alias || '—'}
                    </Card.Subtitle>
                    <Card.Text><strong>Alignment:</strong> {character.alignment || '—'}</Card.Text>
                    <Card.Text><strong>Powers:</strong> {character.powers || '—'}</Card.Text>
                </>
                ) : (
                <>
                    {/* Marvel API doesn’t provide alias/alignment/powers */}
                    <Card.Text className="text-muted">
                    {character.description || 'No description available.'}
                    </Card.Text>
                </>
                )}

                {deleteError && <Alert variant="danger">{deleteError}</Alert>}
                {deleteSuccess && <Alert variant="success">{deleteSuccess}</Alert>}

                {/* 🔹 Add-to-Team button for Marvel characters */}
                {source === 'marvel' && (
                <Button
                    variant="primary"
                    className="mt-2"
                    onClick={async () => {
                    try {
                        await http.post('/team/members', {
                        marvel_id: character.id,
                        name: character.name,
                        image_url: character.image_url,
                        role: 'Strategist', // or allow user to select
                        });
                        navigate('/myteam');
                    } catch (e) {
                        alert('Please log in to save to your team.');
                        navigate('/login');
                    }
                    }}
                >
                    Add to My Team
                </Button>
                )}

                {/* 🔹 Only DB characters can be deleted/edited */}
                {isDb && (
                <>
                    <Button variant="danger" className="mt-2" onClick={handleDelete}>
                    Delete Character
                    </Button>
                    <Button
                    variant="dark"
                    className="mt-2 ms-2"
                    onClick={() => navigate(`/edit/${character.id}`)}
                    >
                    Edit Character
                    </Button>
                </>
                )}

                <Button
                variant="secondary"
                className="mt-2 ms-2"
                onClick={() => navigate('/AllCharacters')}
                >
                Back to Characters
                </Button>
            </Card.Body>
            </Card>
        </Col>
        </Row>
    </Container>
    );
    }
