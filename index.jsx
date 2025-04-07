import React, { useState, useEffect } from 'react';
import { Clock, User, Users, BarChart2, Settings, Edit2, X, Check, PlusCircle } from 'lucide-react';

const RunningTimerApp = () => {
  // State for app
  const [activeTab, setActiveTab] = useState('team');
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedDistance, setSelectedDistance] = useState('100m');
  const [activeIndividualRunner, setActiveIndividualRunner] = useState(null);
  const [editingRunnerId, setEditingRunnerId] = useState(null);
  const [newRunnerName, setNewRunnerName] = useState('');
  
  // Sample team data
  const [runners, setRunners] = useState([
    { id: 1, name: 'Alex Johnson', finished: false, finishTime: null },
    { id: 2, name: 'Sam Williams', finished: false, finishTime: null },
    { id: 3, name: 'Jamie Smith', finished: false, finishTime: null },
    { id: 4, name: 'Taylor Brown', finished: false, finishTime: null },
    { id: 5, name: 'Morgan Davis', finished: false, finishTime: null },
  ]);

  // History data
  const [history, setHistory] = useState([
    { id: 1, date: '2025-04-01', distance: '100m', runner: 'Alex Johnson', time: 12560 },
    { id: 2, date: '2025-04-01', distance: '100m', runner: 'Sam Williams', time: 13050 },
    { id: 3, date: '2025-03-28', distance: '200m', runner: 'Alex Johnson', time: 28900 },
    { id: 4, date: '2025-03-28', distance: '400m', runner: 'Sam Williams', time: 73300 },
  ]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10);
    } else if (!isRunning && startTime) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Format time (ms to MM:SS.ms)
  const formatTime = (timeMs) => {
    if (!timeMs) return '00:00.00';
    
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const ms = Math.floor((timeMs % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Calculate pace (minutes per kilometer)
  const calculatePace = (timeMs, distance) => {
    // Extract the numeric part of the distance
    let distanceValue = parseFloat(distance.replace(/[^0-9.]/g, ''));
    let distanceUnit = distance.replace(/[0-9.]/g, '');
    
    // Convert distance to kilometers
    let distanceInKm;
    if (distanceUnit === 'm') {
      distanceInKm = distanceValue / 1000;
    } else if (distanceUnit === 'km') {
      distanceInKm = distanceValue;
    } else {
      return 'N/A'; // Unknown unit
    }
    
    // If distance is too small, avoid division by zero or unrealistic paces
    if (distanceInKm < 0.01) {
      return 'N/A';
    }
    
    // Calculate pace in milliseconds per kilometer
    const paceMs = timeMs / distanceInKm;
    
    // Convert to minutes and seconds
    const paceMinutes = Math.floor(paceMs / 60000);
    const paceSeconds = Math.floor((paceMs % 60000) / 1000);
    
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}/km`;
  };

  // Handle start team timer
  const startTeamTimer = () => {
    // Reset all runners
    setRunners(runners.map(runner => ({ ...runner, finished: false, finishTime: null })));
    
    setStartTime(Date.now());
    setIsRunning(true);
  };

  // Handle stop team timer
  const stopTeamTimer = () => {
    setIsRunning(false);
    
    // Add results to history
    const newHistoryItems = runners
      .filter(runner => runner.finished)
      .map(runner => ({
        id: Math.max(...history.map(h => h.id), 0) + 1,
        date: new Date().toISOString().split('T')[0],
        distance: selectedDistance,
        runner: runner.name,
        time: runner.finishTime - startTime
      }));
    
    setHistory([...history, ...newHistoryItems]);
  };

  // Handle runner finish
  const handleRunnerFinish = (id) => {
    if (!isRunning) return;
    
    setRunners(runners.map(runner => 
      runner.id === id ? { ...runner, finished: true, finishTime: Date.now() } : runner
    ));
  };

  // Handle individual runner click
  const handleIndividualRunnerClick = (runnerId) => {
    const runner = runners.find(r => r.id === runnerId);
    
    if (!runner) return;
    
    // If editing mode is active, don't start/stop timer
    if (editingRunnerId !== null) return;
    
    // If already timing this runner, stop the timer
    if (isRunning && activeIndividualRunner === runnerId) {
      setIsRunning(false);
      setActiveIndividualRunner(null);
      
      // Add to history
      const newHistoryItem = {
        id: Math.max(...history.map(h => h.id), 0) + 1,
        date: new Date().toISOString().split('T')[0],
        distance: selectedDistance,
        runner: runner.name,
        time: elapsedTime
      };
      
      setHistory([...history, newHistoryItem]);
    } 
    // If timing another runner, stop and save that one first
    else if (isRunning && activeIndividualRunner !== null) {
      const currentRunner = runners.find(r => r.id === activeIndividualRunner);
      
      // Save current runner's time
      const newHistoryItem = {
        id: Math.max(...history.map(h => h.id), 0) + 1,
        date: new Date().toISOString().split('T')[0],
        distance: selectedDistance,
        runner: currentRunner?.name || 'Unknown Runner',
        time: elapsedTime
      };
      
      setHistory([...history, newHistoryItem]);
      
      // Start timing new runner
      setStartTime(Date.now());
      setElapsedTime(0);
      setActiveIndividualRunner(runnerId);
    }
    // If not timing anyone, start timing this runner
    else {
      setStartTime(Date.now());
      setElapsedTime(0);
      setIsRunning(true);
      setActiveIndividualRunner(runnerId);
    }
  };

  // Handle editing a runner's name
  const handleEditRunner = (id, newName) => {
    if (newName.trim() === '') return;
    
    setRunners(runners.map(runner => 
      runner.id === id ? { ...runner, name: newName } : runner
    ));
    setEditingRunnerId(null);
  };
  
  // Handle adding a new runner
  const handleAddRunner = () => {
    if (newRunnerName.trim() === '') return;
    
    const newRunner = {
      id: Math.max(...runners.map(r => r.id), 0) + 1,
      name: newRunnerName,
      finished: false,
      finishTime: null
    };
    
    setRunners([...runners, newRunner]);
    setNewRunnerName('');
  };
  
  // Handle deleting a runner
  const handleDeleteRunner = (id) => {
    setRunners(runners.filter(runner => runner.id !== id));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Running Timer App</h1>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto">
        {activeTab === 'manage-runners' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage Runners</h2>
              <button 
                className="text-blue-500 flex items-center gap-1"
                onClick={() => setActiveTab('team')}
              >
                <X size={16} />
                <span>Close</span>
              </button>
            </div>
            
            <div className="border rounded p-4 mb-4">
              <h3 className="font-semibold mb-3">Add New Runner</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded"
                  placeholder="Enter runner name"
                  value={newRunnerName}
                  onChange={(e) => setNewRunnerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRunner()}
                />
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-1"
                  onClick={handleAddRunner}
                >
                  <PlusCircle size={16} />
                  <span>Add</span>
                </button>
              </div>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-3">Current Runners</h3>
              <div className="grid gap-2">
                {runners.map((runner) => (
                  <div 
                    key={runner.id}
                    className="border p-3 rounded flex justify-between items-center"
                  >
                    {editingRunnerId === runner.id ? (
                      <input
                        type="text"
                        className="flex-1 p-1 border rounded mr-2"
                        defaultValue={runner.name}
                        autoFocus
                        onBlur={(e) => handleEditRunner(runner.id, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEditRunner(runner.id, e.target.value)}
                      />
                    ) : (
                      <span>{runner.name}</span>
                    )}
                    
                    <div className="flex gap-2">
                      {editingRunnerId === runner.id ? (
                        <button
                          className="text-green-500 p-1 rounded hover:bg-green-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = e.target.closest('div').previousSibling;
                            handleEditRunner(runner.id, input.value);
                          }}
                        >
                          <Check size={18} />
                        </button>
                      ) : (
                        <button
                          className="text-blue-500 p-1 rounded hover:bg-blue-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRunnerId(runner.id);
                          }}
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                      
                      <button
                        className="text-red-500 p-1 rounded hover:bg-red-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRunner(runner.id);
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Team Timer</h2>
              
              <div className="flex items-center gap-4 mb-4">
                <select 
                  className="p-2 border rounded"
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(e.target.value)}
                >
                  <option value="50m">50m</option>
                  <option value="100m">100m</option>
                  <option value="200m">200m</option>
                  <option value="400m">400m</option>
                  <option value="1km">1km</option>
                  <option value="2km">2km</option>
                  <option value="3km">3km</option>
                  <option value="5km">5km</option>
                </select>
                
                <div className="text-3xl font-mono bg-gray-100 p-2 rounded">
                  {formatTime(elapsedTime)}
                </div>
                
                {!isRunning ? (
                  <button 
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    onClick={startTeamTimer}
                  >
                    Start
                  </button>
                ) : (
                  <button 
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    onClick={stopTeamTimer}
                  >
                    Stop & Save
                  </button>
                )}
              </div>
            </div>
            
            <div className="border rounded p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Runners</h3>
                {!isRunning && (
                  <button 
                    className="text-blue-500 flex items-center gap-1 text-sm"
                    onClick={() => setActiveTab('manage-runners')}
                  >
                    <Edit2 size={16} />
                    <span>Edit Runners</span>
                  </button>
                )}
              </div>
              <div className="grid gap-2">
                {runners.map((runner) => (
                  <div 
                    key={runner.id}
                    className={`border p-3 rounded flex justify-between items-center cursor-pointer
                      ${runner.finished ? 'bg-green-100 border-green-300' : 'bg-white'}
                      ${isRunning && !runner.finished ? 'hover:bg-blue-50' : ''}`}
                    onClick={() => handleRunnerFinish(runner.id)}
                  >
                    <span>{runner.name}</span>
                    {runner.finished ? (
                      <span className="font-mono">
                        {formatTime(runner.finishTime - startTime)}
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        {isRunning ? 'Tap when finished' : 'Waiting'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'individual' && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Individual Timer</h2>
            
            <div className="flex flex-col items-center gap-6">
              <select 
                className="p-2 border rounded w-full max-w-xs"
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(e.target.value)}
              >
                <option value="50m">50m</option>
                <option value="100m">100m</option>
                <option value="200m">200m</option>
                <option value="400m">400m</option>
                <option value="1km">1km</option>
                <option value="2km">2km</option>
                <option value="3km">3km</option>
                <option value="5km">5km</option>
              </select>
              
              <div className="text-5xl font-mono bg-gray-100 p-4 rounded-lg w-full text-center">
                {formatTime(elapsedTime)}
              </div>
              
              <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Individual Runners</h3>
                  {!isRunning && (
                    <button 
                      className="text-blue-500 flex items-center gap-1 text-sm"
                      onClick={() => setActiveTab('manage-runners')}
                    >
                      <Edit2 size={16} />
                      <span>Edit Runners</span>
                    </button>
                  )}
                </div>
                <div className="grid gap-2">
                  {runners.map((runner) => {
                    const isTimingThisRunner = isRunning && startTime && runner.id === runners.find(r => r.id === activeIndividualRunner)?.id;
                    return (
                      <div 
                        key={runner.id}
                        className={`border p-4 rounded flex justify-between items-center cursor-pointer
                          ${isTimingThisRunner ? 'bg-blue-100 border-blue-300' : 'bg-white'}
                          hover:bg-gray-50`}
                        onClick={() => handleIndividualRunnerClick(runner.id)}
                      >
                        <span className="text-lg">{runner.name}</span>
                        <span className="font-mono">
                          {isTimingThisRunner ? 'RUNNING' : 'Click to Start/Stop'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">History</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Date</th>
                    <th className="py-2 px-4 text-left">Runner</th>
                    <th className="py-2 px-4 text-left">Distance</th>
                    <th className="py-2 px-4 text-left">Time</th>
                    <th className="py-2 px-4 text-left">Pace</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id} className="border-b">
                      <td className="py-2 px-4">{entry.date}</td>
                      <td className="py-2 px-4">{entry.runner}</td>
                      <td className="py-2 px-4">{entry.distance}</td>
                      <td className="py-2 px-4 font-mono">{formatTime(entry.time)}</td>
                      <td className="py-2 px-4 font-mono">{calculatePace(entry.time, entry.distance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
      {/* Navigation */}
      <nav className="bg-white border-t">
        <div className="flex">
          <button 
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${activeTab === 'team' ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={20} />
            <span className="text-xs">Team</span>
          </button>
          
          <button 
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${activeTab === 'individual' ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('individual')}
          >
            <User size={20} />
            <span className="text-xs">Individual</span>
          </button>
          
          <button 
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('history')}
          >
            <BarChart2 size={20} />
            <span className="text-xs">History</span>
          </button>
          
          <button 
            className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-500"
          >
            <Settings size={20} />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default RunningTimerApp;