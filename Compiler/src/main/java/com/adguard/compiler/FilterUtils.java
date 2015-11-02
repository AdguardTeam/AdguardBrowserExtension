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

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.*;

/**
 * Helper utils to work with filters
 */
public class FilterUtils {

    private static Logger log = Logger.getLogger(FilterUtils.class);

    private final static String GROUPS_METADATA_DOWNLOAD_URL = "http://adtidy.org/get-groups.html";
    private final static String FILTERS_METADATA_DOWNLOAD_URL = "http://adtidy.org/get-filters.html";
    private final static String FILTER_DOWNLOAD_URL = "http://chrome.adtidy.org/getfilter.html?filterid=%s&key=4DDBE80A3DA94D819A00523252FB6380";

    private final static int ENGLISH_FILTER_ID = 2;
    private final static String USER_AGENT_SAFARI = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.78.2 (KHTML, like Gecko) Version/7.0.6 Safari/537.78.2";

    /**
     * Downloads filters from our backend server
     *
     * @param source Path to extension sources
     * @throws IOException
     */
    public static void updateLocalFilters(File source) throws IOException {

        File dest = new File(source, "tmp-filters");
        File filtersDir = new File(source, "filters");

        List<File> filesToCopy = new ArrayList<File>();
        try {
            for (int filterId = 1; filterId <= 10; filterId++) {

                log.debug("Start download filter " + filterId);

                String downloadUrl = String.format(FILTER_DOWNLOAD_URL, filterId);
                String response = UrlUtils.downloadString(new URL(downloadUrl), "UTF-8");

                File filterFile = new File(dest, "filter_" + filterId + ".txt");
                FileUtils.write(filterFile, response);
                filesToCopy.add(filterFile);

                log.debug("Filter " + filterId + " download successfully");
            }

            for (File file : filesToCopy) {
                FileUtils.copyFileToDirectory(file, filtersDir);
            }
        } finally {
            FileUtils.deleteDirectory(dest);
        }
    }

    /**
     * Loads english filter for safari.
     * <p/>
     * The thing is that English filter is customized in case of Safari.
     * It contains big javascript rule for youtube ad blocking.
     *
     * @param destDir Destination directory.
     * @throws IOException
     */
    public static void loadEnglishFilterForSafari(File destDir) throws IOException {
        log.info("Start download filter ENGLISH filter for safari");
        String downloadUrl = String.format(FILTER_DOWNLOAD_URL, ENGLISH_FILTER_ID);
        String response = UrlUtils.downloadString(new URL(downloadUrl), "UTF-8", USER_AGENT_SAFARI);
        FileUtils.writeStringToFile(new File(destDir, "filter_" + ENGLISH_FILTER_ID + ".txt"), response, "utf-8");
    }

    /**
     * Updates filters metadata
     *
     * @param source Extension source
     * @throws IOException
     */
    public static void updateGroupsAndFiltersMetadata(File source) throws IOException {

        File filtersDir = new File(source, "filters");
        File groupsMetadataFile = new File(filtersDir, "groups.xml");
        File filtersMetadataFile = new File(filtersDir, "filters.xml");

        log.info("Start download groups metadata");
        String response = UrlUtils.downloadString(new URL(GROUPS_METADATA_DOWNLOAD_URL), "utf-8");
        FileUtils.write(groupsMetadataFile, response);
        log.info("Write groups metadata to " + groupsMetadataFile);

        log.info("Start download filters metadata");
        response = UrlUtils.downloadString(new URL(FILTERS_METADATA_DOWNLOAD_URL), "utf-8");
        FileUtils.write(filtersMetadataFile, response);
        log.info("Write filters metadata to " + filtersMetadataFile);
    }

    /**
     * Gets javascript injection rules.
     *
     * @param source Extension source
     * @return List of rules
     * @throws IOException
     */
    public static Set<String> getScriptRules(File source) throws IOException {

        Set<String> scriptRules = new HashSet<String>();

        File filtersDir = new File(source, "filters");
        for (int filterId = 1; filterId <= 10; filterId++) {
            File filterFile = new File(filtersDir, "filter_" + filterId + ".txt");
            List<String> lines = FileUtils.readLines(filterFile);
            for (String line : lines) {
                if (line.contains("#%#")) {
                    scriptRules.add(line.trim());
                }
            }
        }

        return scriptRules;
    }
}
