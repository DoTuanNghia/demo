import { useState, useEffect } from 'react'
import type { DragEvent } from 'react'
import './index.css'

// Task Interface matching the Spring Boot backend Entity
export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  createdAt?: string;
}

// Modal mode
type ModalMode = 'CREATE' | 'EDIT' | 'CLOSED';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [modalMode, setModalMode] = useState<ModalMode>('CLOSED');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'DONE',
    dueDate: ''
  });

  // Fetch Tasks on Load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      // Calls standard local /api/tasks (Vite proxy redirects this to http://localhost:8080/api/tasks)
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks. Make sure your Spring Boot backend is running.');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      status: 'TODO',
      dueDate: ''
    });
    setModalMode('CREATE');
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      dueDate: task.dueDate || ''
    });
    setModalMode('EDIT');
  };

  const closeModal = () => {
    setModalMode('CLOSED');
    setSelectedTask(null);
  };

  // Submit Handler for Creating/Updating Tasks
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const url = modalMode === 'CREATE' ? '/api/tasks' : `/api/tasks/${selectedTask?.id}`;
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${modalMode === 'CREATE' ? 'create' : 'update'} task`);
      }

      await fetchTasks();
      closeModal();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering openEditModal
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- HTML5 Drag & Drop Interface ---
  
  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: number) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Required to drop
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;
    
    const taskId = parseInt(taskIdStr, 10);
    const draggedTask = tasks.find(t => t.id === taskId);
    
    if (draggedTask && draggedTask.status !== targetStatus) {
      // Optimistic UI Update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: targetStatus })
        });

        if (!response.ok) {
          throw new Error('Failed to update status on server');
        }
      } catch (err) {
        console.error('Failed to update status, reverting...', err);
        // Rollback state on failure
        fetchTasks();
      }
    }
  };

  // Filter tasks by status for columns
  const getTasksByStatus = (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    return tasks.filter(t => t.status === status);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-section">
          <h1>Productivity Board</h1>
          <p>Organize, track, and execute your daily operations</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
          </svg>
          New Task
        </button>
      </header>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          color: '#fca5a5',
          padding: '1rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button onClick={fetchTasks} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            Retry Connection
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <p>Connecting to backend API...</p>
        </div>
      ) : (
        <main className="board-container">
          {/* TODO COLUMN */}
          <div 
            className="board-column"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'TODO')}
          >
            <div className="column-header todo-border">
              <div className="column-title-container">
                <span className="todo-text">●</span>
                <span className="column-title">Todo</span>
              </div>
              <span className="column-badge">{getTasksByStatus('TODO').length}</span>
            </div>
            <div className="cards-list">
              {getTasksByStatus('TODO').length === 0 ? (
                <div className="empty-state">
                  <span>No tasks</span>
                </div>
              ) : (
                getTasksByStatus('TODO').map(task => (
                  <div 
                    key={task.id} 
                    className="task-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openEditModal(task)}
                  >
                    <div className="card-top">
                      <h3 className="task-title">{task.title}</h3>
                      <button onClick={(e) => handleDeleteTask(task.id, e)} className="btn-danger">Delete</button>
                    </div>
                    <p className="task-desc">{task.description || 'No description provided.'}</p>
                    <div className="card-footer">
                      <div className="task-date">
                        <svg className="date-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>{task.dueDate ? task.dueDate : 'No due date'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* IN_PROGRESS COLUMN */}
          <div 
            className="board-column"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
          >
            <div className="column-header progress-border">
              <div className="column-title-container">
                <span className="progress-text">●</span>
                <span className="column-title">In Progress</span>
              </div>
              <span className="column-badge">{getTasksByStatus('IN_PROGRESS').length}</span>
            </div>
            <div className="cards-list">
              {getTasksByStatus('IN_PROGRESS').length === 0 ? (
                <div className="empty-state">
                  <span>Drag tasks here</span>
                </div>
              ) : (
                getTasksByStatus('IN_PROGRESS').map(task => (
                  <div 
                    key={task.id} 
                    className="task-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openEditModal(task)}
                  >
                    <div className="card-top">
                      <h3 className="task-title">{task.title}</h3>
                      <button onClick={(e) => handleDeleteTask(task.id, e)} className="btn-danger">Delete</button>
                    </div>
                    <p className="task-desc">{task.description || 'No description provided.'}</p>
                    <div className="card-footer">
                      <div className="task-date">
                        <svg className="date-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>{task.dueDate ? task.dueDate : 'No due date'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DONE COLUMN */}
          <div 
            className="board-column"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'DONE')}
          >
            <div className="column-header done-border">
              <div className="column-title-container">
                <span className="done-text">●</span>
                <span className="column-title">Done</span>
              </div>
              <span className="column-badge">{getTasksByStatus('DONE').length}</span>
            </div>
            <div className="cards-list">
              {getTasksByStatus('DONE').length === 0 ? (
                <div className="empty-state">
                  <span>Completed tasks</span>
                </div>
              ) : (
                getTasksByStatus('DONE').map(task => (
                  <div 
                    key={task.id} 
                    className="task-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openEditModal(task)}
                  >
                    <div className="card-top">
                      <h3 className="task-title" style={{ textDecoration: 'line-through', opacity: 0.7 }}>{task.title}</h3>
                      <button onClick={(e) => handleDeleteTask(task.id, e)} className="btn-danger">Delete</button>
                    </div>
                    <p className="task-desc" style={{ opacity: 0.6 }}>{task.description || 'No description provided.'}</p>
                    <div className="card-footer">
                      <div className="task-date">
                        <svg className="date-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>{task.dueDate ? task.dueDate : 'No due date'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}

      {/* CREATE & EDIT TASK MODAL */}
      {modalMode !== 'CLOSED' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'CREATE' ? 'Create New Task' : 'Edit Task'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Task Title *</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  required 
                  className="form-input"
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="form-textarea"
                  placeholder="Provide more context about this task..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select 
                  id="status" 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange} 
                  className="form-select"
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input 
                  type="date" 
                  id="dueDate" 
                  name="dueDate" 
                  value={formData.dueDate} 
                  onChange={handleInputChange} 
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'CREATE' ? 'Save Task' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
