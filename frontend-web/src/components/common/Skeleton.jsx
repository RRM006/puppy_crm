import React from 'react';

const Skeleton = ({ height = 16, width = '100%', style }) => (
  <div style={{
    background: 'linear-gradient(90deg,#f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)',
    backgroundSize: '400% 100%',
    animation: 'shine 1.4s ease infinite',
    height, width, borderRadius: 6, ...style
  }} />
);

export default Skeleton;
