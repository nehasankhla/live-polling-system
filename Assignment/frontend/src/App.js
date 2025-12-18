import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import RoleSelection from './components/RoleSelection';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import './App.css';

const SOCKET_URL = 'http://localhost:5000';

function App() {
  const [socket, setSocket] = useState(null);
  const [role, setRole] = useState(null);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    
    if (selectedRole === 'teacher') {
      socket.emit('teacher:join');
    }
  };

  const handleStudentJoin = (name) => {
    setStudentName(name);
  };

  const handleBackToRoleSelection = () => {
    setRole(null);
    setStudentName('');
  };

  if (!socket) {
    return <div className="loading">Connecting...</div>;
  }

  if (!role) {
    return <RoleSelection onSelectRole={handleRoleSelect} />;
  }

  if (role === 'teacher') {
    return <TeacherDashboard socket={socket} onBack={handleBackToRoleSelection} />;
  }

  if (role === 'student') {
    return (
      <StudentDashboard 
        socket={socket} 
        studentName={studentName}
        onJoin={handleStudentJoin}
        onBack={handleBackToRoleSelection}
      />
    );
  }

  return null;
}

export default App;
