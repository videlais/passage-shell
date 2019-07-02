# Passage Shell 1.2

Passage Shell is an [Electron](https://electronjs.org/)-based testing platform for browser-based narrative games. Using [Express](https://expressjs.com/), Passage Shell can remotely "play" projects using a system of inter-process communication (IPC) channels to send information between its main and rendering processes.

## Routes

The Express framework exposes the same routes across all loaders. However, not all functionality is available for all formats.

All routes return JSON-encoded values. Return objects are based on their route names except in the case of _/click/X_ and _/mouseover/X_, which can also return an error object, and _/file_, which only returns the static file.

* _/_: Information about the file
* _/text_: The current text of the passage
* _/html_: The current HTML of the passage
* _/links_: Listing of all links (or link-like) elements in story area
* _/mouseover-links_: Listing of all the mouseover links in the story area
* _/click/X_: The numbered (starting from 0) of the entry of the link (from /links) to "click"
* _/mouseover/X_: The numbered (starting from 0) of the entry of the mouseover-link (from /mouseover-links) to "mouseover"
* _/undo_: Attempts to "undo" based on file and loader
* _/redo_: Attempts to "redo" based on file and loader
* _/error_: The latest error (if any) to occur
* _/reset_: Reloads the file (but maintains webserver)
* _/file_: The file from settings.json
* _/source_: The inner HTML of the &lt;tw-storydata&gt; element

## Formats

Passage Shell currently supports the following formats:

* Twine2 (Harlowe, SugarCube, and Snowman story formats)
* Ink for Web

## Settings

The [settings.json](settings.json) holds the options of _port_, _loader_, and _file_.

* _port_: Port number for the webserver
* _loader_: The type of files to load. Loader will attempt to open the 'index.html' file inside any directory matching its value
* _file_: The static file to serve. **Must** be an absolute path.

Passage Shell **will not** run without proper settings and attempts to prevent invalid values.

## Testing

Every other route but _/file_ communicates with the renderer process. Therefore, it is possible to work with the other routes and "play" the file served by _/file_ without interferring with each other.

## Instructions

Run ```npm install``` to prepare dependencies and then ```npm start``` to run.

Because of loading times and different formats using transitions, it is recommended to poll every 10ms or more.

## License

[MIT](LICENSE.md)
