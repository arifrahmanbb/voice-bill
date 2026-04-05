const fs = require('fs');
let code = fs.readFileSync('assets/js/app.js', 'utf8');

// Mock DOM
const window = {
  SpeechRecognition: null,
  webkitSpeechRecognition: null
};

code = code.replace(/document\.getElementById\('.*?'\)/g, "({value: '', addEventListener: ()=>{}, classList: {add: ()=>{}, remove: ()=>{}}, textContent: ''})");
code = code.replace(/document\.querySelector\('.*?'\)/g, "({value: ''})");

eval(code);

console.log("parseSegment output:", parseSegment("আলু ৫০ টাকা করে ৫ কেজি"));
console.log("ITEMS: ", JSON.stringify(buildItemsOnly("আলু ৫০ টাকা করে ৫ কেজি"), null, 2));

