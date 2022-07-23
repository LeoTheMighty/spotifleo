import React from 'react';
import { Images } from '../types';
import defaultAvatar from '../images/default_avatar.jpeg';

type Props = {
  className: string;
  src?: Images;
  alt?: string;
  large?: boolean;
  onClick?: () => void;
}

const Image = ({ className, src, alt, large, onClick }: Props) => (
  <img
    onClick={onClick}
    className={className}
    src={(large ? src?.large || src?.small : src?.small || src?.large) || defaultAvatar}
    alt={alt}
  />
);

export default Image;
