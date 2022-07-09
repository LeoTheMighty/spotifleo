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

  const onClick = () => setValue((v) => {
    const val = !v;

    onChange && onChange(val);

    return val;
  });

  return (
    <div className="toggle-button-container">
      <button className={`${value ? 'toggle-overlay': 'd-none'}`} onClick={onClick}/>
      <button className={`${className || 'toggle-button'} `} onClick={onClick}>
      {value ? on : off}
    </button>
    </div>
  );
};

export default ToggleButton;
