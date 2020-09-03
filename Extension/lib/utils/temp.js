// TODO extracted here to resolve cycle dependency error
//  find better place for this function
import { RequestTypes } from './common';

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
