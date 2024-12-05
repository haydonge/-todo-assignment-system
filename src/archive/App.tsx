import React, { useState, useEffect } from 'react';
import { PostList } from './components/PostList';
import { PostForm } from './components/PostForm';
import { Button } from './components/ui/Button';

interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}

const API_URL = 'http://localhost:3000';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | undefined>(undefined);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const response = await fetch(`${API_URL}/posts`);
    const data = await response.json();
    setPosts(data);
  };

  const handleOpenForm = (post?: Post) => {
    setCurrentPost(post);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setCurrentPost(undefined);
    setIsFormOpen(false);
  };

  const handleSubmit = async (post: Post) => {
    if (post.id) {
      await fetch(`${API_URL}/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
    } else {
      await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
    }
    handleCloseForm();
    fetchPosts();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE' });
    fetchPosts();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Posts Management</h1>
      <Button onClick={() => handleOpenForm()} className="mb-4">Add New Post</Button>
      <PostList
        posts={posts}
        onEdit={handleOpenForm}
        onDelete={handleDelete}
      />
      <PostForm
        post={currentPost}
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default App;