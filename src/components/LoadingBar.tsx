import React, { useEffect, useState } from 'react';
import { ProgressBar } from 'react-bootstrap';

type Props = {
  progress?: number; // 0.0 - 1.0
  startFrom?: number;
  onlyShowOnChange?: boolean;
};

const LoadingBar = ({ progress, startFrom, onlyShowOnChange }: Props) => {
  const [lastValue, setLastValue] = useState(startFrom || 0);
  const [show, setShow] = useState(!onlyShowOnChange);

  useEffect(() => {
    if (onlyShowOnChange) {
      console.log(progress);
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    }

    if (progress !== undefined) {
      setLastValue(progress);
    } else if (startFrom !== undefined) {
      setTimeout(() => setLastValue(startFrom), 1000);
    }
  }, [progress, startFrom]);

  const showBar = onlyShowOnChange ? show : progress;
  return (
    <div className="loading-container">
      <ProgressBar
        min={0.0}
        max={1.0}
        now={progress || lastValue}
        defaultValue={0}
        className={`loading-bar ${showBar ? '' : 'opacity-0'}`}
        animated
        striped
      />
    </div>
  );
};

export default LoadingBar;
