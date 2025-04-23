## Marvel Character Full-Stack Application

## Overview
This project is a full-stack web application that allows users to interact with a backend API to manage Marvel characters.
It is built using React for the frontend and Flask with MySQL for the backend. The application supports CRUD operations (Create, Read, Update, Delete) on Marvel characters. 
Users can view a list of characters, view individual character details, create new characters, edit existing characters, and delete characters.

## Features
-  View all characters in cards.
-  View individual character details, including attributes like name, powers, and more.
-  Create a new character by filling out a form with details like name, abilities, and description.
-  Edit existing characters with pre-populated forms to update their information.
-  Delete characters with confirmation and visual feedback.
-  Responsive design, optimized for both desktop and mobile devices.
-  React Bootstrap components for UI design.

## Tech Stack
-  Frontend: React, React Bootstrap, React Router, Axios/Fetch
-  Backend: Flask, SQLAlchemy, MySQL
-  Database: MySQL (Marvel database with a characters table)

Backend Setup (Flask & MySQL)
Steps to Set Up the Backend
Clone the Repository
Clone the backend code into a folder called backend:

bash
Copy
Edit
git clone https://github.com/dela32/Marvel-Character-Full-Stack-Application.git backend
Create the Virtual Environment
Inside the backend folder, create a virtual environment:

bash
Copy
Edit
python -m venv venv
Install Dependencies
Install the necessary dependencies using requirements.txt:

bash
Copy
Edit
pip install -r requirements.txt
Database Configuration
Open server.py and add your MySQL password to the following lines:

python
Copy
Edit
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:YOUR_PASSWORD@localhost/marvel'
Replace YOUR_PASSWORD with your actual MySQL password.

Run the Backend Server
Start the Flask server to create the database and the characters table:

bash
Copy
Edit
python server.py
Populate the Database
Use the provided marvel_characters.sql file to populate the characters table with sample data. You can execute the SQL file using MySQL Workbench or the command line.

Verify the API
Test the backend by navigating to http://127.0.0.1:5000/characters to see all characters in JSON format.

Frontend Setup (React)
Steps to Set Up the Frontend
Create a React App
Inside the m7project folder, create a new React app:

bash
Copy
Edit
npx create-react-app frontend
Install Axios & React Bootstrap
Install the required dependencies for frontend development:

bash
Copy
Edit
npm install axios react-bootstrap bootstrap react-router-dom
React Components
The frontend is structured using React components for various tasks such as viewing characters, creating and updating them, and displaying success or error messages. React Router is used for navigation.

## Integrate Backend API
Use Axios or Fetch to make HTTP requests to the Flask backend to perform CRUD operations. These operations are performed on the Marvel characters.

## Styling
The app is styled using React Bootstrap components, and it is responsive for both mobile and desktop views.

Running the Project
Run the Backend
Navigate to the backend folder.

Activate the virtual environment.

Start the Flask server:

bash
Copy
Edit
python server.py
Run the Frontend
Navigate to the frontend folder.

Start the React development server:

bash
Copy
Edit
npm start
Open your browser and go to http://localhost:3000 to view the app.
