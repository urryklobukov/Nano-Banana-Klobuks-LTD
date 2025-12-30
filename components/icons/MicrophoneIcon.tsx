
import React from 'react';

export const MicrophoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M12 18.75a4.5 4.5 0 004.5-4.5v-7.5a4.5 4.5 0 00-9 0v7.5a4.5 4.5 0 004.5 4.5zm0 0v3.75m-3.375 0h6.75"
    />
  </svg>
);