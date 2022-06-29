import React, { useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';

type Props = {
  onView?: () => void;
};

const intersectionObserverOptions = {
  threshold: 0.25,
  rootMargin: '50px',
};

const LoadingIndicator = ({ onView }: Props) => {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (e) => e[0].isIntersecting && onView && onView(),
      intersectionObserverOptions,
    );

    if (observer) {
      ref?.current && observer.observe(ref.current);

      return () => {
        ref?.current && observer.unobserve(ref.current);
      };
    }
  }, [ref]);

  return (
    <div ref={ref} className="d-flex justify-content-center">
      <Spinner animation="border" />
    </div>
  );
};

export default LoadingIndicator;
