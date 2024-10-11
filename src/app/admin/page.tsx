"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DocumentUploader from '../upload/page' // Importe o componente de upload que criamos anteriormente
import { toast } from '@/hooks/use-toast'

type Document = {
    id: string
    title: string
    author: string[]
    location: string
    date: string
    tags: string[]
    driveLink: string
}

const ADMIN_PASSWORD = "admin123"  // Normalmente, isso seria armazenado de forma segura no servidor

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState("")
    const [documents, setDocuments] = useState<Document[]>([])
    const [editingDocument, setEditingDocument] = useState<Document | null>(null)
    const [isUpdated, setUpdateDocs] = useState(false)

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch('/api/doc');
                if (!response.ok) {
                    throw new Error('Failed to fetch documents');
                }

                const data = await response.json();
                setDocuments(data);
            } catch (error) {
                console.error(error);
                toast({
                    title: "Error",
                    description: `Erro ao carregar documentos`,
                    variant: "destructive",
                });
            }
        };

        fetchDocuments();
    }, []);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch('/api/doc');
                if (!response.ok) {
                    throw new Error('Failed to fetch documents');
                }

                const data = await response.json();
                setDocuments(data);
            } catch (error) {
                console.error(error);
                toast({
                    title: "Error",
                    description: `Erro ao carregar documentos`,
                    variant: "destructive",
                });
            }
        };

        fetchDocuments();
    }, [editingDocument, isUpdated]);

    const handleLogin = () => {
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true)
            toast({
                title: "Success",
                description: "Logged in successfully!",
            })
        } else {
            toast({
                title: "Error",
                description: "Incorrect password.",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async (id: string) => {
        try {
            // Faz a requisição DELETE para a API
            const response = await fetch(`/api/doc`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                // Atualiza o estado local removendo o documento
                setDocuments(prev => prev.filter(doc => doc.id !== id));

                toast({
                    title: "Success",
                    description: "Document deleted successfully!",
                });
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: `Failed to delete document: ${error.message}`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to delete document: ${error.message}`,
                variant: "destructive",
            });
        }
    };

    const handleEdit = (document: Document) => {
        setEditingDocument(document)
    }

    const handleSaveEdit = async () => {
        if (!editingDocument) return;

        try {
            // Faz a requisição PUT para a API
            const formData = new FormData();
            formData.append('id', editingDocument.id);
            formData.append('title', editingDocument.title);
            formData.append('author', editingDocument.author.join(',')); // Convertendo array para string
            formData.append('location', editingDocument.location);
            formData.append('date', editingDocument.date);
            formData.append('tags', editingDocument.tags.join(',')); // Convertendo array para string

            // Caso o arquivo tenha sido alterado, adicione o novo arquivo
            if (editingDocument.file) {
                formData.append('file', editingDocument.file);
            }

            const response = await fetch(`/api/doc`, {
                method: 'PUT',
                body: formData,
            });

            if (response.ok) {
                const updatedDocument = await response.json();

                // Atualiza o estado local com o documento atualizado
                setDocuments(prev => prev.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc));

                setEditingDocument(null);
                toast({
                    title: "Success",
                    description: "Document updated successfully!",
                });
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: `Failed to update document: ${error.message}`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to update document: ${error.message}`,
                variant: "destructive",
            });
        }
    };
    if (!isAuthenticated) {
        return (
            <Card className="w-full max-w-md mx-auto mt-8">
                <CardHeader>
                    <CardTitle>Admin Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleLogin} className="w-full">Login</Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Document Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell>{doc.title}</TableCell>
                                    <TableCell>{doc.author.join(', ')}</TableCell>
                                    <TableCell>{doc.location}</TableCell>
                                    <TableCell>{doc.date}</TableCell>
                                    <TableCell>{doc.tags.join(', ')}</TableCell>
                                    <TableCell>
                                        <div className="space-x-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(doc)}>Edit</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Document</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="edit-title">Title</Label>
                                                            <Input
                                                                id="edit-title"
                                                                value={editingDocument?.title || ''}
                                                                onChange={(e) => setEditingDocument(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="edit-author">Author</Label>
                                                            <Input
                                                                id="edit-author"
                                                                value={editingDocument?.author.join(', ') || ''}
                                                                onChange={(e) => setEditingDocument(prev => prev ? { ...prev, author: e.target.value.split(',').map(tag => tag.trim().toLowerCase()) } : null)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="edit-location">Location</Label>
                                                            <Input
                                                                id="edit-location"
                                                                value={editingDocument?.location || ''}
                                                                onChange={(e) => setEditingDocument(prev => prev ? { ...prev, location: e.target.value } : null)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="edit-date">Date</Label>
                                                            <Input
                                                                id="edit-date"
                                                                type="date"
                                                                value={editingDocument?.date || ''}
                                                                onChange={(e) => setEditingDocument(prev => prev ? { ...prev, date: e.target.value } : null)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="edit-tags">Tags</Label>
                                                            <Input
                                                                id="edit-tags"
                                                                value={editingDocument?.tags.join(', ') || ''}
                                                                onChange={(e) => setEditingDocument(prev => prev ? { ...prev, tags: e.target.value.split(',').map(tag => tag.trim().toLowerCase()) } : null)}
                                                            />
                                                        </div>
                                                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id)}>Delete</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Upload New Documents</CardTitle>
                </CardHeader>
                <CardContent className='overflow-auto'>
                    <DocumentUploader setUpdateDocs={setUpdateDocs} />
                </CardContent>
            </Card>
        </div>
    )
}