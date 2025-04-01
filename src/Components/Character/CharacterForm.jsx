import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

function CharacterForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name:'',
        alias: '',
        alignment:'hero',
        powers:'',
        image_url: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
    
        try {
            if (id) {
                await axios.put(`http://127.0.0.1:5000/characters/${id}`, formData);
                setSuccess("Character updated successfully!");
            } else {
                await axios.post(`http://127.0.0.1:5000/characters`, formData);
                setSuccess("Character created successfully!");
            }
    
            setTimeout(() => navigate('/characters'), 1000);
    
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchCharacter = async () => {
            if (id) {
                try {
                    const response = await axios.get(`http://127.0.0.1:5000/characters/${id}`);
                    setFormData(response.data);
                } catch (err) {
                    setError("Failed to load character for editing.");
                }
            }
        };
    
        fetchCharacter();
    }, [id]);

    return (
        <Container className="mt-5 mb-5 p-5">
            <h2>{id ? 'Edit Character' : 'Create Character'}</h2>
    
            {loading && <Spinner animation="border" />}
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
    
            <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </Form.Group>
    
                <Form.Group className="mb-3">
                    <Form.Label>Alias</Form.Label>
                    <Form.Control
                        type="text"
                        value={formData.alias}
                        onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                        required
                    />
                </Form.Group>
    
                <Form.Group className="mb-3">
                    <Form.Label>Alignment</Form.Label>
                    <Form.Select
                        value={formData.alignment}
                        onChange={(e) => setFormData({ ...formData, alignment: e.target.value })}
                    >
                        <option value="hero">Hero</option>
                        <option value="villain">Villain</option>
                    </Form.Select>
                </Form.Group>
    
                <Form.Group className="mb-3">
                    <Form.Label>Powers</Form.Label>
                    <Form.Control
                        as="textarea"
                        value={formData.powers}
                        onChange={(e) => setFormData({ ...formData, powers: e.target.value })}
                        required
                    />
                </Form.Group>
    
                <Form.Group className="mb-3">
                    <Form.Label>Image URL</Form.Label>
                    <Form.Control
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        required
                    />
                </Form.Group>
    
                <Button
                    variant="danger"
                    type="submit"
                    onClick={() => handleSubmit()}
                    disabled={loading}
                >
                    {id ? 'Update Character' : 'Create Character'}
                </Button>
            </Form>
        </Container>
    );
}
export default CharacterForm;

