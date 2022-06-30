import React from 'react';

type Props = {
  children?: JSX.Element[];
}

const HorizontalScrollView = ({ children }: Props) => (
  <div className="horizontal-menu-wrapper">
    <div className="horizontal-menu-scroll-container">
      { children }
    </div>
  </div>
);

export default HorizontalScrollView;
