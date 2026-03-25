import { useCallback, useState } from "react";

export type EpisodeFormStep = "initial" | "loading" | "result";

export function useEpisodeFormSteps() {
  const [step, setStep] = useState<EpisodeFormStep>("initial");
  const [success, setSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const setLoading = useCallback(() => {
    setStep("loading");
    setMessage(null);
  }, []);

  const setResult = useCallback((ok: boolean, info?: string | null) => {
    setStep("result");
    setSuccess(ok);
    setMessage(info ?? null);
  }, []);

  const reset = useCallback(() => {
    setStep("initial");
    setSuccess(false);
    setMessage(null);
  }, []);

  return {
    step,
    success,
    message,
    setLoading,
    setResult,
    reset,
    setMessage,
  };
}
