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
    public final static String FILTER_DOWNLOAD_URL = "http://chrome.adtidy.org/getfilter.html?filterid=%s&key=4DDBE80A3DA94D819A00523252FB6380";
    public final static String OPTIMIZED_FILTER_DOWNLOAD_URL = "http://chrome.adtidy.org/getoptimizedfilter.html?filterid=%s&key=4DDBE80A3DA94D819A00523252FB6380";

    /**
     * Downloads filters from our backend server
     *
     * @param source Path to extension sources
     * @param filtersDir
     * @throws IOException
     */
    public static void updateLocalFilters(File source, File filtersDir) throws IOException {

        File dest = new File(source, "tmp-filters");

        List<File> filesToCopy = new ArrayList<File>();
        try {
            for (int filterId = 1; filterId <= 12; filterId++) {

                if (filterId == 11) {
                    continue;
                }

                File filterFile = downloadFilterFile(dest, filterId, FilterUtils.FILTER_DOWNLOAD_URL, "filter_" + filterId + ".txt");
                filesToCopy.add(filterFile);

                File optimizedFilterFile = downloadFilterFile(dest, filterId, FilterUtils.OPTIMIZED_FILTER_DOWNLOAD_URL, "filter_mobile_" + filterId + ".txt");
                filesToCopy.add(optimizedFilterFile);
            }

            for (File file : filesToCopy) {
                FileUtils.copyFileToDirectory(file, filtersDir);
            }
        } finally {
            FileUtils.deleteDirectory(dest);
        }
    }

    private static File downloadFilterFile(File dest, int filterId, String filterDownloadUrl, String fileName) throws IOException {
        log.debug("Start download filter " + filterId + " from " + filterDownloadUrl);

        String downloadUrl = String.format(filterDownloadUrl, filterId);
        String response = UrlUtils.downloadString(new URL(downloadUrl), "UTF-8");

        File filterFile = new File(dest, fileName);
        FileUtils.write(filterFile, response);

        log.debug("Filter " + filterId + " download successfully");
        return filterFile;
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
