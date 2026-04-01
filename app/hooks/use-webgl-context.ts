import { useState, useCallback, useEffect, useRef } from "react";
import type { WebGLRenderer } from "three";

interface UseWebGLContextReturn {
  contextLost: boolean;
  handleCreated: (state: { gl: WebGLRenderer }) => void;
}

export function useWebGLContext(): UseWebGLContextReturn {
  const [contextLost, setContextLost] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    const canvas = gl.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn("WebGL context lost");
      setContextLost(true);
    };

    const handleContextRestored = () => {
      console.info("WebGL context restored");
      setContextLost(false);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    cleanupRef.current = () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return { contextLost, handleCreated };
}
