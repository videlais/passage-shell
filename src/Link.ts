export class Link {
    // The link text
    text: string;
    // The link URL
    url: string;
    // The link type
    type: string;
    // The link target
    target: string;
    // The link title
    title: string;
    // The link rel
    rel: string;

    constructor(text: string, url: string, type: string, target: string, title: string, rel: string) {
        this.text = text;
        this.url = url;
        this.type = type;
        this.target = target;
        this.title = title;
        this.rel = rel;
    }
}