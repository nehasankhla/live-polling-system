# Live Polling System

A real-time polling application where teachers can create polls and students can vote in real-time.

## What is This?

This is a simple polling system with:
- **Teacher side**: Create polls and see live results
- **Student side**: Join and answer polls
- **Real-time updates**: Everything updates instantly using WebSockets

## Technology Used

- **Frontend**: React (for user interface)
- **Backend**: Node.js + Express + Socket.io (for server and real-time communication)

## Folder Structure

- backend folder: Contains server code (Node.js + Socket.io)
- frontend folder: Contains React application
- README.md: This file

## How to Run

### Step 1: Start the Backend Server

Open a terminal and run these commands:

```bash
cd backend
npm install
npm start
```

Backend will run on http://localhost:5000

### Step 2: Start the Frontend

Open another terminal and run:

```bash
cd frontend
npm install
npm start
```

Frontend will open automatically at http://localhost:3000

That's it! The app is now running.

## How to Use

### For Teachers:
1. Go to http://localhost:3000
2. Click **"I am Teacher"**
3. Enter your question and options
4. Click **"Launch Poll"**
5. Watch live results as students answer

### For Students:
1. Open http://localhost:3000 (in a new tab or another browser)
2. Click **"I am Student"**
3. Enter your name
4. Wait for teacher to launch a poll
5. Select your answer and click **"Submit"**
6. See the results!

## Features

Real-time communication with Socket.io
Teachers create polls with 2-6 options
Students join with unique names
60-second countdown timer
Live results update instantly
Poll auto-closes when everyone answers or time runs out
Teacher can remove students
Clean and simple interface

## Important Notes

- You need both backend and frontend running at the same time
- Each student needs a unique name
- Multiple students = open multiple browser tabs/windows
- Data is stored in memory (resets when server restarts)

## Troubleshooting

**Problem**: Can't connect?  
**Solution**: Make sure backend is running on port 5000

**Problem**: "Name already taken"?  
**Solution**: Each student needs a different name

**Problem**: Frontend won't start?  
**Solution**: Make sure you ran `npm install` first

## Need Help?

1. Make sure Node.js is installed on your computer
2. Run `npm install` in both backend and frontend folders
3. Start backend first, then frontend
4. Check that ports 3000 and 5000 are not being used by other apps
