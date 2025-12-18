import React, { useState, useEffect } from 'react';

function StudentDashboard({ socket, studentName, onJoin, onBack }) {
  const [name, setName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState('');
  const [activePoll, setActivePoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (studentName) {
      setName(studentName);
      setIsJoined(true);
    }
  }, [studentName]);

  useEffect(() => {
    // Listen for student joined confirmation
    socket.on('student:joined', (data) => {
      setIsJoined(true);
      onJoin(data.name);
      setError('');
    });

    // Listen for name taken error
    socket.on('student:name-taken', () => {
      setError('This name is already taken. Please choose another name.');
    });

    // Listen for active poll
    socket.on('poll:active', (poll) => {
      setActivePoll(poll);
      setSelectedOption(null);
      setHasSubmitted(false);
      setShowResults(false);
      setTimeRemaining(poll.duration);
    });

    // Listen for poll closed
    socket.on('poll:closed', (data) => {
      setShowResults(true);
      setResults(data);
      setActivePoll(null);
      setTimeRemaining(0);
    });

    // Listen for student removed
    socket.on('student:removed', () => {
      alert('You have been removed from the session by the teacher.');
      setIsJoined(false);
      setActivePoll(null);
      setShowResults(false);
      onBack();
    });

    return () => {
      socket.off('student:joined');
      socket.off('student:name-taken');
      socket.off('poll:active');
      socket.off('poll:closed');
      socket.off('student:removed');
    };
  }, [socket, onJoin, onBack]);

  // Timer countdown
  useEffect(() => {
    if (activePoll && !hasSubmitted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activePoll, hasSubmitted, timeRemaining]);

  const handleJoin = () => {
    if (name.trim() === '') {
      setError('Please enter your name');
      return;
    }

    socket.emit('student:join', name.trim());
  };

  const handleOptionSelect = (optionId) => {
    if (!hasSubmitted) {
      setSelectedOption(optionId);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) {
      alert('Please select an option');
      return;
    }

    socket.emit('answer:submit', { answerId: selectedOption });
    setHasSubmitted(true);
  };

  const calculatePercentage = (optionId, totalStudents) => {
    if (!results || totalStudents === 0) return 0;
    return Math.round((results.results[optionId] || 0) / totalStudents * 100);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isJoined) {
    return (
      <div className="student-dashboard">
        <div className="student-container">
          <div className="student-header">
            <h2>Student Portal</h2>
          </div>
          <div className="name-entry">
            <h3>Enter your name</h3>
            <div className="name-input-group">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <button className="join-btn" onClick={handleJoin}>
              Join Session
            </button>
            {error && <div className="error-message">{error}</div>}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="back-btn" onClick={onBack}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="student-container">
        <div className="student-header">
          <h2>Student Portal</h2>
          <div className="student-welcome">Welcome, {name}!</div>
        </div>

        {!activePoll && !showResults && (
          <div className="waiting-state">
            <h3>Waiting for teacher...</h3>
            <p>The teacher will launch a poll soon</p>
          </div>
        )}

        {activePoll && !hasSubmitted && (
          <div className="poll-question">
            <div className="question-text">{activePoll.question}</div>
            
            <div className={`timer ${timeRemaining <= 10 ? 'warning' : ''}`}>
              Time Remaining: {formatTime(timeRemaining)}
            </div>

            <div className="options-list">
              {activePoll.options.map((option) => (
                <div
                  key={option.id}
                  className={`option-item ${selectedOption === option.id ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option.id)}
                >
                  {option.text}
                </div>
              ))}
            </div>

            <button
              className="submit-answer-btn"
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null || timeRemaining === 0}
            >
              Submit Answer
            </button>
          </div>
        )}

        {hasSubmitted && !showResults && (
          <div className="waiting-state">
            <h3>Answer submitted!</h3>
            <p>Waiting for other students to answer...</p>
          </div>
        )}

        {showResults && results && (
          <div className="student-results">
            <h3>Poll Results</h3>
            <div className="results-question">{results.question}</div>
            {results.options.map((option) => (
              <div key={option.id} className="result-item">
                <div className="result-label">
                  <span>{option.text}</span>
                  <span>{results.results[option.id] || 0} votes</span>
                </div>
                <div className="result-bar-container">
                  <div
                    className="result-bar"
                    style={{ width: `${calculatePercentage(option.id, results.totalStudents)}%` }}
                  >
                    {calculatePercentage(option.id, results.totalStudents) > 0 && 
                      `${calculatePercentage(option.id, results.totalStudents)}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="back-btn" onClick={onBack}>Leave Session</button>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
