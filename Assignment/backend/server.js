const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory data store
let currentPoll = null;
let students = new Map(); // socketId -> {name, hasAnswered, answer}
let pollResults = {};
let pollTimer = null;
let pollHistory = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Teacher joins
  socket.on('teacher:join', () => {
    socket.join('teacher');
    console.log('Teacher joined');
    
    // Send current state
    socket.emit('poll:state', {
      currentPoll,
      students: Array.from(students.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        hasAnswered: data.hasAnswered
      })),
      results: pollResults
    });
  });

  // Student joins
  socket.on('student:join', (name) => {
    // Check if name already exists
    const existingStudent = Array.from(students.values()).find(s => s.name === name);
    if (existingStudent) {
      socket.emit('student:name-taken');
      return;
    }

    students.set(socket.id, {
      name,
      hasAnswered: false,
      answer: null
    });

    socket.join('students');
    console.log(`Student ${name} joined`);

    // Notify teacher
    io.to('teacher').emit('students:update', Array.from(students.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      hasAnswered: data.hasAnswered
    })));

    // Send current poll to the new student
    if (currentPoll) {
      socket.emit('poll:active', currentPoll);
    }

    socket.emit('student:joined', { name });
  });

  // Teacher creates a poll
  socket.on('poll:create', (pollData) => {
    const { question, options, duration } = pollData;
    
    currentPoll = {
      question,
      options: options.map((opt, index) => ({ id: index, text: opt })),
      duration: duration || 60,
      startTime: Date.now()
    };

    pollResults = {};
    options.forEach((_, index) => {
      pollResults[index] = 0;
    });

    // Reset all students' answer status
    students.forEach((student) => {
      student.hasAnswered = false;
      student.answer = null;
    });

    // Broadcast poll to all students
    io.to('students').emit('poll:active', currentPoll);

    // Notify teacher
    io.to('teacher').emit('poll:started', currentPoll);

    console.log('New poll created:', currentPoll);

    // Set timer for auto-close
    if (pollTimer) {
      clearTimeout(pollTimer);
    }

    pollTimer = setTimeout(() => {
      closePoll();
    }, currentPoll.duration * 1000);
  });

  // Student submits answer
  socket.on('answer:submit', (data) => {
    const student = students.get(socket.id);
    
    if (!student || !currentPoll) {
      return;
    }

    if (student.hasAnswered) {
      socket.emit('answer:already-submitted');
      return;
    }

    student.hasAnswered = true;
    student.answer = data.answerId;

    // Update results
    if (pollResults[data.answerId] !== undefined) {
      pollResults[data.answerId]++;
    }

    console.log(`${student.name} answered: ${data.answerId}`);

    // Notify teacher about updated student list
    io.to('teacher').emit('students:update', Array.from(students.entries()).map(([id, studentData]) => ({
      id,
      name: studentData.name,
      hasAnswered: studentData.hasAnswered
    })));

    // Broadcast updated results to teacher
    io.to('teacher').emit('poll:results', {
      results: pollResults,
      totalStudents: students.size
    });

    // Check if all students have answered
    const allAnswered = Array.from(students.values()).every(s => s.hasAnswered);
    if (allAnswered && students.size > 0) {
      closePoll();
    }
  });

  // Teacher requests new poll (checking if allowed)
  socket.on('poll:check-new', () => {
    const canCreateNew = !currentPoll || checkIfAllStudentsAnswered();
    socket.emit('poll:can-create', canCreateNew);
  });

  // Teacher removes a student (bonus feature)
  socket.on('student:remove', (studentId) => {
    const student = students.get(studentId);
    if (student) {
      console.log(`Removing student: ${student.name}`);
      students.delete(studentId);
      
      // Notify the student
      io.to(studentId).emit('student:removed');
      
      // Update teacher's student list
      io.to('teacher').emit('students:update', Array.from(students.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        hasAnswered: data.hasAnswered
      })));
    }
  });

  // Teacher requests poll history (bonus feature)
  socket.on('poll:history', () => {
    socket.emit('poll:history-data', pollHistory);
  });

  // Client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const student = students.get(socket.id);
    if (student) {
      console.log(`Student ${student.name} left`);
      students.delete(socket.id);
      
      // Notify teacher
      io.to('teacher').emit('students:update', Array.from(students.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        hasAnswered: data.hasAnswered
      })));
    }
  });
});

// Helper function to close poll
function closePoll() {
  if (!currentPoll) return;

  console.log('Poll closed');

  // Save to history
  pollHistory.push({
    question: currentPoll.question,
    options: currentPoll.options,
    results: { ...pollResults },
    totalStudents: students.size,
    timestamp: new Date().toISOString()
  });

  // Broadcast results to everyone
  io.emit('poll:closed', {
    results: pollResults,
    totalStudents: students.size,
    question: currentPoll.question,
    options: currentPoll.options
  });

  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }

  currentPoll = null;
}

// Helper function to check if all students answered
function checkIfAllStudentsAnswered() {
  if (students.size === 0) return true;
  return Array.from(students.values()).every(s => s.hasAnswered);
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
