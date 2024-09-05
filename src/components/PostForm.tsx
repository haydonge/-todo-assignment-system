import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';

interface Post {
  id?: number;
  title: string;
  content: string;
  userId: number;
}

interface PostFormProps {
  post?: Post;
  open: boolean;
  onClose: () => void;
  onSubmit: (post: Post) => void;
}

export const PostForm: React.FC<PostFormProps> = ({ post, open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Post>({ title: '', content: '', userId: 0 });

  useEffect(() => {
    if (post) {
      setFormData(post);
    } else {
      setFormData({ title: '', content: '', userId: 0 });
    }
  }, [post]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'userId' ? parseInt(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-medium mb-4">{post ? 'Edit Post' : 'Add New Post'}</h2>
        <div className="mb-4">
          <Input
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <Textarea
            name="content"
            placeholder="Content"
            value={formData.content}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <Input
            name="userId"
            type="number"
            placeholder="User ID"
            value={formData.userId}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button type="submit">
            {post ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};