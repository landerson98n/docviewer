"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DocumentUploader from '../upload/page'
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

const ADMIN_PASSWORD = "admin123"

// Autumn color palette
const autumnColors = {
    background: '#FFF8E1',
    primary: '#D84315',
    secondary: '#795548',
    accent: '#FFA000',
    text: '#FFF8E1'
}

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
            const response = await fetch(`/api/doc`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
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
            const formData = new FormData();
            formData.append('id', editingDocument.id);
            formData.append('title', editingDocument.title);
            formData.append('author', editingDocument.author.join(','));
            formData.append('location', editingDocument.location);
            formData.append('date', editingDocument.date);
            formData.append('tags', editingDocument.tags.join(','));

            if (editingDocument.file) {
                formData.append('file', editingDocument.file);
            }

            const response = await fetch(`/api/doc`, {
                method: 'PUT',
                body: formData,
            });

            if (response.ok) {
                const updatedDocument = await response.json();
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
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='w-full'
                style={{ backgroundColor: autumnColors.background, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Card className="w-full max-w-md" style={{ backgroundColor: autumnColors.secondary, color: autumnColors.text }}>
                    <CardHeader>
                        <CardTitle style={{ color: autumnColors.accent }}>Admin Login</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="password" style={{ color: autumnColors.text }}>Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ backgroundColor: autumnColors.background, color: autumnColors.secondary }}
                                
                                />
                            </div>
                            <Button onClick={handleLogin} className="w-full" style={{ backgroundColor: autumnColors.primary, color: autumnColors.background }}>Login</Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto p-4 space-y-8 w-full"
            style={{ backgroundColor: 'white', color: autumnColors.text, minHeight: '100vh' }}
        >
            <h1 className="text-2xl font-bold" style={{ color: autumnColors.primary }}>Admin Dashboard</h1>

            <Card style={{ backgroundColor: autumnColors.secondary }}>
                <CardHeader>
                    <CardTitle style={{ color: autumnColors.accent }}>Document Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead style={{ color: autumnColors.accent }}>Title</TableHead>
                                <TableHead style={{ color: autumnColors.accent }}>Author</TableHead>
                                <TableHead style={{ color: autumnColors.accent }}>Location</TableHead>
                                <TableHead style={{ color: autumnColors.accent }}>Date</TableHead>
                                <TableHead style={{ color: autumnColors.accent }}>Tags</TableHead>
                                <TableHead style={{ color: autumnColors.accent }} className='w-48'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {documents.map((doc, index) => (
                                    <motion.tr
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <TableCell style={{ color: autumnColors.text }}>{doc.title}</TableCell>
                                        <TableCell style={{ color: autumnColors.text }}>{doc.author.join(', ')}</TableCell>
                                        <TableCell style={{ color: autumnColors.text }}>{doc.location}</TableCell>
                                        <TableCell style={{ color: autumnColors.text }}>{doc.date}</TableCell>
                                        <TableCell style={{ color: autumnColors.text }}>{doc.tags.join(', ')}</TableCell>
                                        <TableCell>
                                            <div className="space-x-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" onClick={() => handleEdit(doc)} style={{ backgroundColor: autumnColors.accent, color: autumnColors.text }}>Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent style={{ backgroundColor: autumnColors.background }}>
                                                        <DialogHeader>
                                                            <DialogTitle style={{ color: autumnColors.primary }}>Edit Document</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <Label htmlFor="edit-title" style={{ color: autumnColors.text }}>Title</Label>
                                                                <Input
                                                                    id="edit-title"
                                                                    value={editingDocument?.title || ''}
                                                                    onChange={(e) => setEditingDocument(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                                    style={{ backgroundColor: autumnColors.secondary, color: autumnColors.text }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="edit-author" style={{ color: autumnColors.text }}>Author</Label>
                                                                <Input
                                                                    id="edit-author"
                                                                    value={editingDocument?.author.join(', ') || ''}
                                                                    onChange={(e) => setEditingDocument(prev => prev ? { ...prev, author: e.target.value.split(',').map(tag => tag.trim().toLowerCase()) } : null)}
                                                                    style={{ backgroundColor: autumnColors.secondary, color: autumnColors.text }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="edit-location" style={{ color: autumnColors.text }}>Location</Label>
                                                                <Input
                                                                    id="edit-location"
                                                                    value={editingDocument?.location || ''}
                                                                    onChange={(e) => setEditingDocument(prev => prev ? { ...prev, location: e.target.value } : null)}
                                                                    style={{ backgroundColor: autumnColors.secondary, color: autumnColors.text }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="edit-date" style={{ color: autumnColors.text }}>Date</Label>
                                                                <Input
                                                                    id="edit-date"
                                                                    type="date"
                                                                    value={editingDocument?.date || ''}
                                                                    onChange={(e) => setEditingDocument(prev => prev ? { ...prev, date: e.target.value } : null)}
                                                                    style={{ backgroundColor: autumnColors.secondary, color: autumnColors.text }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="edit-tags" style={{ color: autumnColors.text }}>Tags</Label>
                                                                <Input
                                                                    id="edit-tags"
                                                                    value={editingDocument?.tags.join(', ') || ''}
                                                                    onChange={(e) => setEditingDocument(prev => prev ? { ...prev, tags: e.target.value.split(',').map(tag => tag.trim().toLowerCase()) } : null)}
                                                                    style={{ backgroundColor: autumnColors.secondary, color: autumnColors.text }}
                                                                />
                                                            </div>
                                                            <Button onClick={handleSaveEdit} style={{ backgroundColor: autumnColors.primary, color: autumnColors.background }}>Save Changes</Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id)} style={{ backgroundColor: autumnColors.primary, color: autumnColors.background }}>Delete</Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card style={{ backgroundColor: autumnColors.secondary }}>
                <CardHeader>
                    <CardTitle style={{ color: autumnColors.accent }}>Upload New Documents</CardTitle>
                </CardHeader>
                <CardContent className='overflow-auto'>
                    <DocumentUploader setUpdateDocs={setUpdateDocs} />
                </CardContent>
            </Card>
        </motion.div>
    )
}