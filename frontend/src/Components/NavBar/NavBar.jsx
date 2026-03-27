import { NavLink } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import marvelLogo from '../../assets/images/Marvel-Logo.png';

function NavBar() {
    return (
        <Navbar expand="lg" className="p-1 mb-2" bg="light" variant="light">
            <Navbar.Brand href="/">
                <img 
                src={marvelLogo}
                alt="Marvel Logo" 
                style={{ height: '40px' }}
                />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav>
                    <Nav.Link as={NavLink} to="/AllCharacters" activeclassname="active">
                        All Characters
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/MyTeam" activeclassname="active">
                        My Team
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/Login" activeclassname="active">
                        Login
                    </Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
}


export default NavBar;