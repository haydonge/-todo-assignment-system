import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
const API_URL = 'http://localhost:3000';

function App() {
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState({ title: '', content: '', userId: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const response = await fetch(`${API_URL}/posts`);
    const data = await response.json();
    setPosts(data);
  };

  const handleOpen = (post = { title: '', content: '', userId: '' }) => {
    setCurrentPost(post);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentPost({ title: '', content: '', userId: '' });
  };

  const handleChange = (e) => {
    setCurrentPost({ ...currentPost, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (currentPost.id) {
      await fetch(`${API_URL}/posts/${currentPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPost),
      });
    } else {
      await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPost),
      });
    }
    handleClose();
    fetchPosts();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE' });
    fetchPosts();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Posts Management</h1>
      <Button onClick={() => handleOpen()} className="mb-4">Add New Post</Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Card key={post.id} className="shadow-md">
            <CardHeader>
              <h2 className="text-xl font-semibold">{post.title}</h2>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{post.content}</p>
              <p className="text-sm text-gray-500">Author ID: {post.userId}</p>
              <div className="mt-4">
                <Button onClick={() => handleOpen(post)} className="mr-2">Edit</Button>
                <Button onClick={() => handleDelete(post.id)} variant="destructive">Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{currentPost.id ? 'Edit Post' : 'Add New Post'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Title"
            type="text"
            fullWidth
            value={currentPost.title}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="content"
            label="Content"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={currentPost.content}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="userId"
            label="User ID"
            type="number"
            fullWidth
            value={currentPost.userId}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;