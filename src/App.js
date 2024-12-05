import React from 'react';
import ToDoAssignmentSystem from './ToDoAssignmentSystem';
import ThemeProvider from './components/Theme/ThemeProvider';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <ToDoAssignmentSystem />
      </div>
    </ThemeProvider>
  );
}

export default App;
