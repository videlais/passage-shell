# Passage Shell 2.0

Passage Shell is an [Electron](https://electronjs.org/) platform for agent-based remote play of Twine 2 files. It uses [Express](https://expressjs.com/) internally to serve different URL routes to return JSON results.

Because of loading times and differences between story formats using transitions, it is recommend to poll routes every 10ms or more.

## Framework

All routes at exposed at all times. However, not all functionality is available depending on the story format in use.

All routes return JSON-encoded values. Return objects have an internal property based on their route names except in the case of _/click/X_ and _/mouseover/X_, which can also return an error object; _/_, which returns the attributes of the `<tw-storydata>` element; and _/file_, which only returns the static file.

### Examples

From the _/_ route:

```
{"creator":"Twine","creatorVersion":"2.3.3","format":"Snowman","formatVerison":"1.3.0","name":"Example"}
```

From the _/links_ route:

```
{"links":[{"element":{},"tagName":"A","text":"Continue"}]}
```

### Routes

* _/_: Information about the file
* _/text_: The current text of the passage
* _/html_: The current HTML of the passage
* _/links_: Listing of all links (or link-like) elements in story area
  * `element`: name of the element, if available
  * `tagName`: name of the HTML tag used, if available
  * `text`: text of the link, if available  
* _/mouseover-links_: Listing of all the mouseover links in the story area
  * `element`: name of the element, if available
  * `tagName`: name of the HTML tag used, if available
  * `text`: text of the link, if available
* _/click/X_: The numbered (starting from 0) of the entry of the link (from /links) to "click"
* _/mouseover/X_: The numbered (starting from 0) of the entry of the mouseover-link (from /mouseover-links) to "mouseover"
* _/undo_: Attempts to "undo" based on file and loader
* _/redo_: Attempts to "redo" based on file and loader
* _/error_: The latest error (if any) to occur
* _/reset_: Reloads the file (but maintains webserver)
* _/file_: HTML file
* _/source_: The inner HTML of the `<tw-storydata>` element

## Story Formats

Passage Shell currently supports the following story formats and versions:

* Harlowe (v1.2.4+, v2.1.0+, v3.0.2+)
* SugarCube (v1.0.35+, v2.28.2+)
* Snowman (v1.3+, v2.0+)

## Testing

Every other route but _/file_ communicates with the renderer process. Therefore, it is possible to work with the other routes and "play" the file served by _/file_ without interfering with each other.

## Build Instructions

* Prepare Dependencies: `npm install`
* Run: `npm start`
* Build: `npm run build`

## License

[MIT](LICENSE.md)
