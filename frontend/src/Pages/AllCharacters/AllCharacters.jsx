import Card from 'react-bootstrap/Card';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useNavigate } from 'react-router-dom';
import './AllCharacters.css';

function AllCharacters() {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [q, setQ] = useState('');
    const [page, setPage] = useState(0);
    const navigate = useNavigate();

    const limit = 24;
    const offset = page * limit;

   async function fetchCharacters() {
    try {
        setLoading(true);
        setError(""); // clear old errors

        const res = await axios.get('/api/characters', {
            params: { q, limit, offset }
        });

        setCharacters(res.data.results || []);
        setError(res.data.error || ""); // handle soft errors

    } catch (err) {
        console.error("Fetch error:", err);

        setCharacters([]);

        setError(
            err.response?.data?.error || 
            "Unable to load characters right now. Please try again later."
        );
    } finally {
        setLoading(false);
    }
}

    useEffect(() => { fetchCharacters(); /* eslint-disable-next-line */ }, [page]);

    const onSearch = () => { setPage(0); fetchCharacters(); };

    return (
    <div className="container py-3">
        {/* Hero banner */}
        <div className="catalog-hero">
        <div className="catalog-hero-content">
            <h1 className="catalog-title">All Marvel Characters</h1>
            <p className="catalog-sub">Search thousands of heroes & villains from the official Marvel API.</p>
            <div className="d-flex gap-2 catalog-search">
            <input
                className="form-control"
                placeholder="Search by name (e.g., Spider, Thor, Loki)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
            <Button variant="danger" onClick={onSearch}>Search</Button>
            <Button variant="danger" onClick={() => navigate('/create')}>
                Add Character
            </Button>
            </div>
        </div>
        </div>

        {loading && <div className="text-muted">Loading…</div>}
        {error && <div className="text-danger">Error: {error}</div>}

        <Row className="g-4">
        {characters.map((c, i) => (
            <Col key={c.id} xs={12} sm={6} md={4} lg={3} className="fade-in" style={{ animationDelay: `${i * 0.01}s` }}>
            <Card className="char-card">
                <Card.Img
                className="char-img"
                variant="top"
                src={c.image_url}
                alt={c.name}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x450?text=Marvel+Character";
                }}/>
                <Card.Body className="char-body">
                <Card.Title className="mb-1">{c.name}</Card.Title>
                <Card.Text className="text-muted">Marvel Character</Card.Text>
                <Button
                    className="view-btn"
                    variant="danger"
                    onClick={() => navigate(`/characters/${c.id}`)}
                >
                    View Details
                </Button>
                </Card.Body>
            </Card>
            </Col>
        ))}
        </Row>

        <div className="d-flex justify-content-between align-items-center my-4">
        <Button variant="danger" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            ← Prev
        </Button>
        <div>Page {page + 1}</div>
        <Button variant="danger" onClick={() => setPage((p) => p + 1)}>
            Next →
        </Button>
        </div>

        <div className="text-center text-muted pb-3">
        Data provided by Marvel. © {new Date().getFullYear()} MARVEL
        </div>
    </div>
    );
    }

export default AllCharacters;
