/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 * <p>
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * <p>
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * <p>
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.adguard.compiler;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Helper utils to work with filters
 */
public class FilterUtils {

    private static Logger log = Logger.getLogger(FilterUtils.class);

    private static final List<Integer> DEFAULT_FILTER_IDS = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);

    /**
     * String is formatted by browser group. See {@link Browser#getBrowserGroup()}
     */
    private static final String EXTENSION_FILTERS_SERVER_URL_FORMAT = "https://filters.adtidy.org/extension/%s";

    private final static String METADATA_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + "/filters.json";
    private final static String METADATA_I18N_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + "/filters_i18n.json";

    private final static String FILTER_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + "/filters/%s.txt";
    private final static String OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + "/filters/%s_optimized.txt";

    private static final Pattern CHECKSUM_PATTERN = Pattern.compile("^\\s*!\\s*checksum[\\s\\-:]+([\\w\\+\\/=]+).*[\r\n]+", Pattern.MULTILINE | Pattern.CASE_INSENSITIVE);

    /**
     * Downloads filters from our backend server
     *
     * @param source Path to extension sources
     * @throws IOException
     */
    public static void updateLocalFilters(File source, Browser browser) throws IOException {

        File filtersDir = FileUtil.getFiltersDir(source, browser);
        File dest = new File(source, "tmp-filters");

        List<File> filesToCopy = new ArrayList<File>();
        try {
            for (int filterId : DEFAULT_FILTER_IDS) {

                File filterFile = downloadFilterFile(dest, filterId, getFilterDownloadUrl(browser, filterId, false), "filter_" + filterId + ".txt");
                filesToCopy.add(filterFile);

                File optimizedFilterFile = downloadFilterFile(dest, filterId, getFilterDownloadUrl(browser, filterId, true), "filter_mobile_" + filterId + ".txt");
                filesToCopy.add(optimizedFilterFile);
            }

            for (File file : filesToCopy) {
                FileUtils.copyFileToDirectory(file, filtersDir);
            }
        } finally {
            FileUtils.deleteDirectory(dest);
        }
    }

    /**
     * Updates filters metadata
     *
     * @param source  Extension source
     * @param browser Browser
     * @throws IOException
     */
    public static void updateGroupsAndFiltersMetadata(File source, Browser browser) throws IOException {

        File filtersDir = FileUtil.getFiltersDir(source, browser);
        File metadataFile = new File(filtersDir, "filters.json");
        File metadataI18nFile = new File(filtersDir, "filters_i18n.json");

        log.info("Start download filters metadata");
        String response = UrlUtils.downloadString(new URL(getFiltersMetadataDownloadUrl(browser, false)), "utf-8");
        FileUtils.write(metadataFile, response, "utf-8");
        log.info("Write filters metadata to " + metadataFile);

        log.info("Start download filters i18n metadata");
        response = UrlUtils.downloadString(new URL(getFiltersMetadataDownloadUrl(browser, true)), "utf-8");
        FileUtils.write(metadataI18nFile, response, "utf-8");
        log.info("Write filters i18n metadata to " + metadataI18nFile);
    }

    /**
     * Gets javascript injection rules.
     *
     * @param source  Extension source
     * @param browser Browser
     * @return List of rules
     * @throws IOException
     */
    public static Set<String> getScriptRules(File source, Browser browser) throws IOException {

        Set<String> scriptRules = new HashSet<String>();

        File filtersDir = FileUtil.getFiltersDir(source, browser);
        for (int filterId : DEFAULT_FILTER_IDS) {
            File filterFile = new File(filtersDir, "filter_" + filterId + ".txt");
            List<String> lines = FileUtils.readLines(filterFile, "utf-8");
            for (String line : lines) {
                if (line.contains("#%#")) {
                    scriptRules.add(line.trim());
                }
            }
        }

        return scriptRules;
    }

    /**
     * Download filter rules (Validate checksum and save to file)
     *
     * @param dest              Destination directory
     * @param filterId          Filter identifier
     * @param filterDownloadUrl Url
     * @param fileName          File name in destination directory
     * @return File with filter rules
     * @throws IOException
     */
    private static File downloadFilterFile(File dest, int filterId, String filterDownloadUrl, String fileName) throws IOException {

        log.debug("Start download filter " + filterId + " from " + filterDownloadUrl);

        String downloadUrl = String.format(filterDownloadUrl, filterId);
        String response = UrlUtils.downloadString(new URL(downloadUrl), "UTF-8");

        validateChecksum(downloadUrl, response);

        File filterFile = new File(dest, fileName);
        FileUtils.write(filterFile, response, "utf-8");

        log.debug("Filter " + filterId + " download successfully");
        return filterFile;
    }

    /**
     * @param browser Browser
     * @param i18n    Should we load localization metadata?
     * @return Url for downloading filters metadata or localization metadata
     */
    private static String getFiltersMetadataDownloadUrl(Browser browser, boolean i18n) {
        String urlFormat = i18n ? METADATA_I18N_DOWNLOAD_URL_FORMAT : METADATA_DOWNLOAD_URL_FORMAT;
        return String.format(urlFormat, browser.getBrowserGroup());
    }

    /**
     * @param browser   Browser
     * @param filterId  Filter identifier
     * @param optimized Should we load optimized rules?
     * @return Url for downloading filter rules
     */
    private static String getFilterDownloadUrl(Browser browser, int filterId, boolean optimized) {
        String urlFormat = optimized ? OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT : FILTER_DOWNLOAD_URL_FORMAT;
        return String.format(urlFormat, browser.getBrowserGroup(), filterId);
    }

    /**
     * Validates filter rules checksum
     * See https://adblockplus.org/en/filters#special-comments for details
     *
     * @param url      Download URL
     * @param response Filter rules response
     * @throws UnsupportedEncodingException
     */
    private static void validateChecksum(String url, String response) throws UnsupportedEncodingException {

        Matcher matcher = CHECKSUM_PATTERN.matcher(response);
        if (!matcher.find()) {
            throw new IllegalStateException(String.format("Filter rules from %s doesn't contain a checksum %s", url, response.substring(0, 200)));
        }

        String expectedChecksum = calculateChecksum(response);
        String checksum = matcher.group(1);

        if (!expectedChecksum.equals(checksum)) {
            throw new IllegalStateException(String.format("Wrong checksum: found %s, expected %s", checksum, expectedChecksum));
        }
    }

    /**
     * Calculates checksum
     *
     * @param response Filter rules response
     * @return checksum
     * @throws UnsupportedEncodingException
     */
    private static String calculateChecksum(String response) throws UnsupportedEncodingException {
        response = normalizeResponse(response);
        String checksum = Base64.encodeBase64String(DigestUtils.md5(response.getBytes("utf-8")));
        return StringUtils.stripEnd(checksum.trim(), "=");
    }

    /**
     * Normalize response
     *
     * @param response Filter rules response
     * @return Normalized response
     */
    private static String normalizeResponse(String response) {
        response = response.replaceAll("\\r", "");
        response = response.replaceAll("\\n+", "\n");
        response = CHECKSUM_PATTERN.matcher(response).replaceFirst("");
        return response;
    }
}
