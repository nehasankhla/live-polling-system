import React, { useState, useEffect } from 'react';

function TeacherDashboard({ socket, onBack }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [duration, setDuration] = useState(60);
  const [students, setStudents] = useState([]);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [results, setResults] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    // Listen for students update
    socket.on('students:update', (studentsList) => {
      setStudents(studentsList);
      setTotalStudents(studentsList.length);
    });

    // Listen for poll started
    socket.on('poll:started', (poll) => {
      setCurrentPoll(poll);
      setQuestion('');
      setOptions(['', '', '', '']);
    });

    // Listen for poll results
    socket.on('poll:results', (data) => {
      setResults(data.results);
      setTotalStudents(data.totalStudents);
    });

    // Listen for poll closed
    socket.on('poll:closed', (data) => {
      setResults(data.results);
      setTotalStudents(data.totalStudents);
      setCurrentPoll(null);
    });

    // Listen for initial poll state
    socket.on('poll:state', (state) => {
      if (state.currentPoll) {
        setCurrentPoll(state.currentPoll);
      }
      if (state.students) {
        setStudents(state.students);
        setTotalStudents(state.students.length);
      }
      if (state.results) {
        setResults(state.results);
      }
    });

    return () => {
      socket.off('students:update');
      socket.off('poll:started');
      socket.off('poll:results');
      socket.off('poll:closed');
      socket.off('poll:state');
    };
  }, [socket]);

  const handleCreatePoll = () => {
    const validOptions = options.filter(opt => opt.trim() !== '');
    
    if (question.trim() === '' || validOptions.length < 2) {
      alert('Please enter a question and at least 2 options');
      return;
    }

    socket.emit('poll:create', {
      question: question.trim(),
      options: validOptions,
      duration: parseInt(duration)
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveStudent = (studentId) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      socket.emit('student:remove', studentId);
    }
  };

  const calculatePercentage = (optionId) => {
    if (totalStudents === 0) return 0;
    return Math.round((results[optionId] || 0) / totalStudents * 100);
  };

  const canCreatePoll = !currentPoll;

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h2>Teacher Dashboard</h2>
        <button className="back-btn" onClick={onBack}>Back</button>
      </div>

      <div className="dashboard-content">
        {/* Poll Creation Section */}
        <div className="poll-section">
          <h3 className="section-title">
            {currentPoll ? 'Active Poll' : 'Create New Poll'}
          </h3>

          {!currentPoll ? (
            <div className="poll-creation">
              <textarea
                placeholder="Enter your question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              {options.map((option, index) => (
                <div key={index} className="option-input-group">
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                </div>
              ))}

              <div className="duration-input">
                <label>Poll Duration (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <button
                className="create-poll-btn"
                onClick={handleCreatePoll}
                disabled={!canCreatePoll}
              >
                Launch Poll
              </button>
            </div>
          ) : (
            <div className="poll-results">
              <div className="results-question">{currentPoll.question}</div>
              {currentPoll.options.map((option) => (
                <div key={option.id} className="result-item">
                  <div className="result-label">
                    <span>{option.text}</span>
                    <span>{results[option.id] || 0} votes</span>
                  </div>
                  <div className="result-bar-container">
                    <div
                      className="result-bar"
                      style={{ width: `${calculatePercentage(option.id)}%` }}
                    >
                      {calculatePercentage(option.id) > 0 && `${calculatePercentage(option.id)}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!currentPoll && Object.keys(results).length > 0 && (
            <div className="poll-results">
              <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>
                Last Poll Results
              </h4>
              {Object.entries(results).map(([optionId, count]) => (
                <div key={optionId} className="result-item">
                  <div className="result-label">
                    <span>Option {parseInt(optionId) + 1}</span>
                    <span>{count} votes</span>
                  </div>
                  <div className="result-bar-container">
                    <div
                      className="result-bar"
                      style={{ width: `${calculatePercentage(optionId)}%` }}
                    >
                      {calculatePercentage(optionId) > 0 && `${calculatePercentage(optionId)}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Students Section */}
        <div className="students-section">
          <h3 className="section-title">Students ({students.length})</h3>
          {students.length === 0 ? (
            <div className="no-data">No students joined yet</div>
          ) : (
            <div className="students-list">
              {students.map((student) => (
                <div key={student.id} className="student-item">
                  <div className="student-info">
                    <span className="student-name">{student.name}</span>
                    <span className={`answer-status ${student.hasAnswered ? 'answered' : 'pending'}`}>
                      {student.hasAnswered ? 'Answered' : 'Pending'}
                    </span>
                  </div>
                  <button
                    className="remove-student-btn"
                    onClick={() => handleRemoveStudent(student.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
