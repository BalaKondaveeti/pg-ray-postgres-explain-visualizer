// src/components/PlanNode.jsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Database, Search, GitMerge, ListFilter } from 'lucide-react';


// Balu todo: Add unique styles for each different steps

const getNodeStyle = (type) => {
  const t = type.toLowerCase();
  
  return 'border-gray-300 bg-white';
};

const getIcon = (type) => {
    const t = type.toLowerCase();
    return <Database className="w-4 h-4 text-gray-600" />;
};

export default memo(({ data }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] ${getNodeStyle(data.label)}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      
      <div className="flex items-center gap-2 mb-2 border-b pb-1 border-gray-200">
        {getIcon(data.label)}
        <div className="font-bold text-sm text-gray-800">{data.label}</div>
      </div>

      <div className="text-xs space-y-1 text-gray-600">
        {data.relation && (
          <div className="font-mono text-gray-900 bg-gray-200 px-1 rounded inline-block">
            {data.relation}
          </div>
        )}
        <div className="flex justify-between">
            <span>Cost:</span>
            <span className="font-medium">{data.cost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
            <span>Rows:</span>
            <span className="font-medium">{data.rows}</span>
        </div>
        {data.time && (
            <div className="flex justify-between text-blue-600 font-bold">
                <span>Time:</span>
                <span>{data.time.toFixed(3)}ms</span>
            </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
});