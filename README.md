# Voice Bill Assistant

Voice Bill Assistant is a web-based smart tool designed for local shopkeepers to turn messy voice notes into clean, ready-to-use bills. The app processes voice inputs or pasted text in both Bangla and English and generates detailed billing data visually and in JSON format.

## Product Overview

The core purpose of this tool is to provide a frictionless way for shopkeepers to dictate items, quantities, and prices dynamically (e.g. `চিনি ৩ কেজি প্রতি কেজি ৩০ টাকা` or `shirt 2 piece 500 kore`), and immediately get back a structured view of the bill that calculates unit prices, subtotals, and grand totals instantly in real-time.

## Key Features

*   **Multilingual Voice Support**: Designed to understand mixed language combinations, primarily Bangla and English styles!
*   **Live Parsing System**: Generates and updates billing tables dynamically as the transcript is typed or spoken into the dashboard.
*   **Intelligent Entity Extraction**: Leverages an intelligent natural-language parser to discover item names, quantities, unit metrics (`kg`, `gm`, `pcs`, `litre`, `ti`, `ta`, etc.), per-unit prices, and outright totals.
*   **Context-Aware Display**: Detects the most probable business category (Grocery, Clothing, Cosmetics) based on input and renames headers accordingly (e.g., replacing 'Qty' with 'Amount' or 'Count').
*   **Advanced Output**: Creates developer-friendly JSON output for external software integrations, which can easily be copied to the clipboard.

## How to Use

1.  **Language Configuration**: Select your desired voice language (Bangla, English, English India) from the internal menu.
2.  **Voice Input**: Click the `Start Voice Input` button and start dictating the items. Alternatively, manually type or paste the transcription.
3.  **Result Table**: Wait for the voice text to instantly build up the actual shop receipt consisting of Product names, Subtotals, and the Grand Total.
4.  **Copy JSON Output**: For integrating or logging, click the `Copy JSON` button in the Result Panel to copy structured output to your clipboard.

## Missing Features & Roadmap

The current version of the product operates beautifully as a client-side parser but could easily be extended with the following features:

1.  **Export Options (PDF/Print)**: Ability for the user to select `Print Bill` or `Export to PDF` so the shopkeeper can immediately hand over a physical printed receipt to the customer.
2.  **CSV/Excel Export**: Along with JSON, the option to export the raw data straight into a spreadsheet.
3.  **Invoice History**: Implementing `localStorage` or a database connection to allow shopkeepers to track and view past sales directly inside the app.
4.  **Taxation and Discounts**: Dedicated controls to apply Flat or Percentage-based Discounts, and calculate necessary VAT/Tax logic.
5.  **Progressive Web App (PWA)**: Adding a web manifest and service workers so the shopkeeper can use the tool effectively on their phone offline or as an installed desktop app.
6.  **Backend Integration**: Integrate an actual backend (Node.js/PHP) to save products and map spoken items with current database prices when only the generic product name is spoken.

## Tech Stack

*   **HTML5** - Semantic markup prioritizing accessibility and layout structuring.
*   **CSS3** - Pure Vanilla CSS ensuring lightning quick load times.
*   **Vanilla JavaScript (ES6)** - Used for SpeechRecognition API, NLP parsing algorithms, DOM rendering. No heavy frameworks!

## Running the Application Locally

1.  Clone or download the HTML template structure.
2.  Simply open `index.html` in a modern browser (such as Google Chrome). Note that since the app uses the `SpeechRecognition` API, having Chrome installed yields the highest compatibility.

---
**Disclaimer**: Browser security policies might restrict microphone access for `file://` URLs. We recommend running the folder through a simple localized development server (e.g. `npx serve .` or VSCode Live Server) for ensuring total functionality.
