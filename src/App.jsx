// src/App.jsx
import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  applyEdgeChanges, 
  applyNodeChanges 
} from 'reactflow';
import 'reactflow/dist/style.css';

import { parsePlanToGraph } from './utils/parser';
import PlanNode from './components/PlanNode';

const nodeTypes = { customPlanNode: PlanNode };

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState(null);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleVisualize = () => {
    try {
      setError(null);
      // Clean input (sometimes people paste 'EXPLAIN ...' text before the JSON)
      const raw = JSON.parse(jsonInput);
      
      // Postgres usually wraps the plan in an array: [{ Plan: ... }]
      const rootPlan = Array.isArray(raw) ? raw[0].Plan : raw.Plan;
      
      if (!rootPlan) throw new Error("Invalid JSON: Could not find 'Plan' property.");

      const { nodes: newNodes, edges: newEdges } = parsePlanToGraph(rootPlan);
      
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (e) {
      setError("Failed to parse JSON. Ensure you used 'FORMAT JSON'. Details: " + e.message);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-gray-50">
      
      {/* Sidebar: Input */}
      <div className="w-full md:w-1/3 p-4 flex flex-col border-r bg-white shadow-sm z-10">
        <h1 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center gap-2">
           PG-Ray 
           <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded">Visualizer</span>
        </h1>
        
        <p className="text-sm text-gray-500 mb-2">
          Run: <code>EXPLAIN (ANALYZE, COSTS, FORMAT JSON) SELECT...</code>
        </p>

        <textarea
          className="flex-1 p-3 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50"
          placeholder='Paste your JSON output here...'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        
        {error && (
            <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                {error}
            </div>
        )}

        <button
          onClick={handleVisualize}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-indigo-200"
        >
          Visualize Plan
        </button>
      </div>

      {/* Main: Graph Area */}
      <div className="flex-1 h-full relative">
        {nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <p className="text-lg">No plan loaded</p>
                    <p className="text-sm">Paste JSON on the left to get started</p>
                </div>
            </div>
        ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
            >
              <Background gap={12} size={1} />
              <Controls />
            </ReactFlow>
        )}
      </div>
    </div>
  );
}

export default App;