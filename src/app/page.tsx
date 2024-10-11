"use client"

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from '@/hooks/use-toast'

// Dynamically import the Graph component
const Graph = dynamic(() => import('@/components/ui/graph'), {
  ssr: false,
  loading: () => <p>Loading graph...</p>
})

// Type to represent a document
type Document = {
  id: string
  title: string
  tags: string[]
  content: string
}

// Sample documents
const sampleDocuments: Document[] = [
  { id: '1', title: 'Document 1', tags: ['important', 'work'], content: 'Content of document 1' },
  { id: '2', title: 'Document 2', tags: ['personal', 'finance'], content: 'Content of document 2' },
  { id: '3', title: 'Document 3', tags: ['work', 'project'], content: 'Content of document 3' },
  { id: '4', title: 'Document 4', tags: ['important', 'personal'], content: 'Content of document 4' },
  { id: '5', title: 'Document 5', tags: ['finance', 'work'], content: 'Content of document 5' },
  { id: '6', title: 'Document 6', tags: ['finance', 'work'], content: 'Content of document 5' },
  { id: '7', title: 'Document 7', tags: ['finance', 'work'], content: 'Content of document 5' },
  { id: '8', title: 'Document 8', tags: ['finance', 'work'], content: 'Content of document 5' },
  { id: '9', title: 'Document 9', tags: ['finance', 'work'], content: 'Content of document 5' },
]

export default function DocViewer() {
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortMethod, setSortMethod] = useState<string>('title')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')


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

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents
    if (selectedTags.length > 0) {
      filtered = filtered.filter(doc =>
        selectedTags.every(tag => doc.tags.includes(tag))
      )
    }
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return filtered.sort((a, b) => {
      if (sortMethod === 'title') {
        return a.title.localeCompare(b.title)
      } else if (sortMethod === 'tagCount') {
        return b.tags.length - a.tags.length
      }
      return 0
    })
  }, [documents, selectedTags, sortMethod, searchQuery])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    documents.forEach(doc => doc.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags)
  }, [documents])

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }, [])

  const handleNodeClick = useCallback((nodeId: string) => {
    const selected = documents.find(doc => doc.id === nodeId)
    setSelectedDocument(selected || null)
  }, [documents])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="flex flex-col gap-4 p-4 bg-gray-100">
        <div className="flex justify-between items-center w-48">
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-64"
          />
          <Select value={sortMethod} onValueChange={setSortMethod}>
            <SelectTrigger className="w-12">
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Sort by Title</SelectItem>
              <SelectItem value="tagCount">Sort by Tag Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {allTags.map(tag => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              onClick={() => handleTagToggle(tag)}
              className="mb-2"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex-grow w-full">
        <Graph
          documents={filteredAndSortedDocuments}
          onNodeClick={handleNodeClick}
        />
      </div>
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDocument.title}</DialogTitle>
            </DialogHeader>
            <div className="mt-2 w-full overflow-auto">
              <p><strong>Titulo:</strong> {selectedDocument.title}</p>
              <p><strong>Tags:</strong> {selectedDocument.tags.join(', ')}</p>
              <p><strong>Content:</strong> {selectedDocument.content}</p>
              <p><strong>Autor:</strong> {selectedDocument.author}</p>
              <p><strong>Localização:</strong> {selectedDocument.location}</p>
              <p><strong>Data:</strong> {selectedDocument.date}</p>
              <p><strong>Drive:</strong> {selectedDocument.driveLink}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}