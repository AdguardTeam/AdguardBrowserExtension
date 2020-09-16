import * as TSUrlFilter from '@adguard/tsurlfilter';

/**
 * Request types enumeration
 */
export const RequestTypes = {
    /**
     * Document that is loaded for a top-level frame
     */
    DOCUMENT: 'DOCUMENT',

    /**
     * Document that is loaded for an embedded frame (iframe)
     */
    SUBDOCUMENT: 'SUBDOCUMENT',

    SCRIPT: 'SCRIPT',
    STYLESHEET: 'STYLESHEET',
    OBJECT: 'OBJECT',
    IMAGE: 'IMAGE',
    XMLHTTPREQUEST: 'XMLHTTPREQUEST',
    MEDIA: 'MEDIA',
    FONT: 'FONT',
    WEBSOCKET: 'WEBSOCKET',
    WEBRTC: 'WEBRTC',
    OTHER: 'OTHER',
    CSP: 'CSP',
    COOKIE: 'COOKIE',
    PING: 'PING',

    /**
     * Transforms to TSUrlFilter.RequestType
     *
     * @param requestType
     * @return {number}
     */
    transformRequestType(requestType) {
        const contentTypes = RequestTypes;

        switch (requestType) {
            case contentTypes.DOCUMENT:
                return TSUrlFilter.RequestType.Document;
            case contentTypes.SUBDOCUMENT:
                return TSUrlFilter.RequestType.Subdocument;
            case contentTypes.STYLESHEET:
                return TSUrlFilter.RequestType.Stylesheet;
            case contentTypes.FONT:
                return TSUrlFilter.RequestType.Font;
            case contentTypes.IMAGE:
                return TSUrlFilter.RequestType.Image;
            case contentTypes.MEDIA:
                return TSUrlFilter.RequestType.Media;
            case contentTypes.SCRIPT:
                return TSUrlFilter.RequestType.Script;
            case contentTypes.XMLHTTPREQUEST:
                return TSUrlFilter.RequestType.XmlHttpRequest;
            case contentTypes.WEBSOCKET:
                return TSUrlFilter.RequestType.Websocket;
            case contentTypes.PING:
                return TSUrlFilter.RequestType.Ping;
            default:
                return TSUrlFilter.RequestType.Other;
        }
    },
};

/**
 * Parse content type from path
 * @param path Path
 * @returns {*} content type (RequestTypes.*) or null
 */
export function parseContentTypeFromUrlPath(path) {
    const objectContentTypes = '.jar.swf.';
    const mediaContentTypes = '.mp4.flv.avi.m3u.webm.mpeg.3gp.3gpp.3g2.3gpp2.ogg.mov.qt.';
    const fontContentTypes = '.ttf.otf.woff.woff2.eot.';
    const imageContentTypes = '.ico.png.gif.jpg.jpeg.webp.';

    let ext = path.slice(-6);
    const pos = ext.lastIndexOf('.');

    // Unable to parse extension from url
    if (pos === -1) {
        return null;
    }

    ext = `${ext.slice(pos)}.`;
    if (objectContentTypes.indexOf(ext) !== -1) {
        return RequestTypes.OBJECT;
    }
    if (mediaContentTypes.indexOf(ext) !== -1) {
        return RequestTypes.MEDIA;
    }
    if (fontContentTypes.indexOf(ext) !== -1) {
        return RequestTypes.FONT;
    }
    if (imageContentTypes.indexOf(ext) !== -1) {
        return RequestTypes.IMAGE;
    }

    return null;
}
