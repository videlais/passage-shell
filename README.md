# Passage Shell

Passage Shell is an [Electron](https://electronjs.org/)-based testing platform for browser-based narrative games. Using [Express](https://expressjs.com/), Passage Shell can remotely "play" projects using a system of inter-process communication (IPC) channels to send information between its main and rendering processes.

## Routes

The Express framework exposes the same routes across all loaders. However, not all functionality is available for all formats.

All routes return JSON-encoded values. Return objects are based on their route names except in the case of "/click/X", which can also return an error object.

* _/_: Information about the file
* _/text_: The current text of the passage 
* _/html_: The current HTML of the passage
* _/links_: Listing of all links (or link-like) elements in story area
* _/click/X_: The numbered (starting from 0) of the entry of the link (from /links) to "click"
* _/undo_: Attempts to "undo" based on file and loader
* _/redo_: Attempts to "redo" based on file and loader
* _/error_: The latest error (if any) to occur
* _/reset_: Reloads the file (but maintains webserver)

## Formats

Passage Shell currently supports the following formats:

* Twine2 (Harlowe, SugarCube, and Snowman story formats)
* Ink for Web

## Settings

The [settings.json](settings.json) holds the three options of _port_ and _loader_. 

* _port_: Port number to start the webserver
* _loader_: The type of files to load. Loader will attempt to open the 'index.html' file of any directory matching its value

Passage Shell **will not** run without proper settings and attempts to prevent invalid values.

## License

[MIT](LICENSE.md)
