import React from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';

interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}

interface PostListProps {
  posts: Post[];
  onEdit: (post: Post) => void;
  onDelete: (id: number) => void;
}

export const PostList: React.FC<PostListProps> = ({ posts, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <h2 className="text-xl font-semibold">{post.title}</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-2">{post.content}</p>
            <p className="text-sm text-gray-500">Author ID: {post.userId}</p>
            <div className="mt-4">
              <Button onClick={() => onEdit(post)} className="mr-2">Edit</Button>
              <Button onClick={() => onDelete(post.id)} variant="destructive">Delete</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};