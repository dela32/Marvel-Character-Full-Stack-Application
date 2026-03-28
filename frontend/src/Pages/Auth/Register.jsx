import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import http from '../../Services/http'
import { setToken } from '../../Services/auth'
import './Register.css'

export default function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const strength = getStrength(password)

    async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
        const res = await http.post('/auth/register', { email, password })
        setToken(res.data.token)
        navigate('/myteam') // or /login if you prefer
    } catch (err) {
        setError(err.response?.data?.error || 'Registration failed')
    } finally {
        setLoading(false)
    }
    }

    return (
    <div className="RegisterHero">
        <div className="register-container">
        <h1 className="register-title">Create Account</h1>

        <form onSubmit={onSubmit} className="register-box">
            {error && <div className="alert alert-danger mb-3">{error}</div>}

            <input
            className="form-control mb-3"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            />

            <div className="pwd-row mb-2">
            <input
                className="form-control"
                placeholder="Password (min 6)"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
                minLength={6}
            />
            <button
                type="button"
                className="btn btn-outline-secondary show-btn"
                onClick={()=>setShowPwd(s=>!s)}
                aria-label="Toggle password visibility"
            >
                {showPwd ? 'Hide' : 'Show'}
            </button>
            </div>

            {/* strength meter */}
            <div className="strength mb-3">
            <div className={`bar ${strength >= 1 ? 'on' : ''}`}></div>
            <div className={`bar ${strength >= 2 ? 'on' : ''}`}></div>
            <div className={`bar ${strength >= 3 ? 'on' : ''}`}></div>
            <span className="strength-label">
                {password ? strengthLabel(strength) : ' '}
            </span>
            </div>

            <button className="btn btn-marvel w-100" disabled={loading}>
            {loading ? 'Creating…' : 'Register'}
            </button>
        </form>

        <div className="mt-3 text-center">
            Have an account? <Link to="/login" className="link-light">Login</Link>
        </div>
        </div>
    </div>
    )
    }

    /* helpers */
    function getStrength(pwd) {
    let s = 0
    if (pwd.length >= 6) s++
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++
    if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) s++
    return s // 0..3
    }
    function strengthLabel(s) {
    return ['Weak', 'Okay', 'Strong'][s-1] || 'Weak'
    }
