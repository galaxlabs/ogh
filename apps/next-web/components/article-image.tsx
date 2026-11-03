"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** Preserve valid article images and show original artwork if decoding fails. */
export function ArticleImage(props: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(null);
  const failed = failedSource === props.src;
  return (
    <Image
      {...props}
      src={failed ? "/images/article-placeholder.svg" : props.src}
      alt={failed ? "OpenGuideHub article illustration" : props.alt}
      onError={failed ? undefined : () => setFailedSource(props.src)}
    />
  );
}
