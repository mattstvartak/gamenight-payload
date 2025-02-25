'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone } from "lucide-react";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: {
    url: string;
  };
}

async function getUser(username: string): Promise<User> {
  const response = await fetch(`/api/users?where[username][equals]=${username}&depth=1`);
  if (!response.ok) {
    throw new Error('User not found');
  }
  const { docs } = await response.json();
  if (!docs || docs.length === 0) {
    throw new Error('User not found');
  }
  return docs[0];
}

async function updateUser(username: string, data: Partial<User>): Promise<User> {
  const response = await fetch(`/api/users/${username}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser(resolvedParams.id);
        setUser(userData);
        setFormData(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [resolvedParams.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !user) return;

    try {
      const updatedUser = await updateUser(user.username, formData);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
      // Here you might want to show an error message to the user
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary" />
      </div>
    );
  }

  if (!user || !formData) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-2xl">Profile Information</CardTitle>
            <CardDescription>View and manage your personal details</CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              <Avatar className="w-24 h-24 border-4 border-background">
                {user.avatar ? (
                  <AvatarImage src={user.avatar.url} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              {isEditing && (
                <div className="flex-1">
                  <Label htmlFor="avatar" className="block mb-2">
                    Profile Picture
                  </Label>
                  <Input id="avatar" type="file" accept="image/*" className="cursor-pointer" />
                </div>
              )}
            </div>

            <div className="grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/20">{user.firstName}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/20">{user.lastName}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{user.email}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Phone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{user.phone || 'Not provided'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-1">
                  <User className="h-4 w-4" /> Username
                </Label>
                <div className="p-2 border rounded-md bg-muted/20">@{user.username}</div>
              </div>
            </div>

            {isEditing && (
              <CardFooter className="flex justify-end gap-2 px-0 pt-6">
                <Button variant="outline" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </CardFooter>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 