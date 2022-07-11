import React from 'react';
import { Images } from '../types';
import defaultAvatar from '../images/default_avatar.jpeg';

const Image = ({ className, src, alt, large }: { className: string, src?: Images, alt?: string, large?: boolean}) => (
  <img
    className={className}
    src={(large ? src?.large || src?.small : src?.small || src?.large) || defaultAvatar}
    alt={alt}
  />
);

export default Image;
