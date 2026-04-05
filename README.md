# 🎙️ Digital Khata: Voice Bill POS

A revolutionary, voice-powered Point of Sale (POS) and "Digital Khata" system built exclusively for non-tech-savvy shopkeepers, local retail merchants, and grocery owners. 

Instead of typing into complex POS software, merchants simply tap the mic and speak naturally:  
**🗣️ "চিনি ১ কেজি ৩০০ গ্রাম, ১০০ টাকা কেজি"** *(Sugar 1 kg 300 gram, 100 taka kg).*  
The system instantly extracts the product, normalizes the metric weights, calculates the absolute subunit math, and builds a perfect cash memo in real-time.

---

## 🌟 What type of product is this?
This is a **Mobile-First Progressive Web Application (PWA) / Digital Ledger**.  
It transitions a traditional notebook (Khata) into an automated voice-powered ledger. It completely drops complicated dropdowns, barcodes, and inventory mapping for maximum speed and simplicity, specifically tailored to the real-world bargaining habits in South Asian retail interactions.

---

## 🔥 Current Core Features

### 1. Robust Voice NLP & Auto-Math Engine
*   **Compound Weight Normalization:** Speaks "১ কেজি ৩০০ গ্রাম"? The system parses both inputs internally and outputs a professional standard `1.3 kg`. 
*   **Metric Math Conversion:** Speaks "৩০০ গ্রাম ৮০ টাকা কেজি"? The engine detects mismatched quantities (Grams) vs rates (Kg) and perfectly calculates the percentage total natively!
*   **Dual Language Context:** Fully supports Bangla (bn-BD) and English (en-US) natively.

### 2. The "Pause, Ask & Resume" Cart
*   **Persistent Draft Mode:** Shopkeepers often process orders in chunks ("What else do you need?"). The mic can be toggled on/off repeatedly, and new words are perfectly appended as fresh lines. Existing items are locked in a safe state permanently until deleted.
*   **Visual Loading Spinners:** During translation, the line appears grayed-out with a processing spinner, letting the user know exactly what is happening under the hood.

### 3. Real-World Retail Interactivity
*   **Editable Price Subtotals:** Customers often haggle. A shopkeeper can simply tap the actual Subtotal on the receipt to type in a manually negotiated price. 
*   **Smart Focus Lock:** Tapping an input field instinctively pauses the Microphone so background noise doesn't overwrite anything!

### 4. Comprehensive Khata Ledger State
A dedicated **"Save & Finish"** module that locks the voice inputs and triggers the final checkout pane:
*   **Apply Discounts:** Drop the total by a specific amount.
*   **Customer Paid Tracker:** Log exactly how much cash was handed over.
*   **Auto Due-Calculator:** Immediately calculates and highlights the exact Due Amount in red for the localized ledger.

### 5. Contextual Visual Guidance
*   Features a dynamic, visual tutorial in the Settings page detailing exact "Do's and Don'ts" (✅ vs ❌).
*   The entire manual actively translates itself seamlessly based on whether the shopkeeper selects Bangla or English.

---

## 🛠 Tech Stack & Architecture

*   **HTML5 / SCSS:** Mobile-responsive, high-trust UI utilizing clean padding, distinct semantic states, and SVG iconography.
*   **Vanilla JS (ES6+):** Pure browser execution relying on the native `SpeechRecognition` API. Zero heavy frameworks (No React, Vue, or bulky libraries).
*   **Client-Side Persistence:** `localStorage` is completely utilized for Settings persistence, making performance immediate.

## 🚀 Running Locally

1. Clone or download this project.
2. Ensure you have SCSS compiled: `npx sass assets/scss/style.scss assets/css/style.css` 
3. Because this relies heavily on secure API contexts (`SpeechRecognition`), **it must be run on a secure server**.
4. Simply launch a local development server (e.g., `npx serve .` or VS Code Live Server) and open `index.html`.

*Note: Safari / Chrome handle Web Speech APIs slightly differently; Chrome provides the best, most continuous streaming results for this exact implementation.*
