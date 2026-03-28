import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import http from '../../Services/http'
import { setToken } from '../../Services/auth'
import './Login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
        const res = await http.post('/auth/login', { email, password })
        setToken(res.data.token)
        navigate('/myteam')
    } catch (err) {
        setError(err.response?.data?.error || 'Login failed')
    }
    }

    return (
    <div className="Home">
        <div className="login-box">
        <h2 className="headerText">Welcome Back</h2>
        <form onSubmit={onSubmit} className="form-container">
            {error && <div className="alert alert-danger">{error}</div>}
            <input
              className="form-control mb-2"
              type="email"
              placeholder="Email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="form-control mb-2"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="btn btn-danger w-100">Login</button>
        </form>
        <div className="mt-2 text-center">
            No account? <Link to="/register" className="link-light">Register</Link>
        </div>
        </div>
    </div>
    )
    }
