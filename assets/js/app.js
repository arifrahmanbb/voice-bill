const recordBtn = document.getElementById('recordBtn');
const liveTranscript = document.getElementById('liveTranscript');
const memoList = document.getElementById('memoList');
const draftTotalAmount = document.getElementById('draftTotalAmount');
const finalTotalAmount = document.getElementById('finalTotalAmount');
const clearBtn = document.getElementById('clearBtn');
const finishBillBtn = document.getElementById('finishBillBtn');
const newBillBtn = document.getElementById('newBillBtn');
const printBtn = document.getElementById('printBtn');
const copyTextBtn = document.getElementById('copyTextBtn');
const draftFooter = document.getElementById('draftFooter');
const lockedFooter = document.getElementById('lockedFooter');
const discountInput = document.getElementById('discountInput');
const paidInput = document.getElementById('paidInput');
const dueAmount = document.getElementById('dueAmount');

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
  const compactPattern = new RegExp(`(^|\\s)(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})(?=\\s|$)`, "gi");
  const separatedPattern = new RegExp(`(^|\\s)(\\d+(?:\\.\\d+)?)\\s+(${UNIT_PATTERN})(?=\\s|$)`, "gi");
  const unitOnlyPattern = new RegExp(`(^|\\s)(${UNIT_PATTERN})(?=\\s|$)`, "i");
  
  const workingSegment = excludedText
    ? segment.replace(excludedText, " ").replace(/\s+/g, " ").trim()
    : segment;

  const quantityMatches = [...workingSegment.matchAll(compactPattern)];
  
  // Aggregate multiple matches (e.g., "1 kg 300 gm" -> 1.3 kg)
  if (quantityMatches.length > 0) {
    let totalKg = 0;
    let isWeight = false;
    let lastQty = 0;
    let lastUnit = "pcs";
    let matchedCombinedText = "";

    quantityMatches.forEach(match => {
       const rawVal = toNumber(match[2]) ?? 1;
       const rawUnit = UNIT_ALIASES[match[3].toLowerCase()] || "pcs";
       matchedCombinedText += match[0] + " ";

       if (rawUnit === "kg") {
           totalKg += rawVal;
           isWeight = true;
       } else if (rawUnit === "gm") {
           totalKg += (rawVal / 1000);
           isWeight = true;
       } else {
           lastQty = rawVal;
           lastUnit = rawUnit;
       }
    });

    if (isWeight) {
       return {
          quantity: Math.round(totalKg * 1000) / 1000, // Handle float precision
          unit: "kg",
          matchedText: matchedCombinedText.trim()
       };
    } else {
       return {
          quantity: lastQty,
          unit: lastUnit,
          matchedText: matchedCombinedText.trim()
       };
    }
  }

  const standaloneNumber = workingSegment.match(/(^|\s)(\d+(?:\.\d+)?)(?=\s|$)/);
  const unitOnly = workingSegment.match(unitOnlyPattern);
  
  if (standaloneNumber && unitOnly) {
    let qty = toNumber(standaloneNumber[2]) ?? 1;
    let unit = UNIT_ALIASES[unitOnly[2].toLowerCase()] || "pcs";

    if (unit === "gm") {
        qty = qty / 1000;
        unit = "kg";
    }

    return {
      quantity: Math.round(qty * 1000) / 1000,
      unit: unit,
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
  const implicitPerUnitPattern = new RegExp(
    `(\\d+(?:\\.\\d+)?)\\s*(?:taka|tk|৳|টাকা|ta|টা)?\\s*(${UNIT_PATTERN})(?=\\s|$)`,
    "i"
  );
  const priceTagged = segment.match(
    /(\d+(?:\.\d+)?)\s*(?:taka|tk|৳|টাকা)(?=\s|$)/i
  );
  const explicitPerUnit = segment.match(perUnitPattern);
  const unitBeforePer = segment.match(unitTrailingPerPattern);
  const reversePerUnit = segment.match(reversePerUnitPattern);
  const koreUnitPrice = segment.match(korePricePattern);
  const implicitPerUnit = segment.match(implicitPerUnitPattern);

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

  if (implicitPerUnit) {
    return {
      mode: "per_unit",
      value: toNumber(implicitPerUnit[1]) ?? 0,
      detectedUnit: UNIT_ALIASES[implicitPerUnit[2].toLowerCase()] || null,
      matchedText: implicitPerUnit[0].trim()
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

function convertQuantityForPricing(qty, qtyUnit, priceUnit) {
  if (!qtyUnit || !priceUnit || qtyUnit === priceUnit) return qty;
  if (qtyUnit === "gm" && priceUnit === "kg") return qty / 1000;
  if (qtyUnit === "kg" && priceUnit === "gm") return qty * 1000;
  if (qtyUnit === "hali" && priceUnit === "pcs") return qty * 4;
  if (qtyUnit === "pcs" && priceUnit === "hali") return qty / 4;
  return qty;
}

function parseSegment(segment) {
  const normalized = normalizeNumberWords(normalizeText(segment));
  if (!normalized) {
    return null;
  }

  const quantityInfo = extractQuantityAndUnit(normalized, "");
  
  // Wipe out the quantity match so price extractor doesn't trip on it
  const textWithoutQuantity = quantityInfo.matchedText 
      ? normalized.replace(quantityInfo.matchedText, " ") 
      : normalized;

  const pricingInfo = extractPrice(textWithoutQuantity, !!quantityInfo.matchedText);
  const effectiveUnit = quantityInfo.unit; // Default display unit

  let unitPrice = 0;
  let subtotal = 0;
  let note = "";

  if (pricingInfo.mode === "per_unit") {
    unitPrice = roundPrice(pricingInfo.value);
    
    const pUnit = pricingInfo.detectedUnit || quantityInfo.unit;
    const actualQty = convertQuantityForPricing(quantityInfo.quantity, quantityInfo.unit, pUnit);
    
    subtotal = roundPrice(unitPrice * actualQty);
    note = `Rate: ${unitPrice}/${pUnit}`;
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

function buildItemsOnly(transcript) {
  const words = transcript.split(/\s+/);
  if (words.length < 2) return [];

  const segments = splitIntoSegments(transcript);

  return segments
    .map((itemStr) => {
      const item = parseSegment(itemStr);
      if (item && item.subtotal > 0 && item.product && item.product !== 'Unclear_Item') {
         return item;
      }
      
      // Flash Error Message for Unclear Input
      const liveTranscript = document.getElementById('liveTranscript');
      if(liveTranscript) {
         liveTranscript.innerHTML = `<span style="color: #ef4444; font-weight: 700;">⚠ Kotha Bujha Jayni (Math failed): "${itemStr}"</span>`;
         setTimeout(() => { 
            if(!isRecording) liveTranscript.innerHTML = ""; 
         }, 3000);
      }
      return null;
    })
    .filter((item) => item !== null);
}

function formatMoney(amount) {
  return '৳' + amount.toLocaleString('en-IN');
}

function renderTable() {
  const allItems = [...globalCartItems, ...interimCartItems];
  const grandTotal = allItems.reduce((sum, item) => sum + item.subtotal, 0);

  if (!allItems.length) {
    if(memoList) memoList.innerHTML = `
          <div id="placeholderRow" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; color: var(--text-muted);">
            <div style="width: 64px; height: 64px; background: #e0f2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #0284c7;">
              <svg style="width: 32px; height: 32px; fill: currentColor;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
            </div>
            <h3 style="color: var(--text-main); font-size: 18px; margin-bottom: 8px;">Tap Mic to Start 🎙️</h3>
            <p style="font-size: 14px; line-height: 1.5; margin-bottom: 12px;">নিচের সবুজ বাটনে চাপ দিয়ে আইটেম বলা শুরু করুন।</p>
            <div style="background: white; border: 1px dashed #cbd5e1; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--primary);">
               যেমন: "চিনি ২ কেজি ১০০ টাকা"
            </div>
          </div>
    `;
    if(draftTotalAmount) draftTotalAmount.textContent = "৳0";
    if(finalTotalAmount) finalTotalAmount.textContent = "৳0";
    return;
  }

  if(memoList) {
    const renderRow = (item, idx, isInterim) => `
      <div class="memo-row ${isInterim ? 'interim-row' : ''}" id="row-${idx}">
        <div>${escapeHtml(item.product)}</div>
        <div class="col-center" style="font-size: 13px; color: var(--text-muted);">${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}<br><span style="font-size: 10px;">@ ${escapeHtml(item.price_per_unit)}</span></div>
        <div class="col-right" style="position: relative;">
           <span style="position: absolute; left: 8px; color: var(--text-muted); top: 50%; transform: translateY(-50%); pointer-events: none;">৳</span>
           <input type="number" 
                  class="price-edit-input"
                  value="${item.subtotal}" 
                  ${isInterim ? 'readonly' : ''}
                  onfocus="if(isRecording && recognition) recognition.stop(); this.select();"
                  onchange="updateItemPrice(${idx}, this.value)"
                  style="width: 70px; text-align: right; border: ${isInterim ? 'none' : '1px solid #e2e8f0'}; border-radius: 6px; padding: 6px 8px; padding-left: 20px; font-family: inherit; font-size: 15px; color: var(--text-main); font-weight: 700; background: ${isInterim ? 'transparent' : '#f8fafc'}; -moz-appearance: textfield;">
        </div>
        <div style="display: flex; justify-content: flex-end; align-items: center;">
           ${isInterim 
             ? '<div class="spinner"></div>' 
             : `<button class="delete-btn" onclick="removeItem(${idx})" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #fee2e2; color: #ef4444; border: none; border-radius: 6px; cursor: pointer;">
                 <svg style="width: 16px; height: 16px; fill: currentColor;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
               </button>`
           }
        </div>
      </div>
    `;

    const globalHTML = globalCartItems.map((item, idx) => renderRow(item, idx, false)).join("");
    const interimHTML = interimCartItems.map((item, idx) => renderRow(item, globalCartItems.length + idx, true)).join("");
    
    memoList.innerHTML = globalHTML + interimHTML;
  }

  const formattedTotal = formatMoney(grandTotal);
  if(draftTotalAmount) draftTotalAmount.textContent = formattedTotal;
  
  calculateKhata();
  
  const memoArea = document.querySelector('.memo-area');
  // Only scroll down if we are recording (don't jump when editing a mid-list price)
  if(memoArea && isRecording) memoArea.scrollTop = memoArea.scrollHeight;
}

window.updateItemPrice = function(index, newPrice) {
  const numPrice = Number(newPrice);
  if (!isNaN(numPrice)) {
    if (index < globalCartItems.length) {
      globalCartItems[index].subtotal = numPrice;
    } else {
      interimCartItems[index - globalCartItems.length].subtotal = numPrice;
    }
    renderTable();
  }
}

function calculateKhata() {
   const allItems = [...globalCartItems, ...interimCartItems];
   const grandTotal = allItems.reduce((sum, item) => sum + item.subtotal, 0);
   
   const discount = Number(discountInput ? discountInput.value : 0) || 0;
   const payable = Math.max(0, grandTotal - discount);
   
   if (finalTotalAmount) finalTotalAmount.textContent = formatMoney(payable);
   
   const paid = Number(paidInput ? paidInput.value : 0) || 0;
   const due = Math.max(0, payable - paid);
   
   if (dueAmount) dueAmount.textContent = formatMoney(due);
}

if(discountInput) discountInput.addEventListener('input', calculateKhata);
if(paidInput) paidInput.addEventListener('input', calculateKhata);

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
    document.querySelectorAll('.price-edit-input').forEach(input => {
      input.setAttribute('readonly', 'true');
      input.style.border = 'none';
      input.style.background = 'transparent';
      input.style.paddingLeft = '12px';
      // Hide the absolute ৳ symbol slightly to offset the text
      const symbolSpan = input.previousElementSibling;
      if (symbolSpan && symbolSpan.tagName.toLowerCase() === 'span') {
         symbolSpan.style.left = '0px';
      }
    });
  } else {
    if(draftFooter) draftFooter.style.display = 'flex';
    if(lockedFooter) lockedFooter.style.display = 'none';
    document.querySelectorAll('.delete-btn').forEach(btn => btn.style.display = 'flex');
    document.querySelectorAll('.price-edit-input').forEach(input => {
      input.removeAttribute('readonly');
      input.style.border = '1px solid #e2e8f0';
      input.style.background = '#f8fafc';
      input.style.paddingLeft = '20px';
      const symbolSpan = input.previousElementSibling;
      if (symbolSpan && symbolSpan.tagName.toLowerCase() === 'span') {
         symbolSpan.style.left = '8px';
      }
    });
  }
}

if(finishBillBtn) finishBillBtn.addEventListener("click", () => setAppState('finished'));
if(newBillBtn) newBillBtn.addEventListener("click", clearAll);
if(printBtn) printBtn.addEventListener("click", () => window.print());
if(copyTextBtn) {
  copyTextBtn.addEventListener("click", () => {
    let textOut = "====== MUKTIR DOKAN ======\n";
    globalCartItems.forEach((item, index) => {
       textOut += `${index + 1}. ${item.qty} ${item.unit} x ${item.name} = ৳${item.subtotal}\n`;
    });
    
    const totalRaw = globalCartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const dVal = parseFloat(discountInput.value) || 0;
    const pVal = parseFloat(paidInput.value) || 0;
    
    textOut += `----------------------\nSubtotal:    ৳${totalRaw}\n`;
    if(dVal > 0) textOut += `Discount:   -৳${dVal}\n`;
    
    const finalAmount = Math.max(0, totalRaw - dVal);
    textOut += `Payable:     ৳${finalAmount}\n`;
    
    if(pVal > 0) textOut += `Cust. Paid:  ৳${pVal}\n`;
    
    const dueAmountVal = Math.max(0, finalAmount - pVal);
    if(dueAmountVal > 0) textOut += `Due Left:    ৳${dueAmountVal}\n`;
    textOut += "==========================";

    navigator.clipboard.writeText(textOut).then(() => {
       alert("🧾 Bill copied to clipboard! Ready to send on WhatsApp.");
    }).catch(err => {
       alert("Failed to copy bill.");
    });
  });
}

function clearAll() {
  globalCartItems = [];
  interimCartItems = [];
  document.querySelector('.customer-input').value = '';
  if(discountInput) discountInput.value = '';
  if(paidInput) paidInput.value = '';
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
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript.trim() !== '') {
       const finalItems = buildItemsOnly(finalTranscript);
       globalCartItems.push(...finalItems);
    }

    if (interimTranscript.trim() !== '') {
      if(liveTranscript) liveTranscript.textContent = "Translating: " + interimTranscript;
      interimCartItems = buildItemsOnly(interimTranscript);
    } else {
      interimCartItems = [];
    }

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
