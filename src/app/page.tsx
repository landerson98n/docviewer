'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

const Graph = dynamic(() => import('@/components/ui/graph'), {
  ssr: false,
  loading: () => <p>Loading graph...</p>
})

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

const autumnColors = {
  background: '#fff',
  primary: '#3571b4',
  secondary: '#ffffff',
  accent: '#034ea2',
  text: '#034ea2'
}

export default function ImprovedDocViewer() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
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
    const timer = setTimeout(() => setShowIntro(false), 3000);
    return () => clearTimeout(timer);
  }, []);


  const filteredDocuments = useMemo(() => {
    return documents.filter(doc =>
      (selectedTags.length === 0 || selectedTags.every(tag => doc.tags.includes(tag))) &&
      (searchQuery === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.author.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
  }, [documents, selectedTags, searchQuery]);

  const tagGroups = useMemo(() => {
    const groups: { [key: string]: string[] } = {};
    documents.forEach(doc => {
      doc.tags.forEach(tag => {
        const prefix = tag.split('/')[0];
        if (!groups[prefix]) {
          groups[prefix] = [];
        }
        if (!groups[prefix].includes(tag)) {
          groups[prefix].push(tag);
        }
      });
    });
    return groups;
  }, [documents]);

  const topTags = useMemo(() => {
    const tagCounts = documents.reduce((acc, doc) => {
      doc.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as { [key: string]: number });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [documents]);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    const selected = documents.find(doc => doc.id === nodeId)
    setSelectedDocument(selected || null)
  }, [documents]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }, []);

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
            <Button onClick={() => { route.push("/admin") }} style={{ backgroundColor: autumnColors.primary, color: autumnColors.background }}>
              Login
            </Button>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4, duration: 0.5 }}
            className="flex gap-2 flex-wrap"
          >
            {topTags.map((tag, index) => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                onClick={() => handleTagToggle(tag)}
                className="text-xs py-1 px-2"
                style={{
                  backgroundColor: selectedTags.includes(tag) ? autumnColors.accent : 'transparent',
                  color: selectedTags.includes(tag) ? autumnColors.background : autumnColors.text,
                  borderColor: autumnColors.accent
                }}
              >
                {tag.split('/').pop()}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="text-xs py-1 px-2">
                  Mais Tags <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full">
                <ScrollArea className="h-72">
                  {Object.entries(tagGroups).map(([prefix, tags]) => (
                    <div key={prefix} className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {tags.map(tag => (
                          <Button
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            onClick={() => handleTagToggle(tag)}
                            className="text-xs py-1 px-2"
                            style={{
                              backgroundColor: selectedTags.includes(tag) ? autumnColors.accent : 'transparent',
                              color: selectedTags.includes(tag) ? autumnColors.background : autumnColors.text,
                              borderColor: autumnColors.accent
                            }}
                          >
                            {tag.split('/').pop()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5, duration: 1 }}
          className="flex-grow w-full"
        >
          <Graph
            documents={filteredDocuments}
            onNodeClick={handleNodeClick}
            selectedLength={selectedTags.length}
            topTags={topTags}
            handleTagToggle={handleTagToggle}
          />
        </motion.div>
        {selectedDocument && (
          <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
            <DialogContent className='max-h-[calc(90vh)] overflow-y-scroll' style={{ backgroundColor: autumnColors.background, color: autumnColors.text }}>
              <DialogHeader>
                <DialogTitle style={{ color: autumnColors.primary }}>{selectedDocument.title}</DialogTitle>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2 w-full overflow-y-scroll"
              >
                <p><strong>Titulo:</strong> {selectedDocument.title}</p>
                <p><strong>Tags:</strong> {selectedDocument.tags.join(', ')}</p>
                <p><strong>Autor:</strong> {selectedDocument.author.join(', ')}</p>
                <p><strong>Localização:</strong> {selectedDocument.location}</p>
                <p><strong>Data:</strong> {selectedDocument.date}</p>
                <p><strong>Descrição:</strong> {selectedDocument.description}</p>
                <p><strong>Drive:</strong><a className='text-blue-950' href={selectedDocument.driveLink}> Link</a> </p>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>
    </AnimatePresence>
  )
}