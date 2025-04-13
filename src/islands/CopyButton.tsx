import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface Props {
  text: string;
}

export default function CopyButton({ text }: Props) {
  const copied = useSignal(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
    } catch {
      copied.value = false;
    }
  };

  useEffect(() => {
    if (copied.value) {
      const timeout = setTimeout(() => {
        copied.value = false;
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied.value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
    >
      {copied.value ? "✅ Copié !" : "📋 Copier"}
    </button>
  );
}
