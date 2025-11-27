// src/utils/textParser.js

/**
 * Parses Postgres TEXT explain output into a JSON-like structure
 * compatible with the existing graph visualizer.
 */
export const parseTextPlan = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    const root = {
      "Node Type": "Root",
      "Plans": []
    };
  
    // Stack keeps track of the ancestry: [root, child, grandchild...]
    // We initialize with a dummy root to hold the top-level node.
    let stack = [{ node: root, indent: -1 }];
  
    lines.forEach((line) => {
      // 1. Calculate Indentation
      // Postgres text format uses "->" to indicate depth, or simple spaces.
      // We treat "->" as the marker. 
      const arrowIndex = line.indexOf('->');
      const indent = arrowIndex === -1 ? 0 : arrowIndex;
      
      // Clean up the line: remove arrows and trim
      let content = line.replace('->', '').trim();
  
      // 2. Extract Data using Regex
      // Matches: "Seq Scan on users  (cost=0.00..12.00 rows=10 width=4)"
      // Regex explanation:
      // ^(.*?): Capture the Node Type (start of line until paren)
      // \((.*)\): Capture everything inside the last parentheses (metrics)
      const match = content.match(/^(.*?)\s*\((.*)\)$/);
      
      let nodeType = content;
      let metrics = {};
  
      if (match) {
        nodeType = match[1].trim();
        const metricsString = match[2];
        
        // Parse metrics: cost=0.00..12.00 rows=10 width=4 loops=1
        metrics = parseMetrics(metricsString);
      }
  
      // 3. Create the Node Object
      const newNode = {
        "Node Type": nodeType,
        "Total Cost": metrics.cost_high || 0,
        "Startup Cost": metrics.cost_low || 0,
        "Plan Rows": metrics.rows || 0,
        "Actual Total Time": metrics.actual_time_high || null,
        "Relation Name": extractRelationName(nodeType),
        "Plans": []
      };
  
      // 4. Manage Hierarchy (The Stack Logic)
      // Pop from stack until we find the parent (node with strictly less indent)
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
  
      // The item currently at the top of the stack is the parent
      const parent = stack[stack.length - 1].node;
      
      // Check if "Plans" array exists (it should), if not create it
      if (!parent.Plans) parent.Plans = [];
      parent.Plans.push(newNode);
  
      // Push current node to stack so it can be a parent for future lines
      stack.push({ node: newNode, indent: indent });
    });
  
    // Return the first real node (skipping our dummy root)
    // If the dummy root has multiple children, return the dummy root itself or handle accordingly.
    // Standard Explain usually returns one top-level node.
    return root.Plans.length > 0 ? root.Plans[0] : null;
  };
  
  // Helper: Extract costs, rows, time from the parenthesis string
  const parseMetrics = (metricStr) => {
    const data = {};
    
    // Parse Cost: cost=0.00..12.34
    const costMatch = metricStr.match(/cost=(\d+\.?\d*)\.\.(\d+\.?\d*)/);
    if (costMatch) {
      data.cost_low = parseFloat(costMatch[1]);
      data.cost_high = parseFloat(costMatch[2]);
    }
  
    // Parse Rows: rows=100
    const rowsMatch = metricStr.match(/rows=(\d+)/);
    if (rowsMatch) data.rows = parseInt(rowsMatch[1]);
  
    // Parse Actual Time: actual time=0.01..0.05
    // Note: Standard text output often says "actual time=..." if ANALYZE was used
    const timeMatch = metricStr.match(/actual time=(\d+\.?\d*)\.\.(\d+\.?\d*)/);
    if (timeMatch) {
      data.actual_time_low = parseFloat(timeMatch[1]);
      data.actual_time_high = parseFloat(timeMatch[2]);
    }
  
    return data;
  };
  
  // Helper: Try to find a table name in the Node Type string
  // e.g. "Seq Scan on users" -> "users"
  const extractRelationName = (nodeType) => {
      if (nodeType.includes(' on ')) {
          return nodeType.split(' on ')[1];
      }
      return null;
  };