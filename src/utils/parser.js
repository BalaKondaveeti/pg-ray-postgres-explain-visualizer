// src/utils/parser.js

let idCounter = 0;

/**
 * Recursively parses the Postgres JSON plan into Nodes and Edges
 */
export const parsePlanToGraph = (planNode, parentId = null, x = 0, y = 0) => {
  const currentId = `node-${idCounter++}`;
  
  // Create the node for the graph
  const flowNode = {
    id: currentId,
    type: 'customPlanNode', // We will create this custom component later
    position: { x, y }, // Initial position, we will use a layout engine later to fix this
    data: { 
      label: planNode['Node Type'],
      cost: planNode['Total Cost'],
      rows: planNode['Plan Rows'],
      time: planNode['Actual Total Time'] || null,
      relation: planNode['Relation Name'] || null,
      details: planNode // Store raw data for detailed view
    },
  };

  let nodes = [flowNode];
  let edges = [];

  // Create an edge if there is a parent
  if (parentId) {
    edges.push({
      id: `edge-${parentId}-${currentId}`,
      source: parentId,
      target: currentId,
      type: 'smoothstep', // nice curved lines
      animated: true,
    });
  }

  // Handle Children (Plans)
  if (planNode.Plans) {
    planNode.Plans.forEach((childPlan, index) => {
      // Simple layout logic: spread children out horizontally
      // Note: For a pro app, use 'dagre' library for auto-layout. 
      // Here we just offset them simply for the MVP.
      const xOffset = (index - planNode.Plans.length / 2) * 250; 
      const { nodes: childNodes, edges: childEdges } = parsePlanToGraph(
        childPlan, 
        currentId, 
        x + xOffset, 
        y + 150
      );
      nodes = [...nodes, ...childNodes];
      edges = [...edges, ...childEdges];
    });
  }

  return { nodes, edges };
};

export const layoutElements = (nodes, edges) => {
    // In a real app, integrate 'dagre' here to calculate x/y positions automatically.
    // For this snippet, we rely on the recursive offset logic above.
    return { nodes, edges };
};