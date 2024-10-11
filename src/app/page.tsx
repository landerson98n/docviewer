"use client"

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// Dynamically import the Graph component
const Graph = dynamic(() => import('@/components/ui/graph'), {
  ssr: false,
  loading: () => <p>Loading graph...</p>
})

// Type to represent a document
type Document = {
  id: string
  title: string
  author: string[]
  location: string
  date: string
  tags: string[]
  driveLink: string
  file: File
}

// Autumn color palette
const autumnColors = {
  background: '#FFF8E1',
  primary: '#D84315',
  secondary: '#795548',
  accent: '#FFA000',
  text: '#3E2723'
}

export default function DocViewer() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortMethod, setSortMethod] = useState<string>('title')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showIntro, setShowIntro] = useState(true)
  const route = useRouter()

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

    // Hide intro after 3 seconds
    const timer = setTimeout(() => setShowIntro(false), 3000);
    return () => clearTimeout(timer);
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
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(doc.author) && doc.author.some((item: string) =>
          item.toLowerCase().includes(searchQuery.toLowerCase()))
        ) ||
        (Array.isArray(doc.tags) && doc.tags.some((item: string) =>
          item.toLowerCase().includes(searchQuery.toLowerCase()))
        )
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
    <AnimatePresence>
      {showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-[#FFF8E1]"
        >
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
            className="text-5xl font-bold text-[#3E2723]"
          >
            Projeto SIA/UFPI
          </motion.h1>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="flex flex-col h-screen w-screen"
        style={{ backgroundColor: autumnColors.background, color: autumnColors.text }}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 3.5, duration: 0.5 }}
          className="flex flex-col gap-4 p-4 bg-opacity-50"
          style={{ backgroundColor: autumnColors.secondary }}
        >
          <div className="flex justify-between items-center w-full">
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-64"
              style={{ backgroundColor: autumnColors.background, color: autumnColors.text }}
            />
            <Button onClick={() => {route.push("/admin")}} style={{ backgroundColor: autumnColors.primary, color: autumnColors.background }}>
              Login
            </Button>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4, duration: 0.5 }}
            className="flex gap-2 flex-wrap overflow-auto"
          >
            {allTags.map((tag, index) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 4 + index * 0.1, duration: 0.3 }}
              >
                <Button
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  onClick={() => handleTagToggle(tag)}
                  className="mb-2"
                  style={{
                    backgroundColor: selectedTags.includes(tag) ? autumnColors.accent : 'transparent',
                    color: selectedTags.includes(tag) ? autumnColors.background : autumnColors.text,
                    borderColor: autumnColors.accent
                  }}
                >
                  {tag}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5, duration: 1 }}
          className="flex-grow w-full"
        >
          <Graph
            documents={filteredAndSortedDocuments}
            onNodeClick={handleNodeClick}
          />
        </motion.div>
        {selectedDocument && (
          <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
            <DialogContent style={{ backgroundColor: autumnColors.background, color: autumnColors.text }}>
              <DialogHeader>
                <DialogTitle style={{ color: autumnColors.primary }}>{selectedDocument.title}</DialogTitle>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2 w-full overflow-auto"
              >
                <p><strong>Titulo:</strong> {selectedDocument.title}</p>
                <p><strong>Tags:</strong> {selectedDocument.tags.join(', ')}</p>
                <p><strong>Autor:</strong> {selectedDocument.author.join(', ')}</p>
                <p><strong>Localização:</strong> {selectedDocument.location}</p>
                <p><strong>Data:</strong> {selectedDocument.date}</p>
                <p><strong>Drive:</strong><a className='text-blue-950' href={selectedDocument.driveLink}> Link</a> </p>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>
    </AnimatePresence>
  )
}