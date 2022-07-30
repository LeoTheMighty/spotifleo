import React from 'react';

const JustGoodLogo = ({ className }: { className?: string }) => (
  <i className={`bi bi-person-hearts position-relative ${className || ''}`}>
    <i className="bi bi-spotify floated-other-corner-icon" />
  </i>
);

export default JustGoodLogo;
