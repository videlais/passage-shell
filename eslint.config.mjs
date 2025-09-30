import js from "@eslint/js";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "coverage/**", 
      "**/*.min.js",
      "settings/js/vendor/**", // Ignore vendor libraries
      "twine2/**"
    ]
  },
  
  // Main configuration
  js.configs.recommended,
  
  // Node.js files (main.js)
  {
    files: ["main.js"],
    plugins: {
      jsdoc
    },
    languageOptions: {
      globals: {
        ...globals.node
      },
      sourceType: "commonjs"
    },
    rules: {
      "semi": ["error", "always"],
      "semi-spacing": "error", 
      "no-extra-semi": "error",
      "no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      "no-undef": "error",
      // JSDoc rules
      "jsdoc/require-jsdoc": ["error", {
        "require": {
          "FunctionDeclaration": true,
          "MethodDefinition": true,
          "ClassDeclaration": true,
          "ArrowFunctionExpression": false,
          "FunctionExpression": false
        }
      }],
      "jsdoc/require-description": "error",
      "jsdoc/require-description-complete-sentence": "error",
      "jsdoc/require-param": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-param-type": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/require-returns-type": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/check-types": "error",
      "jsdoc/valid-types": "error"
    }
  },
  
  // Test files
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },
      sourceType: "commonjs"
    },
    rules: {
      "no-unused-vars": "off", // Allow unused vars in test files
      "semi": ["error", "always"],
      "semi-spacing": "error"
    }
  },

  // Settings UI files (browser environment)
  {
    files: ["settings/js/app.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jquery,
        $: "readonly"
      },
      sourceType: "script"
    },
    rules: {
      "semi": ["error", "always"],
      "semi-spacing": "error",
      "no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }]
    }
  }
];
