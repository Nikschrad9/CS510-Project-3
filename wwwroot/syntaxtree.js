// MicroML AST Visualizer using jsSyntaxTree
// Based on jsSyntaxTree by Andre Eisenbach

'use strict';

const VERSION = 'v1.0';

import Tree from './tree.js';
import rotateTip from './tip.js';
import * as Parser from './parser.js';
import * as Tokenizer from './tokenizer.js';

const tree = new Tree();

window.onload = () => {
  e('version').innerHTML = VERSION;
  const canvas = e('canvas');
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight * 0.8; // Restored from 0.3 to 0.8
  tree.setCanvas(canvas);
  registerCallbacks();
  
  // Set initial options
  tree.setFont('sans-serif');
  tree.setFontsize(16);
  tree.setColor(true);
  tree.setSubscript(true);
  tree.setTriangles(true);
  tree.setAlignment(0);
  tree.setSpacing(80); // Reduced from 100 to 50 for more compact trees
  
  // Try initial update with example
  setExample(1);
  
  // Handle window resize
  window.addEventListener('resize', debounce(() => {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8; // Restored from 0.3 to 0.8
    update();
  }, 250));
};

function e(id) {
  return document.getElementById(id);
}

function registerCallbacks() {
  e('code').onkeyup = debounce(update, 500);
  e('code').onchange = update;
  e('font').onchange = update;
  e('fontsize').onchange = update;
  e('spacing').onchange = update;
  e('nodecolor').onchange = update;
  e('autosub').onchange = update;
  e('triangles').onchange = update;
  e('align').onchange = update;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function update() {
  const microMLCode = e('code').value.trim();
  const parseError = e('parse-error');
  parseError.innerHTML = '';
  parseError.style.color = '#cc0000';
  
  if (!microMLCode) {
    parseError.innerHTML = "Please enter some MicroML code";
    return;
  }

  fetch('/parse', {
    method: 'POST',
    body: microMLCode,
    headers: {
      'Content-Type': 'text/plain'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      try {
        // Clear the canvas
        const canvas = e('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Convert numbers to strings in the tree representation
        const treeStr = data.tree.replace(/\[N (\d+)\]/g, '[N "$1"]');
        
        // Parse and tokenize the tree string
        const tokens = Tokenizer.tokenize(treeStr);
        const syntax_tree = Parser.parse(tokens);
        
        // Update tree options
        tree.setFont(e('font').value);
        tree.setFontsize(parseInt(e('fontsize').value));
        tree.setColor(e('nodecolor').checked);
        tree.setSubscript(e('autosub').checked);
        tree.setTriangles(e('triangles').checked);
        tree.setAlignment(parseInt(e('align').value)); // Fixed method name
        tree.setSpacing(parseInt(e('spacing').value));
        
        // Draw the tree
        tree.draw(syntax_tree);
      } catch (err) {
        console.error("Visualization error:", err);
        parseError.innerHTML = "Visualization error: " + err.message;
      }
    } else {
      parseError.innerHTML = data.error || "Unknown parser error";
    }
  })
  .catch(error => {
    console.error("Error:", error);
    parseError.innerHTML = "Error: " + error.message;
  });
}

// Example MicroML programs
function setExample(num) {
  switch (num) {
    case 1:
      e('code').value = 'let add x = x + 1 in add 42 end';
      break;
    case 2:
      e('code').value = 'let fact n = if n = 0 then 1 else n * fact(n-1) in fact 5 end';
      break;
    case 3:
      e('code').value = 'let fib n = if n < 2 then 1 else fib(n-1) + fib(n-2) in fib 6 end';
      break;
  }
  update();
}

window.setExample = setExample;