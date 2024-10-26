"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from '@/hooks/use-toast'
import { Progress } from "@/components/ui/progress"
import { useDropzone } from 'react-dropzone'
import { X } from 'lucide-react'
import { ScrollArea } from '@radix-ui/react-scroll-area'

type Document = {
    id: string
    title: string
    author: string[]
    location: string
    date: string
    tags: string[]
    driveLink: string
    file: File
    description: string
}

export default function DocumentUploader({ setUpdateDocs }) {
    const [documents, setDocuments] = useState<Document[]>([])
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newDocuments = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            title: file.name,
            author: [],
            location: '',
            date: '',
            tags: [],
            driveLink: '',
            file: file,
            description: ''
        }))
        setDocuments(prev => [...prev, ...newDocuments])
    }, [])

    const { toast } = useToast()
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    const handleInputChange = (id: string, field: keyof Document, value: string) => {
        setDocuments(prev => prev.map(doc =>
            doc.id === id ? { ...doc, [field]: field === 'tags' || field === 'author' ? value.split(',').map(tag => tag.trim().toLowerCase()) : value } : doc
        ))
    }

    const handleRemoveDocument = (id: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (documents.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one document to upload.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);

        // Adiciona os dados de cada documento
        for (let i = 0; i < documents.length; i++) {
            const formData = new FormData();
            formData.append(`id`, documents[i].id);
            formData.append(`title`, documents[i].title);
            formData.append(`author`, documents[i].author.join(','));
            formData.append(`location`, documents[i].location);
            formData.append(`date`, documents[i].date);
            formData.append(`tags`, documents[i].tags.join(','));
            formData.append(`description`, documents[i].description);
            // Adiciona o arquivo correspondente
            if (documents[i].file) {
                formData.append(`file`, documents[i].file);
                try {
                    const response = await fetch('/api/doc', {
                        method: 'POST',
                        body: formData,
                    });

                    const result = await response.json();

                    if (result.message) {
                        toast({
                            title: "Success",
                            description: result.message,

                        });

                        setProgress(((i + 1) / documents.length) * 100)
                    } else {
                        toast({
                            title: "Error",
                            description: result.message,
                            variant: "destructive",
                        });
                    }

                } catch (error) {
                    console.error('Upload error:', error);
                    toast({
                        title: "Error",
                        description: "Failed to upload documents.",
                        variant: "destructive",
                    });
                }


            } else {
                toast({
                    title: "Error",
                    description: `Document ${documents[i].title} is missing a file.`,
                    variant: "destructive",
                });
                setUploading(false);
                return;
            }
        };
        setDocuments([])
        setUpdateDocs(true)
        setUploading(false)
    };



    return (
        <ScrollArea className='h-[calc(100vh)]'>
            <div className='w-full py-11 flex justify-center items-center'>
                <Card className="w-full max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Upload Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${isDragActive ? 'border-primary' : 'border-gray-300'}`}>
                                <input {...getInputProps()} />
                                {
                                    isDragActive ?
                                        <p>Drop the files here ...</p> :
                                        <p>Drag 'n' drop some files here, or click to select files</p>
                                }
                            </div>

                            {documents.map((doc, index) => (
                                <Card key={doc.id} className="p-4 relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2"
                                        onClick={() => handleRemoveDocument(doc.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <h3 className="font-bold mb-2">Document {index + 1}: {doc.file.name}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor={`title-${doc.id}`}>Title</Label>
                                            <Input
                                                id={`title-${doc.id}`}
                                                value={doc.title}
                                                onChange={(e) => handleInputChange(doc.id, 'title', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`author-${doc.id}`}>Author</Label>
                                            <Input
                                                id={`author-${doc.id}`}
                                                value={doc.author.join(', ')}
                                                onChange={(e) => handleInputChange(doc.id, 'author', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`location-${doc.id}`}>Location</Label>
                                            <Input
                                                id={`location-${doc.id}`}
                                                value={doc.location}
                                                onChange={(e) => handleInputChange(doc.id, 'location', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`date-${doc.id}`}>Date</Label>
                                            <Input
                                                id={`date-${doc.id}`}
                                                type="date"
                                                value={doc.date}
                                                onChange={(e) => handleInputChange(doc.id, 'date', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor={`tags-${doc.id}`}>Tags (comma-separated)</Label>
                                            <Input
                                                id={`tags-${doc.id}`}
                                                value={doc.tags.join(', ')}
                                                onChange={(e) => handleInputChange(doc.id, 'tags', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor={`description-${doc.id}`}>Tags (comma-separated)</Label>
                                            <Input
                                                id={`description-${doc.id}`}
                                                value={doc.tags.join(', ')}
                                                onChange={(e) => handleInputChange(doc.id, 'description', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {doc.driveLink && (
                                        <div className="mt-2">
                                            <Label>Google Drive Link:</Label>
                                            <Input value={doc.driveLink} readOnly />
                                        </div>
                                    )}
                                </Card>
                            ))}

                            {uploading && (
                                <div className="space-y-2">
                                    <Progress value={progress} className="w-full" />
                                    <p className="text-center">{`Uploading... ${Math.round(progress)}%`}</p>
                                </div>
                            )}

                            <Button type="submit" disabled={uploading} className="w-full">
                                {uploading ? 'Uploading...' : 'Upload Documents'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

        </ScrollArea>

    )
}