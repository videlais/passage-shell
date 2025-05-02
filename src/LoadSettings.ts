import { existsSync, PathLike, readFileSync } from "node:fs";
import { Settings } from "./Settings";

export function loadSettings(filePath:PathLike = ""):Settings {

    // Default settings
    let settings:Settings = {
        port: 3000,
        file: "./index.html",
    };

    // Sanity check
    // Does the settings.json exist?
    if(existsSync(filePath) ) {

        // Load the settings.json file
        let contents = readFileSync(filePath, 'utf8');

        // Check for JSON parsing errors
        let wasError = false;

        try {

            // File exists, try to parse it
            settings = JSON.parse(contents);

        } catch (event) {

            // File was malformed or some other error occurred
            wasError = true;
            console.log("Malformed JSON!");

        }

        // There weren't any JSON parsing errors
        if(wasError == false) {

        // Test if 'port' is a number
        if(Number.isNaN(settings.port)) {

            // For whatever reason, the value of 'port' is not a number
            settings.port = null;

        }
    }

  } 

}