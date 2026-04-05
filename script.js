const voiceInput = document.querySelector("#voiceInput");
const parseBtn = document.querySelector("#parseBtn");
const clearBtn = document.querySelector("#clearBtn");
const copyBtn = document.querySelector("#copyBtn");
const recordBtn = document.querySelector("#recordBtn");
const jsonOutput = document.querySelector("#jsonOutput");
const billTableBody = document.querySelector("#billTableBody");
const grandTotalDisplay = document.querySelector("#grandTotalDisplay");
const languageBadge = document.querySelector("#languageBadge");
const voiceSupportText = document.querySelector("#voiceSupportText");

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const DIGIT_MAP = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9"
};

const NUMBER_WORDS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  এক: 1,
  দুই: 2,
  তিন: 3,
  চার: 4,
  পাঁচ: 5,
  ছয়: 6,
  সাত: 7,
  আট: 8,
  নয়: 9,
  দশ: 10,
  এগারো: 11,
  বারো: 12,
  তেরো: 13,
  চৌদ্দ: 14,
  পনেরো: 15,
  ষোল: 16,
  সতেরো: 17,
  আঠারো: 18,
  উনিশ: 19,
  বিশ: 20
};

const PRICE_WORDS = new Set(["taka", "tk", "৳", "টাকা"]);

const UNIT_ALIASES = {
  kg: "kg",
  kilo: "kg",
  kilos: "kg",
  kilogram: "kg",
  kilograms: "kg",
  kgs: "kg",
  কেজি: "kg",
  gm: "gm",
  g: "gm",
  gram: "gm",
  grams: "gm",
  gms: "gm",
  গ্রাম: "gm",
  piece: "pcs",
  pieces: "pcs",
  pc: "pcs",
  pcs: "pcs",
  pis: "pcs",
  পিস: "pcs",
  hali: "hali",
  হালি: "hali",
  litre: "litre",
  liter: "litre",
  liters: "litre",
  litres: "litre",
  ltr: "litre",
  লিটার: "litre"
};

const FILLER_WORDS = new Set([
  "and",
  "plus",
  "with",
  "then",
  "item",
  "items",
  "taka",
  "tk",
  "only",
  "price",
  "total",
  "mot",
  "মোট",
  "টাকা",
  "টা",
  "টি",
  "খানা",
  "আর",
  "এবং"
]);

let recognition = null;
let isRecording = false;

function normalizeDigits(text) {
  return text.replace(/[০-৯]/g, (digit) => DIGIT_MAP[digit] || digit);
}

function detectLanguage(text) {
  if (!text.trim()) {
    return "Unknown";
  }

  return /[\u0980-\u09FF]/.test(text) ? "Bangla" : "English";
}

function normalizeText(text) {
  return normalizeDigits(text)
    .replace(/([0-9])([a-zA-Z\u0980-\u09FF]+)/g, "$1 $2")
    .replace(/([a-zA-Z\u0980-\u09FF]+)([0-9])/g, "$1 $2")
    .replace(/৳/g, " ৳ ")
    .replace(/[\u09F2-\u09FF]/g, " ")
    .replace(/[|]/g, ",")
    .replace(/[;]+/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNumberWords(text) {
  return text
    .split(/\s+/)
    .map((token) => {
      const lower = token.toLowerCase();
      return Object.hasOwn(NUMBER_WORDS, lower)
        ? String(NUMBER_WORDS[lower])
        : token;
    })
    .join(" ");
}

function splitByPriceBoundaries(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const segments = [];
  let current = [];
  let numericCount = 0;

  for (const token of tokens) {
    current.push(token);

    if (/^\d+(?:\.\d+)?$/.test(token)) {
      numericCount += 1;
    }

    if (PRICE_WORDS.has(token.toLowerCase()) && numericCount > 0) {
      segments.push(current.join(" ").trim());
      current = [];
      numericCount = 0;
    }
  }

  if (current.length) {
    segments.push(current.join(" ").trim());
  }

  return segments.filter(Boolean);
}

function splitSegments(text) {
  const normalized = normalizeNumberWords(normalizeText(text));
  const roughParts = normalized
    .split(/\n|,|\s+\b(?:and|আর|এবং)\b\s+/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  return roughParts.flatMap((segment) => splitByPriceBoundaries(segment));
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function roundPrice(value) {
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function extractQuantityAndUnit(segment) {
  const compactPattern =
    /(^|\s)(\d+(?:\.\d+)?)\s*(kg|kgs?|kilo|kilos|kilogram|kilograms|কেজি|gm|gms?|gram|grams|গ্রাম|piece|pieces|pc|pcs|pis|পিস|hali|হালি|litre|liter|liters|litres|ltr|লিটার)(?=\s|$)/i;
  const separatedPattern =
    /(^|\s)(\d+(?:\.\d+)?)\s+(kg|kgs?|kilo|kilos|kilogram|kilograms|কেজি|gm|gms?|gram|grams|গ্রাম|piece|pieces|pc|pcs|pis|পিস|hali|হালি|litre|liter|liters|litres|ltr|লিটার)(?=\s|$)/i;
  const unitOnlyPattern =
    /(^|\s)(kg|kgs?|kilo|kilos|kilogram|kilograms|কেজি|gm|gms?|gram|grams|গ্রাম|piece|pieces|pc|pcs|pis|পিস|hali|হালি|litre|liter|liters|litres|ltr|লিটার)(?=\s|$)/i;

  const compactMatch = segment.match(compactPattern) || segment.match(separatedPattern);
  if (compactMatch) {
    return {
      quantity: toNumber(compactMatch[2]) ?? 1,
      unit: UNIT_ALIASES[compactMatch[3].toLowerCase()] || "pcs",
      matchedText: compactMatch[0].trim()
    };
  }

  const standaloneNumber = segment.match(/(^|\s)(\d+(?:\.\d+)?)(?=\s|$)/);
  const unitOnly = segment.match(unitOnlyPattern);
  if (standaloneNumber && unitOnly) {
    return {
      quantity: toNumber(standaloneNumber[2]) ?? 1,
      unit: UNIT_ALIASES[unitOnly[2].toLowerCase()] || "pcs",
      matchedText: `${standaloneNumber[2]} ${unitOnly[2]}`
    };
  }

  return { quantity: 1, unit: "pcs", matchedText: "" };
}

function extractPrice(segment, quantityFound) {
  const priceTagged = segment.match(
    /(\d+(?:\.\d+)?)\s*(?:taka|tk|৳|টাকা)(?=\s|$)/i
  );

  if (priceTagged) {
    return toNumber(priceTagged[1]) ?? 0;
  }

  const allNumbers = [...segment.matchAll(/\d+(?:\.\d+)?/g)].map((match) =>
    toNumber(match[0])
  );
  const filtered = allNumbers.filter((value) => value !== null);

  if (!filtered.length) {
    return 0;
  }

  if (filtered.length === 1 && !quantityFound) {
    return filtered[0];
  }

  return filtered[filtered.length - 1];
}

function cleanupProduct(segment, matchedQuantityUnit, price) {
  let cleaned = normalizeNumberWords(normalizeDigits(segment));

  if (matchedQuantityUnit) {
    const escaped = matchedQuantityUnit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp(escaped, "i"), " ");
  }

  if (price) {
    cleaned = cleaned
      .replace(new RegExp(`${price}\\s*(taka|tk|৳|টাকা)?`, "i"), " ")
      .replace(new RegExp(`(taka|tk|৳|টাকা)\\s*${price}`, "i"), " ");
  }

  cleaned = cleaned
    .replace(/(^|\s)(kg|kgs?|kilo|kilos|kilogram|kilograms|কেজি|gm|gms?|gram|grams|গ্রাম|piece|pieces|pc|pcs|pis|পিস|hali|হালি|litre|liter|liters|litres|ltr|লিটার)(?=\s|$)/gi, " ")
    .replace(/[0-9]+(?:\.[0-9]+)?/g, " ")
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word && !FILLER_WORDS.has(word.toLowerCase()));

  return words.join(" ").trim() || "Unclear_Item";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseSegment(segment) {
  const normalized = normalizeNumberWords(normalizeText(segment));
  if (!normalized) {
    return null;
  }

  const quantityInfo = extractQuantityAndUnit(normalized);
  const hasExplicitQuantity = quantityInfo.matchedText !== "";
  const totalPrice = extractPrice(normalized, hasExplicitQuantity);
  const unitPrice =
    quantityInfo.quantity > 0
      ? roundPrice(totalPrice / quantityInfo.quantity)
      : roundPrice(totalPrice);
  const product = cleanupProduct(segment, quantityInfo.matchedText, totalPrice);

  return {
    product,
    quantity: quantityInfo.quantity,
    unit: quantityInfo.unit,
    price_per_unit: unitPrice,
    subtotal: roundPrice(unitPrice * quantityInfo.quantity)
  };
}

function buildResult(text) {
  const language = detectLanguage(text);
  languageBadge.textContent = `Language: ${language}`;

  const segments = splitSegments(text);
  const items = segments
    .map(parseSegment)
    .filter(Boolean)
    .filter((item) => item.product !== "Unclear_Item" || item.subtotal > 0);

  if (!items.length) {
    return [
      {
        product: "Unclear_Item",
        quantity: 1,
        unit: "pcs",
        price_per_unit: 0,
        subtotal: 0
      },
      {
        grand_total: 0
      }
    ];
  }

  const grandTotal = roundPrice(
    items.reduce((total, item) => total + item.subtotal, 0)
  );

  return [...items, { grand_total: grandTotal }];
}

function renderTable(result) {
  const items = result.filter((entry) => !Object.hasOwn(entry, "grand_total"));
  if (!items.length) {
    billTableBody.innerHTML =
      '<tr class="empty-row"><td colspan="5">Your parsed items will appear here.</td></tr>';
    grandTotalDisplay.textContent = "Grand Total: 0";
    return;
  }

  billTableBody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.product)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(item.unit)}</td>
          <td>${escapeHtml(item.price_per_unit)}</td>
          <td>${escapeHtml(item.subtotal)}</td>
        </tr>
      `
    )
    .join("");

  const grandTotalEntry = result[result.length - 1];
  grandTotalDisplay.textContent = `Grand Total: ${grandTotalEntry.grand_total}`;
}

function renderJson(result) {
  jsonOutput.textContent = JSON.stringify(result, null, 2);
}

function generateBill() {
  const result = buildResult(voiceInput.value);
  renderTable(result);
  renderJson(result);
}

function clearAll() {
  voiceInput.value = "";
  languageBadge.textContent = "Language: Unknown";
  renderTable([]);
  renderJson([]);
}

function copyJson() {
  navigator.clipboard
    .writeText(jsonOutput.textContent)
    .then(() => {
      copyBtn.textContent = "Copied";
      window.setTimeout(() => {
        copyBtn.textContent = "Copy JSON";
      }, 1400);
    })
    .catch(() => {
      copyBtn.textContent = "Copy failed";
      window.setTimeout(() => {
        copyBtn.textContent = "Copy JSON";
      }, 1400);
    });
}

function setupSpeechRecognition() {
  if (!SpeechRecognition) {
    recordBtn.disabled = true;
    voiceSupportText.textContent =
      "Voice input is not available in this browser. You can still paste transcript text.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "bn-BD";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isRecording = true;
    recordBtn.textContent = "Stop Voice Input";
    voiceSupportText.textContent = "Listening... speak your bill items naturally.";
  };

  recognition.onend = () => {
    isRecording = false;
    recordBtn.textContent = "Start Voice Input";
    voiceSupportText.textContent = "Speech recognition works in supported browsers such as Chrome.";
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(" ");

    voiceInput.value = transcript;
  };

  recognition.onerror = () => {
    isRecording = false;
    recordBtn.textContent = "Start Voice Input";
    voiceSupportText.textContent =
      "Voice capture hit an issue. Please try again or paste the transcript manually.";
  };
}

parseBtn.addEventListener("click", generateBill);
clearBtn.addEventListener("click", clearAll);
copyBtn.addEventListener("click", copyJson);
recordBtn.addEventListener("click", () => {
  if (!recognition) {
    return;
  }

  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

setupSpeechRecognition();
