import { useEffect, useState } from 'react'
import http from '../../http'
import Button from 'react-bootstrap/Button'

    export default function MyTeam() {
    const [items, setItems] = useState([])

    async function load() {
    const res = await http.get('/team/members')
    setItems(res.data)
    }
    useEffect(() => { load() }, [])

    async function remove(id) {
    await http.delete(`/team/members/${id}`)
    load()
    }

    return (
    <div className="container mt-3">
        <h2>My Team</h2>
        {items.length === 0 && <p>No heroes yet. Add some!</p>}
        <div className="row">
        {items.map(m => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-3" key={m.id}>
            <div className="card">
                <img src={m.image_url} className="card-img-top" alt={m.name}/>
                <div className="card-body">
                <h5 className="card-title">{m.name}</h5>
                <p className="card-text">{m.role || '—'}</p>
                <Button variant="outline-danger" onClick={() => remove(m.id)}>Remove</Button>
                </div>
            </div>
            </div>
        ))}
        </div>
    </div>
    )
    }
