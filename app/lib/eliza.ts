const reflections: Record<string, string> = {
  ja: "ty",
  som: "si",
  mám: "máš",
  môj: "tvoj",
  moja: "tvoja",
  moje: "tvoje",
  mňa: "teba",
  mi: "ti",
  ma: "ťa",
  chcem: "chceš",
  cítim: "cítiš",
};

const defaultResponses = [
  "Môžeš o tom povedať viac?",
  "Ako sa pri tom cítiš?",
  "Prečo si to myslíš?",
  "Čo ti pri tom napadá?",
  "Rozumiem. Pokračuj.",
  "Môžeš to trochu viac vysvetliť?",
];

const reflectText = (text: string) => {
  return text
    .split(/\s+/)
    .map((word) => {
      const cleanWord = word
        .toLowerCase()
        .replace(/[.,!?]/g, "");

      return reflections[cleanWord] ?? word;
    })
    .join(" ");
};

const getRandomResponse = () => {
  const index = Math.floor(Math.random() * defaultResponses.length);
  return defaultResponses[index];
};

export const getElizaResponse = (message: string): string => {
  const text = message.trim().toLowerCase();

  if (!text) {
    return "Napíš mi niečo.";
  }

  if (/^(ahoj|čau|dobrý deň|dobry den)/i.test(text)) {
    return "Ahoj. O čom by si sa chcel porozprávať?";
  }

  if (text.includes("ako sa máš")) {
    return "Ja som tu najmä preto, aby som počúvala teba. Ako sa máš ty?";
  }

  const feelMatch = text.match(/cítim sa (.+)/i);

  if (feelMatch) {
    return `Prečo sa cítiš ${reflectText(feelMatch[1])}?`;
  }

  const amMatch = text.match(/som (.+)/i);

  if (amMatch) {
    return `Ako dlho si ${reflectText(amMatch[1])}?`;
  }

  const wantMatch = text.match(/chcem (.+)/i);

  if (wantMatch) {
    return `Prečo chceš ${reflectText(wantMatch[1])}?`;
  }

  const becauseMatch = text.match(/pretože (.+)/i);

  if (becauseMatch) {
    return `Je ${reflectText(becauseMatch[1])} hlavný dôvod?`;
  }

  if (
    text.includes("mama") ||
    text.includes("otec") ||
    text.includes("rodičia") ||
    text.includes("rodina")
  ) {
    return "Povedz mi viac o svojej rodine.";
  }

  if (text.includes("smutný") || text.includes("smutná")) {
    return "Čo spôsobilo, že sa cítiš smutne?";
  }

  if (text.includes("šťastný") || text.includes("šťastná")) {
    return "Čo ťa robí šťastným?";
  }

  if (text.includes("nahnevaný") || text.includes("nahnevaná")) {
    return "Na koho alebo na čo sa hneváš?";
  }

  if (text.includes("ďakujem")) {
    return "Nemáš za čo. Chceš sa porozprávať ešte o niečom?";
  }

  if (text.endsWith("?")) {
    return "Prečo sa ma na to pýtaš?";
  }

  return getRandomResponse();
};