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

  // Web server files (allow concise internal helpers)
  {
    files: ["src/web/**/*.js"],
    plugins: {
      jsdoc
    },
    languageOptions: {
      globals: {
        ...globals.node
      },
      ecmaVersion: 2022,
      sourceType: "module"
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
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-description-complete-sentence": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/check-param-names": "off",
      "jsdoc/check-types": "off",
      "jsdoc/valid-types": "off"
    }
  },
  
  // Source files (ES modules)
  {
    files: ["src/**/*.js", "cli.js"],
    plugins: {
      jsdoc
    },
    languageOptions: {
      globals: {
        ...globals.node
      },
      ecmaVersion: 2022,
      sourceType: "module"
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
      "no-case-declarations": "off", // Allow const/let in case blocks
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

  // Web server files override (must come after main src rules)
  {
    files: ["src/web/**/*.js"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-description-complete-sentence": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/check-param-names": "off",
      "jsdoc/check-types": "off",
      "jsdoc/valid-types": "off"
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
      ecmaVersion: 2022,
      sourceType: "module"
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
