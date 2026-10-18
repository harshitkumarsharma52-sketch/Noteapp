import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:3000/notes";

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Read
  async function fetchNotes() {
    const res = await axios.get(API);
    setNotes(res.data.notes);
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  // Create
  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await axios.post(API, { title, content });
    setTitle("");
    setContent("");
    fetchNotes();
  }

  // Delete (pehle exit animation, phir API call)
  function handleDelete(id) {
    setRemovingId(id);
    setTimeout(async () => {
      await axios.delete(`${API}/${id}`);
      setRemovingId(null);
      fetchNotes();
    }, 380);
  }

  // Update (PATCH)
  function startEdit(note) {
    setEditingId(note._id);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpdate(id) {
    if (!editTitle.trim() || !editContent.trim()) return;
    await axios.patch(`${API}/${id}`, {
      title: editTitle,
      content: editContent,
    });
    setEditingId(null);
    fetchNotes();
  }

  // Spotlight effect: cursor position CSS ko do
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div className="app">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <main className="container">
        <header className="header">
          <span className="badge">✦ Notes App</span>
          <h1>
            Think it. <span className="gradient-text">Write it.</span>
          </h1>
          <p className="subtitle">
            {notes.length} {notes.length === 1 ? "note" : "notes"} saved
          </p>
        </header>

        <form className="note-form" onSubmit={handleSubmit}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note ka title"
            maxLength={60}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Kya likhna hai..."
            rows={3}
          />
          <div className="form-footer">
            <span className="counter">{content.length} characters</span>
            <button type="submit" disabled={!title.trim() || !content.trim()}>
              <span>Add Note</span>
            </button>
          </div>
        </form>

        {notes.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📝</div>
            <h3>Abhi koi note nahi hai</h3>
            <p>Upar form se apna pehla note banao.</p>
          </div>
        ) : (
          <section className="notes-grid">
            {notes.map((note, i) => (
              <article
                key={note._id}
                className={`note-card ${
                  removingId === note._id ? "removing" : ""
                } ${editingId === note._id ? "editing" : ""}`}
                style={{ "--i": i, "--hue": (i * 47 + 255) % 360 }}
                onMouseMove={handleMouseMove}
              >
                {editingId === note._id ? (
                  <>
                    <input
                      className="edit-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={60}
                      autoFocus
                    />
                    <textarea
                      className="edit-textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                    />
                    <div className="card-actions">
                      <button
                        className="save-btn"
                        onClick={() => handleUpdate(note._id)}
                        disabled={!editTitle.trim() || !editContent.trim()}
                      >
                        Save
                      </button>
                      <button className="cancel-btn" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>{note.title}</h3>
                    <p>{note.content}</p>
                    <div className="card-actions">
                      <button
                        className="edit-btn"
                        onClick={() => startEdit(note)}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(note._id)}
                        aria-label="Delete note"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;