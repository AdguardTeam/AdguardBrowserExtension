/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.adguard.compiler;

import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Helper utils for downloading files
 */
public class UrlUtils {

    public static String downloadString(URL url, String encoding) throws IOException {

        HttpURLConnection connection = null;
        InputStream inputStream = null;

        try {
            connection = (HttpURLConnection) url.openConnection();
            connection.connect();
            inputStream = connection.getInputStream();
            return IOUtils.toString(inputStream, encoding);
        } finally {
            IOUtils.closeQuietly(inputStream);
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    public static String downloadString(URL url, String encoding, String userAgent) throws IOException {

        HttpURLConnection connection = null;
        InputStream inputStream = null;

        try {
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestProperty("User-Agent", userAgent);
            connection.connect();
            inputStream = connection.getInputStream();
            return IOUtils.toString(inputStream, encoding);
        } finally {
            IOUtils.closeQuietly(inputStream);
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}
