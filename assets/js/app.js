const recordBtn = document.getElementById('recordBtn');
const liveTranscript = document.getElementById('liveTranscript');
const memoList = document.getElementById('memoList');
const draftTotalAmount = document.getElementById('draftTotalAmount');
const finalTotalAmount = document.getElementById('finalTotalAmount');
const clearBtn = document.getElementById('clearBtn');
const finishBillBtn = document.getElementById('finishBillBtn');
const newBillBtn = document.getElementById('newBillBtn');
const printBtn = document.getElementById('printBtn');
const draftFooter = document.getElementById('draftFooter');
const lockedFooter = document.getElementById('lockedFooter');

// New Appending State Logic
let globalCartItems = [];
let interimCartItems = [];
let isRecording = false;
let recognitionLanguage = "bn-BD";

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
const PER_WORDS = new Set(["per", "proti", "প্রতি", "each"]);
const KORE_WORDS = new Set(["kore", "করে"]);
const UNIT_PATTERN =
  "kg|kgs?|kilo|kilos|kilogram|kilograms|কেজি|gm|gms?|gram|grams|গ্রাম|piece|pieces|pc|pcs|pis|ta|ti|টা|টি|khana|পিস|hali|হালি|litre|liter|liters|litres|ltr|লিটার";

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
  ta: "pcs",
  ti: "pcs",
  টা: "pcs",
  টি: "pcs",
  khana: "pcs",
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
  "set",
  "সেট",
  "আর",
  "এবং",
  "প্রতি",
  "proti",
  "per",
  "each",
  "করে",
  "kore"
]);

const PRODUCT_KEYWORDS = {
  grocery: [
    "alu",
    "onion",
    "milk",
    "rice",
    "oil",
    "vegetable",
    "fruit",
    "আলু",
    "পেঁপে",
    "দুধ",
    "চাল",
    "তেল",
    "সবজি",
    "ফল",
    "সাবান"
  ],
  clothing: [
    "shirt",
    "pant",
    "saree",
    "jama",
    "tshirt",
    "t-shirt",
    "শার্ট",
    "প্যান্ট",
    "শাড়ি",
    "জামা"
  ],
  cosmetics: [
    "lipstick",
    "cream",
    "powder",
    "lotion",
    "perfume",
    "শ্যাম্পু",
    "লিপস্টিক",
    "ক্রিম",
    "লোশন",
    "সুগন্ধি"
  ]
};

let recognition = null;
let recognitionBaseText = "";

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

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const nextToken = tokens[index + 1]?.toLowerCase() || "";
    const lower = token.toLowerCase();
    current.push(token);

    if (/^\d+(?:\.\d+)?$/.test(token)) {
      numericCount += 1;
    }

    const nextLooksLikeQuantity =
      /^\d+(?:\.\d+)?$/.test(nextToken) &&
      new RegExp(`^(${UNIT_PATTERN})$`, "i").test(tokens[index + 2] || "");
    const nextLooksLikeRateUnit =
      new RegExp(`^(${UNIT_PATTERN})$`, "i").test(nextToken) &&
      KORE_WORDS.has((tokens[index + 2] || "").toLowerCase());
    const endsWithTaggedPrice =
      PRICE_WORDS.has(lower) &&
      numericCount > 0 &&
      !KORE_WORDS.has(nextToken) &&
      !nextLooksLikeRateUnit;
    const endsWithPerUnitPhrase =
      KORE_WORDS.has(lower) && numericCount > 0 && !nextLooksLikeQuantity;

    if (endsWithTaggedPrice || endsWithPerUnitPhrase) {
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

function setMenuState(isOpen) {
  appMenu.hidden = !isOpen;
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function getHeaderConfig(items) {
  if (!items.length) {
    return {
      quantity: "Qty",
      unit: "Unit",
      price: "Price/Unit",
      subtotal: "Subtotal",
      notes: "Notes"
    };
  }

  const contextScores = {
    grocery: 0,
    clothing: 0,
    cosmetics: 0
  };

  for (const item of items) {
    const productText = String(item.product || "").toLowerCase();

    if (["kg", "gm", "litre"].includes(item.unit)) {
      contextScores.grocery += 2;
    }

    if (item.unit === "pcs" || item.unit === "hali") {
      contextScores.clothing += 0.5;
      contextScores.cosmetics += 0.5;
    }

    for (const [context, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
      if (keywords.some((keyword) => productText.includes(keyword))) {
        contextScores[context] += 2;
      }
    }
  }

  const dominantContext = Object.entries(contextScores).sort(
    (left, right) => right[1] - left[1]
  )[0][0];

  if (dominantContext === "grocery") {
    return {
      quantity: "Amount",
      unit: "Measure",
      price: "Rate",
      subtotal: "Line Total",
      notes: "Billing Note"
    };
  }

  if (dominantContext === "clothing") {
    return {
      quantity: "Count",
      unit: "Type",
      price: "Rate/Item",
      subtotal: "Amount",
      notes: "Details"
    };
  }

  if (dominantContext === "cosmetics") {
    return {
      quantity: "Units",
      unit: "Pack",
      price: "Price Each",
      subtotal: "Total Price",
      notes: "Usage Note"
    };
  }

  return {
    quantity: "Qty",
    unit: "Unit",
    price: "Price/Unit",
    subtotal: "Subtotal",
    notes: "Notes"
  };
}

function renderHeaders(result) {
  const items = result.filter((entry) => !Object.hasOwn(entry, "grand_total"));
  const labels = getHeaderConfig(items);
  headerProduct.textContent = "Product";
  headerQuantity.textContent = labels.quantity;
  headerUnit.textContent = labels.unit;
  headerPrice.textContent = labels.price;
  headerSubtotal.textContent = labels.subtotal;
  headerNotes.textContent = labels.notes;
}

function extractQuantityAndUnit(segment, excludedText = "") {
  const compactPattern =
    new RegExp(`(^|\\s)(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})(?=\\s|$)`, "i");
  const separatedPattern =
    new RegExp(`(^|\\s)(\\d+(?:\\.\\d+)?)\\s+(${UNIT_PATTERN})(?=\\s|$)`, "i");
  const unitOnlyPattern =
    new RegExp(`(^|\\s)(${UNIT_PATTERN})(?=\\s|$)`, "i");
  const workingSegment = excludedText
    ? segment.replace(excludedText, " ").replace(/\s+/g, " ").trim()
    : segment;

  const quantityMatches = [
    ...workingSegment.matchAll(
      new RegExp(`(^|\\s)(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})(?=\\s|$)`, "gi")
    )
  ];
  const compactMatch =
    quantityMatches[quantityMatches.length - 1] ||
    workingSegment.match(compactPattern) ||
    workingSegment.match(separatedPattern);
  if (compactMatch) {
    return {
      quantity: toNumber(compactMatch[2]) ?? 1,
      unit: UNIT_ALIASES[compactMatch[3].toLowerCase()] || "pcs",
      matchedText: compactMatch[0].trim()
    };
  }

  const standaloneNumber = workingSegment.match(/(^|\s)(\d+(?:\.\d+)?)(?=\s|$)/);
  const unitOnly = workingSegment.match(unitOnlyPattern);
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
  const perUnitPattern = new RegExp(
    `(?:প্রতি|proti|per|each)\\s*(?:(${UNIT_PATTERN}))?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:taka|tk|৳|টাকা|ta|টা)?(?:\\s*(?:kore|করে))?(?=\\s|$)`,
    "i"
  );
  const unitTrailingPerPattern = new RegExp(
    `(?:(${UNIT_PATTERN}))\\s*(?:প্রতি|proti|per)\\s*(\\d+(?:\\.\\d+)?)\\s*(?:taka|tk|৳|টাকা|ta|টা)?(?:\\s*(?:kore|করে))?(?=\\s|$)`,
    "i"
  );
  const reversePerUnitPattern = new RegExp(
    `(\\d+(?:\\.\\d+)?)\\s*(?:taka|tk|৳|টাকা|ta|টা)?\\s*(${UNIT_PATTERN})\\s*(?:kore|করে|proti|প্রতি|per|each)(?=\\s|$)`,
    "i"
  );
  const korePricePattern =
    /(\d+(?:\.\d+)?)\s*(?:taka|tk|৳|টাকা|ta|টা)?\s*(?:kore|করে)(?=\s|$)/i;
  const priceTagged = segment.match(
    /(\d+(?:\.\d+)?)\s*(?:taka|tk|৳|টাকা)(?=\s|$)/i
  );
  const explicitPerUnit = segment.match(perUnitPattern);
  const unitBeforePer = segment.match(unitTrailingPerPattern);
  const reversePerUnit = segment.match(reversePerUnitPattern);
  const koreUnitPrice = segment.match(korePricePattern);

  if (explicitPerUnit) {
    return {
      mode: "per_unit",
      value: toNumber(explicitPerUnit[2]) ?? 0,
      detectedUnit: explicitPerUnit[1]
        ? UNIT_ALIASES[explicitPerUnit[1].toLowerCase()] || null
        : null,
      matchedText: explicitPerUnit[0].trim()
    };
  }

  if (unitBeforePer) {
    return {
      mode: "per_unit",
      value: toNumber(unitBeforePer[2]) ?? 0,
      detectedUnit: unitBeforePer[1]
        ? UNIT_ALIASES[unitBeforePer[1].toLowerCase()] || null
        : null,
      matchedText: unitBeforePer[0].trim()
    };
  }

  if (reversePerUnit) {
    return {
      mode: "per_unit",
      value: toNumber(reversePerUnit[1]) ?? 0,
      detectedUnit: reversePerUnit[2]
        ? UNIT_ALIASES[reversePerUnit[2].toLowerCase()] || null
        : null,
      matchedText: reversePerUnit[0].trim()
    };
  }

  if (koreUnitPrice) {
    return {
      mode: "per_unit",
      value: toNumber(koreUnitPrice[1]) ?? 0,
      detectedUnit: null,
      matchedText: koreUnitPrice[0].trim()
    };
  }

  if (priceTagged) {
    return {
      mode: "total",
      value: toNumber(priceTagged[1]) ?? 0,
      detectedUnit: null,
      matchedText: priceTagged[0].trim()
    };
  }

  const allNumbers = [...segment.matchAll(/\d+(?:\.\d+)?/g)].map((match) =>
    toNumber(match[0])
  );
  const filtered = allNumbers.filter((value) => value !== null);

  if (!filtered.length) {
    return {
      mode: "none",
      value: 0,
      detectedUnit: null,
      matchedText: ""
    };
  }

  if (filtered.length === 1 && !quantityFound) {
    return {
      mode: "total",
      value: filtered[0],
      detectedUnit: null,
      matchedText: String(filtered[0])
    };
  }

  return {
    mode: "total",
    value: filtered[filtered.length - 1],
    detectedUnit: null,
    matchedText: String(filtered[filtered.length - 1])
  };
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
    .replace(new RegExp(`(^|\\s)(${UNIT_PATTERN})(?=\\s|$)`, "gi"), " ")
    .replace(/\b(taka|tk|price|total|proti|per|each|kore)\b/gi, " ")
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

  const pricingInfo = extractPrice(normalized, false);
  const quantityInfo = extractQuantityAndUnit(
    normalized,
    pricingInfo.matchedText || ""
  );
  const effectiveUnit = pricingInfo.detectedUnit || quantityInfo.unit;
  let unitPrice = 0;
  let subtotal = 0;
  let note = "";

  if (pricingInfo.mode === "per_unit") {
    unitPrice = roundPrice(pricingInfo.value);
    subtotal = roundPrice(unitPrice * quantityInfo.quantity);
    note = `Per ${effectiveUnit}: ${unitPrice}`;
  } else if (pricingInfo.mode === "total") {
    subtotal = roundPrice(pricingInfo.value);
    unitPrice =
      quantityInfo.quantity > 0
        ? roundPrice(subtotal / quantityInfo.quantity)
        : roundPrice(subtotal);
    note =
      quantityInfo.quantity > 1
        ? `Total ${subtotal} for ${quantityInfo.quantity} ${effectiveUnit}`
        : `Single item total ${subtotal}`;
  }

  const product = cleanupProduct(
    segment,
    quantityInfo.matchedText,
    pricingInfo.value
  );

  return {
    product,
    quantity: quantityInfo.quantity,
    unit: effectiveUnit,
    price_per_unit: unitPrice,
    subtotal,
    notes: note || "Parsed from voice text"
  };
}

function buildItemsOnly(text) {
  const segments = splitSegments(text);
  return segments
    .map(parseSegment)
    .filter(Boolean)
    .filter((item) => item.product !== "Unclear_Item" || item.subtotal > 0);
}

function formatMoney(amount) {
  return '৳' + amount.toLocaleString('en-IN');
}

function renderTable() {
  const allItems = [...globalCartItems, ...interimCartItems];
  const grandTotal = allItems.reduce((sum, item) => sum + item.subtotal, 0);

  if (!allItems.length) {
    if(memoList) memoList.innerHTML = '<div class="memo-row" id="placeholderRow" style="color: #94a3b8; font-weight: 400; text-align: center; display: block;">Speak to add items...</div>';
    if(draftTotalAmount) draftTotalAmount.textContent = "৳0";
    if(finalTotalAmount) finalTotalAmount.textContent = "৳0";
    return;
  }

  if(memoList) {
    memoList.innerHTML = allItems
      .map(
        (item, idx) => `
          <div class="memo-row">
            <div>${escapeHtml(item.product)}</div>
            <div class="col-center">${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</div>
            <div class="col-right">${escapeHtml(item.price_per_unit)}</div>
            <div class="col-right row-total">${escapeHtml(item.subtotal)}</div>
            <div>
               <button class="delete-btn" onclick="removeItem(${idx})">×</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  const formattedTotal = formatMoney(grandTotal);
  if(draftTotalAmount) draftTotalAmount.textContent = formattedTotal;
  if(finalTotalAmount) finalTotalAmount.textContent = formattedTotal;
  
  const memoArea = document.querySelector('.memo-area');
  if(memoArea) memoArea.scrollTop = memoArea.scrollHeight;
}

window.removeItem = function(index) {
  if (index < globalCartItems.length) {
    globalCartItems.splice(index, 1);
  } else {
    interimCartItems.splice(index - globalCartItems.length, 1);
  }
  renderTable();
}

function setAppState(mode) {
  if(mode === 'finished') {
    if(draftFooter) draftFooter.style.display = 'none';
    if(lockedFooter) lockedFooter.style.display = 'flex';
    document.querySelectorAll('.delete-btn').forEach(btn => btn.style.display = 'none');
  } else {
    if(draftFooter) draftFooter.style.display = 'flex';
    if(lockedFooter) lockedFooter.style.display = 'none';
    document.querySelectorAll('.delete-btn').forEach(btn => btn.style.display = 'flex');
  }
}

if(finishBillBtn) finishBillBtn.addEventListener("click", () => setAppState('finished'));
if(newBillBtn) newBillBtn.addEventListener("click", clearAll);
if(printBtn) printBtn.addEventListener("click", () => window.print());

function clearAll() {
  globalCartItems = [];
  interimCartItems = [];
  document.querySelector('.customer-input').value = '';
  setAppState('draft');
  renderTable();
}

function setupSpeechRecognition() {
  if (!SpeechRecognition) {
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = recognitionLanguage;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isRecording = true;
    if(recordBtn) recordBtn.classList.add('listening');
    if(liveTranscript) liveTranscript.textContent = "Listening...";
  };

  recognition.onend = () => {
    isRecording = false;
    if(recordBtn) recordBtn.classList.remove('listening');
    if(liveTranscript) {
      setTimeout(() => { liveTranscript.textContent = ""; }, 1500);
    }
    // Commit the interim items formally when pause happens
    if (interimCartItems.length > 0) {
      globalCartItems.push(...interimCartItems);
      interimCartItems = [];
    }
    renderTable();
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map(r => r[0].transcript).join(' ');
    if(liveTranscript) liveTranscript.textContent = "Translating: " + transcript;
    
    interimCartItems = buildItemsOnly(transcript);
    renderTable();
  };

  recognition.onerror = () => {
    isRecording = false;
    if(recordBtn) recordBtn.classList.remove('listening');
    if(liveTranscript) liveTranscript.textContent = "Kotha shunte paini. Abar balun.";
  };
}

if(clearBtn) clearBtn.addEventListener("click", clearAll);

if(recordBtn) recordBtn.addEventListener("click", () => {
  if (!recognition) {
    alert("Voice input is not supported in this browser. Please use Chrome.");
    return;
  }

  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

setupSpeechRecognition();
