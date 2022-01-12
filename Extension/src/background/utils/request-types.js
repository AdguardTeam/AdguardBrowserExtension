import { RequestType } from '@adguard/tsurlfilter/dist/es/request-type';

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
    CSP_REPORT: 'CSP_REPORT',

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
                return RequestType.Document;
            case contentTypes.SUBDOCUMENT:
                return RequestType.Subdocument;
            case contentTypes.STYLESHEET:
                return RequestType.Stylesheet;
            case contentTypes.FONT:
                return RequestType.Font;
            case contentTypes.IMAGE:
                return RequestType.Image;
            case contentTypes.MEDIA:
                return RequestType.Media;
            case contentTypes.SCRIPT:
                return RequestType.Script;
            case contentTypes.XMLHTTPREQUEST:
                return RequestType.XmlHttpRequest;
            case contentTypes.WEBSOCKET:
                return RequestType.Websocket;
            case contentTypes.WEBRTC:
                return RequestType.Webrtc;
            case contentTypes.PING:
                return RequestType.Ping;
            default:
                return RequestType.Other;
        }
    },

    /**
     * Transforms from TSUrlFilter.RequestType
     *
     * @param requestType
     * @return {string}
     */
    transformRequestTypeFromTs(requestType) {
        const contentTypes = RequestTypes;

        switch (requestType) {
            case RequestType.Document:
                return contentTypes.DOCUMENT;
            case RequestType.Subdocument:
                return contentTypes.SUBDOCUMENT;
            case RequestType.Stylesheet:
                return contentTypes.STYLESHEET;
            case RequestType.Font:
                return contentTypes.FONT;
            case RequestType.Image:
                return contentTypes.IMAGE;
            case RequestType.Media:
                return contentTypes.MEDIA;
            case RequestType.Script:
                return contentTypes.SCRIPT;
            case RequestType.XmlHttpRequest:
                return contentTypes.XMLHTTPREQUEST;
            case RequestType.Websocket:
                return contentTypes.WEBSOCKET;
            case RequestType.Ping:
                return contentTypes.PING;
            default:
                return contentTypes.OTHER;
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
