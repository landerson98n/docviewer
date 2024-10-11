"use client"

import React, { useCallback, memo, useMemo, useRef, useEffect } from 'react'
import { ForceGraph2D } from 'react-force-graph'
import { motion } from 'framer-motion'

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
}

const Graph = memo(function Graph({ documents, onNodeClick }: GraphProps) {
    const fgRef = useRef<any>();

    const data = useMemo(() => {
        const nodes = documents.map(doc => ({ id: doc.id, name: doc.title, tags: doc.tags, connections: 0 }))
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
            fg.d3Force('link').distance(100);
            fg.d3Force('charge').strength(-100);
        }
    }, []);

    const autumnColors = {
        background: '#FFF8E1',
        primary: '#D84315',
        secondary: '#795548',
        accent: '#FFA000',
        text: '#3E2723'
    }
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            style={{ width: '100%', height: '100%' }}
        >
            <ForceGraph2D
                ref={fgRef}
                graphData={data}
                nodeLabel="name"
                onNodeClick={handleNodeClick}
                width={window.screen.width}
                height={window.screen.height / 1.5}
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.name as string
                    const fontSize = 12 / globalScale
                    ctx.font = `${fontSize}px Sans-Serif`
                    const textWidth = ctx.measureText(label).width
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2)

                    // Draw node
                    const nodeSize = 5 + ((node as any).connections) * 2
                    ctx.beginPath()
                    ctx.arc(node.x as number, node.y as number, nodeSize, 0, 2 * Math.PI)
                    ctx.fillStyle = autumnColors.primary
                    ctx.fill()

                    // Draw label background
                    ctx.fillStyle = autumnColors.secondary
                    ctx.fillRect(
                        (node.x as number) - bckgDimensions[0] / 2,
                        (node.y as number) - bckgDimensions[1] / 2 - nodeSize - 2,
                        bckgDimensions[0],
                        bckgDimensions[1]
                    )

                    // Draw label text
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillStyle = autumnColors.background
                    ctx.fillText(label, node.x as number, (node.y as number) - nodeSize - 2)
                }}
                nodePointerAreaPaint={(node, color, ctx) => {
                    const nodeSize = 2 + ((node as any).connections) * 2
                    ctx.fillStyle = color
                    ctx.beginPath()
                    ctx.arc(node.x as number, node.y as number, nodeSize + 2, 0, 2 * Math.PI)
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
            />
        </motion.div>

    )
})

export default Graph