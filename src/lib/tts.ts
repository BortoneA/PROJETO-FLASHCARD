// Text-to-Speech Helper via Web Speech API

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Links [text](url) -> text
    .replace(/[*_#`~>]/g, "") // Bold, italic, code, headers, quotes
    .replace(/---/g, "")
    .replace(/\n+/g, ". ")
    .trim();
}

/**
 * Detecta o idioma provável do texto baseado em padrões simples de vocabulário
 */
function detectLanguage(text: string): string {
  const clean = text.toLowerCase();
  // Espanhol
  if (/\b(el|la|los|las|un|una|por|para|con|pero|hola|gracias|está|bueno|muy|tengo)\b/.test(clean)) {
    return "es-ES";
  }
  // Inglês
  if (/\b(the|and|is|are|in|at|on|for|with|this|that|from|have|what|how|which)\b/.test(clean)) {
    return "en-US";
  }
  // Francês
  if (/\b(le|la|les|un|une|des|et|dans|pour|avec|est|sont|merci)\b/.test(clean)) {
    return "fr-FR";
  }
  // Padrão: Português
  return "pt-BR";
}

export function speakText(
  text: string,
  preferredLang?: string,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  window.speechSynthesis.cancel(); // Para fala anterior

  const cleanText = stripMarkdown(text);
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const lang = preferredLang || detectLanguage(cleanText);
  utterance.lang = lang;
  utterance.rate = 0.95; // Cadência ideal para aprendizado e memorização
  utterance.pitch = 1.0;

  // Busca voz nativa do idioma se disponível
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
