import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where,
  arrayUnion 
} from 'firebase/firestore';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged
} from 'firebase/auth';
import { 
  CheckCircle2, Circle, Calendar, Trash2, Plus, 
  AlertCircle, Clock, LayoutList, X, Smartphone, Download, Loader2, LogOut, Lock, Mail,
  Pencil // <-- Add this
} from 'lucide-react';

// ==========================================
// REPLACE VALUES BELOW WITH YOUR FIREBASE KEYS
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA_CTEkpAHGqBd-SUZ9wCLWGKPJcZaoU94",
  authDomain: "task-tracker-bfda7.firebaseapp.com",
  projectId: "task-tracker-bfda7",
  storageBucket: "task-tracker-bfda7.firebasestorage.app",
  messagingSenderId: "963040600090",
  appId: "1:963040600090:web:e417dbf779ead6b3e171a3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const [updateText, setUpdateText] = useState({}); // Stores update text per task ID
  const [deletingTaskId, setDeletingTaskId] = useState(null);


  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '' });

  // Listen for user authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync user tasks from Firestore
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
      setTasksLoading(false);
    }, (error) => {
      console.error("Firestore error: ", error);
      setTasksLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  //const handleAddTask = async (e) => {
    //e.preventDefault();
    //if (!newTask.title.trim() || !user) return;

    //try {
      //await addDoc(collection(db, 'tasks'), {
        //userId: user.uid,
        //title: newTask.title.trim(),
        //description: newTask.description.trim(),
        //deadline: newTask.deadline || null,
        //completed: false,
        //createdAt: new Date().toISOString()
      //});
      //setNewTask({ title: '', description: '', deadline: '' });
      //setIsModalOpen(false);
    //} catch (error) {
      //console.error("Error adding task: ", error);
    //}
  //};

  // Function that will add the edit task ability
  const handleSaveTask = async (e) => {
  e.preventDefault();
  if (!newTask.title.trim() || !user) return;

  try {
    if (editingTaskId) {
      // UPDATE EXISTING TASK
      await updateDoc(doc(db, 'tasks', editingTaskId), {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        deadline: newTask.deadline || null,
      });
    } else {
      // ADD NEW TASK
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        deadline: newTask.deadline || null,
        completed: false,
        createdAt: new Date().toISOString()
      });
    }

    // Reset state & close modal
    setNewTask({ title: '', description: '', deadline: '' });
    setEditingTaskId(null);
    setIsModalOpen(false);
  } catch (error) {
    console.error("Error saving task: ", error);
  }
};
  
    //Function to add update
    const handleAddUpdate = async (taskId) => {
    const text = updateText[taskId];
    if (!text || !text.trim()) return;
    
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        updates: arrayUnion({
          text: text.trim(),
          createdAt: new Date().toISOString()
        })
      });
    
      // Clear input for this task
      setUpdateText(prev => ({ ...prev, [taskId]: '' }));
    } catch (error) {
      console.error("Error adding update: ", error);
    }
  };
  
  
    // Funtion to add the edit button to the task list and allow the user to edit the task title, description, and deadline
      const handleStartEdit = (task) => {
      setEditingTaskId(task.id);
      setNewTask({
        title: task.title,
        description: task.description || '',
        deadline: task.deadline || ''
      });
      setIsModalOpen(true);
    };
    



  const toggleTaskStatus = async (id, currentStatus) => {
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    try {
      await updateDoc(doc(db, 'tasks', id), { completed: !currentStatus });
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  //const deleteTask = async (id) => {
  //  if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
  //  try {
  //    await deleteDoc(doc(db, 'tasks', id));
  //  } catch (error) {
  //    console.error("Error deleting task: ", error);
  //  }
  //};

  //new delete task function that asks confirmation
  const deleteTask = async (id) => {
  // ADD THIS LINE AT THE TOP:
  if (!window.confirm("Are you sure you want to delete this task?")) return;

  if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
  try {
    await deleteDoc(doc(db, 'tasks', id));
  } catch (error) {
    console.error("Error deleting task: ", error);
  }
};


  const getPriorityStatus = (deadline) => {
    if (!deadline) return { label: 'No Deadline', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    const now = new Date();
    const diffHours = (new Date(deadline) - now) / (1000 * 60 * 60);

    if (diffHours < 0) return { label: 'Overdue', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle };
    if (diffHours < 24) return { label: 'Urgent', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock };
    if (diffHours < 72) return { label: 'High', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock };
    return { label: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Calendar };
  };

  const tabCounts = useMemo(() => {
    const now = new Date();
    return {
      all: tasks.length,
      overdue: tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now).length,
      finished: tasks.filter(t => t.completed).length
    };
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];
    if (activeTab === 'finished') filtered = filtered.filter(t => t.completed);
    else if (activeTab === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now);
    }

    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.deadline && !b.deadline) return new Date(b.createdAt) - new Date(a.createdAt);
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  }, [tasks, activeTab]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateString));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <LayoutList className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h1>
            <p className="text-slate-500 text-sm mt-1">Log in to manage your private tasks</p>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="h-5 w-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ color: '#000000', backgroundColor: '#ffffff' }} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="h-5 w-5 text-slate-400 absolute left-3 top-3" />
                <input
                 type="password"
                 required
                 minLength={6}
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 style={{ color: '#000000', backgroundColor: '#ffffff' }}  
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm mt-2"
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
              className="text-sm text-indigo-600 hover:underline font-medium"
            >
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 antialiased" style={{ WebkitTapHighlightColor: 'transparent' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <LayoutList className="h-8 w-8 text-indigo-600" />
              Tasks
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Signed in as <span className="font-medium text-slate-700">{user.email}</span></p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-full text-sm font-medium shadow-sm active:scale-95 transition-transform"
            >
              <Download className="h-4 w-4 text-indigo-600" />
              <span className="hidden sm:inline">Install App</span>
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 bg-white border border-slate-200 rounded-full shadow-sm transition-colors"
              title="Log Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="border-b border-slate-200">
          <nav className="flex space-x-6 overflow-x-auto hide-scrollbar" aria-label="Tabs">
            {[
              { id: 'all', label: 'All Tasks', count: tabCounts.all },
              { id: 'overdue', label: 'Overdue', count: tabCounts.overdue },
              { id: 'finished', label: 'Finished', count: tabCounts.finished }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-3 min-h-[400px]">
          {tasksLoading ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
              <p>Syncing your private tasks...</p>
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center h-[300px]">
              <div className="bg-indigo-50 p-4 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                {activeTab === 'finished' ? "No finished tasks yet." : activeTab === 'overdue' ? "No overdue tasks. Great job!" : "All caught up!"}
              </h3>
              <p className="text-slate-500 text-sm">You have no tasks pending in this view.</p>
            </div>
          ) : (
            filteredAndSortedTasks.map(task => {
              const status = getPriorityStatus(task.deadline);
              const StatusIcon = status.icon || Calendar;
              
              return (
                <div key={task.id} className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-sm flex gap-3 sm:gap-4 ${
                  task.completed ? 'opacity-60 border-slate-100 bg-slate-50/50' : 'border-slate-200'
                }`}>
                  <button 
                    onClick={() => toggleTaskStatus(task.id, task.completed)}
                    className={`flex-shrink-0 mt-0.5 transition-colors p-1 -m-1 ${task.completed ? 'text-indigo-500' : 'text-slate-300'}`}
                  >
                    {task.completed ? <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" /> : <Circle className="h-6 w-6 sm:h-7 sm:w-7" />}
                  </button>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 mb-1">
                      <h3 className={`text-base sm:text-lg font-medium truncate ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </h3>
                      {!task.completed && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap w-fit ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className={`text-sm mb-3 line-clamp-2 ${task.completed ? 'text-slate-400' : 'text-slate-600'}`}>
                        {task.description}
                      </p>
                    )}

                    {/* UPDATES SECTION */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Updates</h4>

                      {/* List existing updates */}
                      {task.updates && task.updates.length > 0 ? (
                        <div className="space-y-1.5 mb-3">
                          {task.updates.map((upd, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded-lg text-xs text-slate-700 flex justify-between items-start">
                              <span>{upd.text}</span>
                              <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">
                                {formatDate(upd.createdAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No updates added yet.</p>
                      )}

                      {/* Add new update input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a progress update..."
                          value={updateText[task.id] || ''}
                          onChange={(e) => setUpdateText({ ...updateText, [task.id]: e.target.value })}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddUpdate(task.id)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-medium rounded-lg transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>

                    
                    <div className="flex items-center justify-between mt-3">
                      {task.deadline ? (
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${task.completed ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(task.deadline)}
                        </div>
                      ) : <div />}
                      
                      
                    </div>
                    <div className="flex items-center gap-1">
                      {/* EDIT BUTTON */}
                      <button 
                        onClick={() => handleStartEdit(task)} 
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-2 -m-2 rounded-full"
                        title="Edit Task"
                      >
                        <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>

                      {/* TRASH BUTTON */}
                      <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 -m-2 rounded-full">
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 bg-indigo-600 text-white rounded-2xl sm:rounded-full p-4 shadow-xl active:scale-95 transition-all z-40"
      >
        <Plus className="h-7 w-7 sm:h-8 sm:w-8" />
      </button>
      <button
        onClick={() => {
          setEditingTaskId(null);
          setNewTask({ title: '', description: '', deadline: '' });
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6..."
      >
        <Plus className="h-7 w-7 sm:h-8 sm:w-8" />
      </button>
      

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3 sm:py-5 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-2 -m-2 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto">
              <form id="add-task-form" onSubmit={handleSaveTask} className="space-y-5">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">Task Title *</label>
                  <input
                    id="title"
                    type="text"
                    required
                    autoFocus
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                    placeholder="E.g., File quarterly taxes"
                  />
                </div>
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
                  <input
                    id="deadline"
                    type="datetime-local"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 text-base"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">Description (Optional)</label>
                  <textarea
                    id="description"
                    rows="3"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base resize-none"
                    placeholder="Add details..."
                  />
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl">Cancel</button>
              <button type="submit" form="add-task-form" className="flex-[2] bg-indigo-600 text-white text-sm font-medium py-3.5 px-6 rounded-xl">Save Task</button>
            </div>
          </div>
        </div>
      )}

      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsInstallModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden">
            <div className="bg-indigo-600 p-6 text-center text-white relative">
              <button onClick={() => setIsInstallModalOpen(false)} className="absolute top-4 right-4 text-white/80 p-1"><X className="h-5 w-5" /></button>
              <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-90" />
              <h2 className="text-xl font-bold">Install on Android</h2>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-600">
              <p>1. Open this page in <strong>Google Chrome</strong>.</p>
              <p>2. Tap the 3-dot menu (⋮) in Chrome.</p>
              <p>3. Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</p>
              <button onClick={() => setIsInstallModalOpen(false)} className="w-full bg-slate-100 text-slate-800 font-medium py-3 rounded-xl mt-4">Got it</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}
