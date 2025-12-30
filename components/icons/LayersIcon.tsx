
import React from 'react';

export const LayersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        {...props}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M8.25 7.5l-4.125 4.125m0 0l4.125 4.125m-4.125-4.125h15M12 21.75l-4.125-4.125m0 0l4.125-4.125m-4.125 4.125h15" 
        />
    </svg>
);