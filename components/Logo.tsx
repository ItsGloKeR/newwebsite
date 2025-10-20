import React from 'react';

const Logo: React.FC<{ width?: string | number, height?: string | number }> = ({ width = "105", height = "24" }) => (
    <svg width={width} height={height} viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.6923 4.5L2.84615 27.5H30.5385L16.6923 4.5Z" stroke="#22d3ee" strokeWidth="2"/>
        <path d="M16.6923 15.5L11.7692 23.5H21.6154L16.6923 15.5Z" fill="white"/>
        <text x="40" y="23" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="900" fill="#22d3ee">
            Ani
            <tspan fill="white">GloK</tspan>
        </text>
    </svg>
);

export default Logo;
