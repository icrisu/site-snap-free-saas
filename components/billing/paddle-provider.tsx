"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

type PaddleContextType = {
  paddle: Paddle | null;
  isLoaded: boolean;
};

const PaddleContext = createContext<PaddleContextType>({
  paddle: null,
  isLoaded: false,
});

export function usePaddle() {
  return useContext(PaddleContext);
}

type PaddleProviderProps = {
  clientToken: string;
  environment: "sandbox" | "production";
  children: ReactNode;
};

export function PaddleProvider({
  clientToken,
  environment,
  children,
}: PaddleProviderProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!clientToken) return;

    initializePaddle({
      token: clientToken,
      environment,
    }).then((instance) => {
      if (instance) {
        setPaddle(instance);
        setIsLoaded(true);
      }
    });
  }, [clientToken, environment]);

  return (
    <PaddleContext.Provider value={{ paddle, isLoaded }}>
      {children}
    </PaddleContext.Provider>
  );
}
