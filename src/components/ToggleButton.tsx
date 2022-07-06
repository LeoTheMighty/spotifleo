import React, { useState } from 'react';

type Props = {
  className?: string;
  onChange?: (value: boolean) => void;
  defaultValue?: boolean;
  on?: React.ReactNode;
  off?: React.ReactNode;
};

const ToggleButton = ({ className, onChange, defaultValue, on, off }: Props) => {
  const [value, setValue] = useState<boolean>(defaultValue === undefined ? false : defaultValue);

  return (
    <div className="toggle-button-container">
      <div className={`${value ? 'toggle-overlay': ''}`} />
      <button className={`${className || 'toggle-button'} `} onClick={() => setValue((v) => {
      const val = !v;

      onChange && onChange(val);

      return val;
    })}>
      {value ? on : off}
    </button>
    </div>
  );
};

export default ToggleButton;
