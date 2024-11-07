"use client"

import React, { useCallback, memo, useMemo, useRef, useEffect, useState } from 'react'
import { ForceGraph2D } from 'react-force-graph'
import { motion } from 'framer-motion'
import { useMediaQuery } from 'react-responsive'
import { forceCenter } from 'd3'
import { Button } from './button'

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

type GraphProps = {
    documents: Document[]
    onNodeClick: (nodeId: string) => void
    selectedLength: number
    topTags: []
    handleTagToggle: () => {}
}

const Graph = memo(function Graph({ documents, onNodeClick, selectedLength, topTags, handleTagToggle }: GraphProps) {
    const fgRef = useRef<any>();
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })


    const data = useMemo(() => {
        const nodes = documents.map(doc => ({
            id: doc.id,
            name: doc.title,
            tags: doc.tags,
            author: doc.author[0],
            connections: 0,
            color: Math.random() < 0.33 ? '#f6b419ff' : Math.random() > 0.33 && Math.random() < 0.66 ? '#ef4123ff' : '#007932ff'
        }))
        const links: { source: string; target: string }[] = []

        // Create links between documents with shared tags
        for (let i = 0; i < documents.length; i++) {
            for (let j = i + 1; j < documents.length; j++) {
                const sharedTags = documents[i].tags.filter(tag => documents[j].tags.includes(tag))
                if (sharedTags.length > 0) {
                    links.push({ source: documents[i].id, target: documents[j].id })
                    nodes[i].connections++
                    nodes[j].connections++
                }
            }
        }

        return { nodes, links }
    }, [documents])

    const handleNodeClick = useCallback((node: { id: string }) => {
        onNodeClick(node.id)
    }, [onNodeClick])


    useEffect(() => {
        const fg = fgRef.current;
        if (fg) {
            // Increase link distance
            fg.d3Force('link').distance(500);
            fg.d3Force('charge').strength(-1000);
            fg.d3Force('center', forceCenter(window.innerWidth / 2, window.innerHeight / 2));
            fg.zoom(0.12);
        }
    }, []);

    useEffect(() => {
        if (fgRef.current) {
            const zoomLevel = selectedLength === 0
                ? (isTabletOrMobile ? 0.12 : 0.12)
                : (isTabletOrMobile ? 0.5 : 1);
            fgRef.current.zoom(zoomLevel, 4000);
            fgRef.current.centerAt(window.innerWidth / 2, window.innerHeight / 2, 400);
        }

    }, [selectedLength, isTabletOrMobile]);

    const autumnColors = {
        background: '#FFF8E1',
        primary: '#ef4123ff',
        secondary: '#007932ff',
        accent: '#f6b419ff',
        text: '#3E2723'
    }

    const handleZoom = useCallback((transform: { x: number; y: number; k: number }) => {
        setTransform({ x: transform.x * 0.1, y: transform.y * 0.1, k: transform.k });
    }, []);

    const tagPositions = useMemo(() => {
        const width = window.innerWidth / 2;
        const height = window.innerHeight;
        return topTags.map((_, i) => ({
            x: (width / 2) + (width / 3) * Math.cos(2 * Math.PI * i / topTags.length),
            y: (height / 3) + (height / 4) * Math.sin(2 * Math.PI * i / topTags.length)
        }));
    }, [topTags]);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            style={{ width: '100%', height: '100%', position: 'relative' }}
        >
            {transform.k < 0.15 && selectedLength === 0 && topTags.map((item, index) => (
                <Button
                    key={item}
                    onClick={() => handleTagToggle(item)}
                    style={{
                        position: 'absolute',
                        left: `${(tagPositions[index].x + -transform.x + 100)}px`,
                        top: `${tagPositions[index].y + -transform.y + 100}px`,
                        transform: `scale(${1 / transform.k * 0.03})`,
                        transition: 'left 0.2s, top 0.2s, transform 0.2s',
                        zIndex: 10,
                        backgroundColor: 'transparent',
                        color: '#034ea2',
                        fontSize: `${16 / transform.k}px`,
                        padding: `${8 / transform.k}px ${20 / transform.k}px`,
                        width: window.innerWidth / 2
                    }}
                >
                    {item}
                </Button>
            ))}
            <ForceGraph2D
                ref={fgRef}
                graphData={data}
                onNodeClick={handleNodeClick}
                width={window.innerWidth}
                height={window.innerHeight}
                onZoom={handleZoom}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = transform.k < 0.3 ? '' : node.author
                    const fontSize = 12 / globalScale
                    ctx.font = `${fontSize}px Sans-Serif`

                    // Draw node
                    const nodeSize = 20 + node.connections * 15
                    ctx.beginPath()
                    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
                    ctx.fillStyle = node.color
                    ctx.fill()

                    // Draw label text
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillStyle = autumnColors.secondary
                    ctx.fillText(label, node.x, node.y - nodeSize - 2)
                }}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                    const nodeSize = 2 + node.connections * 2
                    ctx.fillStyle = color
                    ctx.beginPath()
                    ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI)
                    ctx.fill()
                }}
                linkColor={() => autumnColors.secondary}
                linkWidth={2}
                nodeRelSize={1}
                cooldownTicks={100}
                linkDirectionalParticles={7}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={5}
                linkDirectionalParticleColor={() => autumnColors.accent}
                minZoom={selectedLength === 0 ? (isTabletOrMobile ? 0.12 : 0.12) : (isTabletOrMobile ? 0.5 : 1)}
            />
        </motion.div>
    )
})

export default Graph