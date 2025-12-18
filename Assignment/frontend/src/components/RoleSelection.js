import React from 'react';

function RoleSelection({ onSelectRole }) {
  return (
    <div className="role-selection">
      <h1>Which user type are you?</h1>
      <div className="role-buttons">
        <button className="role-btn" onClick={() => onSelectRole('student')}>
          I am Student
        </button>
        <button className="role-btn" onClick={() => onSelectRole('teacher')}>
          I am Teacher
        </button>
      </div>
    </div>
  );
}

export default RoleSelection;
