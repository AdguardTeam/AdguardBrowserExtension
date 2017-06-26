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

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;

import javax.net.ssl.*;
import java.io.File;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;

public class Main {

    private static Logger log = Logger.getLogger(Main.class);

    private static final String CRX_MAKE_PATH = "../scripts/chrome/crxmake.sh";
    private static final String ZIP_MAKE_PATH = "../scripts/chrome/zipmake.sh";
    private static final String XPI_MAKE_PATH = "../scripts/firefox/xpimake.sh";
    private static final String EXTZ_MAKE_PATH = "../scripts/safari/extzmake.sh";
    private static final File CRX_CERT_FILE = new File("../../extensions/AdguardBrowserExtension/certificate.pem");
    private static final File SAFARI_CERTS_DIR = new File("../../extensions/AdguardBrowserExtension/safari_certs");

    private static final String PACK_METHOD_ZIP = "zip";
    private static final String PACK_METHOD_CRX = "crx";
    private static final String PACK_METHOD_XPI = "xpi";
    private static final String PACK_METHOD_EXTZ = "extz"; // Safari

    /**
     * Script for building extension
     *
     * @param args Arguments
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {

        disableSslValidation();

        String sourcePath = getParamValue(args, "--source", "../../Extension");
        String destPath = getParamValue(args, "--dest", "../../Build");

        //final build name
        String buildName = getParamValue(args, "--name", null);

        //version
        String version = getParamValue(args, "--version", null);

        //build branch
        Branch branch = Branch.fromName(getParamValue(args, "--branch", null));

        //browser
        String configBrowser = getParamValue(args, "--browser", null);
        Browser browser = Browser.getByName(configBrowser);

        //download filters before build
        boolean updateFilters = Boolean.valueOf(getParamValue(args, "--update-filters", "false"));

        //update url for extension
        String updateUrl = getParamValue(args, "--update-url", null);

        //safari extension id
        String extensionId = getParamValue(args, "--extensionId", null);

        //create api
        boolean createApi = Boolean.valueOf(getParamValue(args, "--create-api", "false"));

        //pack method
        String packMethod = getParamValue(args, "--pack", null);

        // allow remote js rules
        boolean allowRemoteScripts = Boolean.valueOf(getParamValue(args, "--remote-scripts", "true"));

        validateParameters(sourcePath, version, extensionId, configBrowser, packMethod);

        File source = new File(sourcePath);

        buildName = getBuildName(buildName, browser, version, branch, allowRemoteScripts);
        File dest = new File(destPath, buildName);

        if (updateFilters) {
            FilterUtils.updateGroupsAndFiltersMetadata(source, browser);
            FilterUtils.updateLocalFilters(source, browser);
            FilterUtils.updateLocalScriptRules(source, browser);
        }

        File buildResult = createBuild(source, dest, extensionId, updateUrl, browser, version, branch, createApi, allowRemoteScripts);

        File packedFile = null;
        if (packMethod != null) {
            if (PACK_METHOD_ZIP.equals(packMethod)) {
                packedFile = PackageUtils.createZip(ZIP_MAKE_PATH, buildResult);
                FileUtils.deleteQuietly(buildResult);
            } else if (PACK_METHOD_CRX.equals(packMethod)) {
                packedFile = PackageUtils.createCrx(CRX_MAKE_PATH, buildResult, CRX_CERT_FILE);
                FileUtils.deleteQuietly(buildResult);
            } else if (PACK_METHOD_XPI.equals(packMethod)) {
                packedFile = PackageUtils.createXpi(XPI_MAKE_PATH, buildResult);
                FileUtils.deleteQuietly(buildResult);
            } else if (PACK_METHOD_EXTZ.equals(packMethod)) {
                packedFile = PackageUtils.createExtz(EXTZ_MAKE_PATH, buildResult, SAFARI_CERTS_DIR);
                FileUtils.deleteQuietly(buildResult);
            }
        }

        log.info("Build created. Version: " + version);
        if (packedFile != null) {
            log.info("File: " + packedFile.getName());
        } else {
            log.info("File: " + buildResult.getName());
        }
        if (extensionId != null) {
            log.info("ExtensionId: " + extensionId);
        }
        log.info("Browser: " + browser);
        if (updateUrl != null) {
            log.info("UpdateUrl: " + updateUrl);
        }
    }

    private static void validateParameters(String sourcePath, String version, String extensionId, String configBrowser, String packMethod) {

        if (version == null) {
            throw new IllegalArgumentException("Version is required");
        }

        Browser browser = Browser.getByName(configBrowser);
        if (browser == null) {
            throw new IllegalArgumentException("Unknown browser: " + configBrowser);
        }

        if (!validatePackMethod(browser, packMethod)) {
            throw new IllegalArgumentException();
        }

        File source = new File(sourcePath);
        if (!source.exists()) {
            throw new IllegalArgumentException("Source path '" + source.getAbsolutePath() + "' not found");
        }

        if (extensionId == null && browser == Browser.SAFARI) {
            throw new IllegalArgumentException("Set --extensionId for Safari build");
        }

        if (extensionId == null && (browser == Browser.FIREFOX_LEGACY || browser == Browser.FIREFOX_WEBEXT)) {
            throw new IllegalArgumentException("Set --extensionId for Firefox build");
        }
    }

    /**
     * Builds extension
     *
     * @param source             Source path
     * @param dest               Destination folder
     *                           from remote server.
     * @param extensionId        Extension identifier (Use for safari)
     * @param updateUrl          Add to manifest update url.
     *                           Otherwise - do not add it.
     *                           All extension stores have their own update channels so
     *                           we shouldn't add update channel to the manifest.
     * @param browser            Browser type
     * @param version            Build version
     * @param branch             Build branch
     * @param createApi          If true creates simple api addon
     * @param allowRemoteScripts If true remote js rules are allowed
     * @return Path to build result
     * @throws Exception
     */
    private static File createBuild(File source, File dest,
                                    String extensionId, String updateUrl, Browser browser, String version, Branch branch, boolean createApi, boolean allowRemoteScripts) throws Exception {

        if (dest.exists()) {
            log.debug("Removed previous build: " + dest.getName());
            FileUtils.deleteQuietly(dest);
        }

        FileUtil.copyFiles(source, dest, browser, createApi);

        String extensionNamePostfix = "";
        switch (browser) {
            case FIREFOX_LEGACY:
                if (branch == Branch.BETA) {
                    extensionNamePostfix = " (Legacy)";
                } else if (branch == Branch.DEV) {
                    extensionNamePostfix = " (Legacy Dev)";
                }
                break;
            case FIREFOX_WEBEXT:
                if (allowRemoteScripts) {
                    if (branch == Branch.BETA) {
                        extensionNamePostfix = " (Standalone)";
                    } else if (branch == Branch.DEV) {
                        extensionNamePostfix = " (Standalone Dev)";
                    }
                } else {
                    if (branch == Branch.BETA) {
                        extensionNamePostfix = " (Beta)";
                    } else if (branch == Branch.DEV) {
                        extensionNamePostfix = " (AMO Dev)";
                    }
                }
                break;
            default:
                if (branch != Branch.RELEASE) {
                    extensionNamePostfix = " (" + StringUtils.capitalize(branch.getName()) + ")";
                }
                break;
        }

        SettingUtils.updateManifestFile(dest, browser, version, extensionId, updateUrl, extensionNamePostfix);

        if ((browser == Browser.CHROMIUM || browser == Browser.OPERA) && !createApi) {
            LocaleUtils.updateExtensionNameForChromeLocales(dest, extensionNamePostfix);
        }

        if (browser == Browser.FIREFOX_LEGACY) {
            LocaleUtils.writeLocalesToFirefoxInstallRdf(source, dest, extensionNamePostfix);
            LocaleUtils.writeLocalesToChromeManifest(dest);
            if (allowRemoteScripts) {
                //TODO: This is the temp fix to avoid long time AMO review
                //Should be removed after merge with
                //https://github.com/AdguardTeam/AdguardBrowserExtension/pull/421
                SettingUtils.updatePreloadRemoteScriptRules(dest);
            }
        }

        if (browser == Browser.FIREFOX_WEBEXT) {
            File webExtensionDest = new File(dest, "webextension");
            // Update name and short_name in messages.json
            LocaleUtils.updateExtensionNameForChromeLocales(webExtensionDest, extensionNamePostfix);
            // Write localized strings to install.rdf
            LocaleUtils.writeLocalesToFirefoxInstallRdf(source, dest, extensionNamePostfix);
            if (allowRemoteScripts) {
                // Remote scripts issue
                SettingUtils.updatePreloadRemoteScriptRules(webExtensionDest);
            }
        }

        if (createApi) {
            SettingUtils.createApiBuild(dest, browser);
        }

        return dest;
    }

    private static boolean validatePackMethod(Browser browser, String packMethod) {
        if (packMethod == null) {
            return true;
        }
        switch (browser) {
            case CHROMIUM:
            case OPERA:
                if (!PACK_METHOD_CRX.equals(packMethod) && !PACK_METHOD_ZIP.equals(packMethod)) {
                    log.error("Chrome support only crx and zip pack methods");
                    return false;
                }
                if (PACK_METHOD_CRX.equals(packMethod) && !CRX_CERT_FILE.exists()) {
                    log.error("Chrome cert file " + CRX_CERT_FILE + " not found");
                    return false;
                }
                return true;
            case SAFARI:
                if (!PACK_METHOD_EXTZ.equals(packMethod)) {
                    log.error("Safari supports only extz pack method");
                    return false;
                }
                return true;
            case FIREFOX_LEGACY:
            case FIREFOX_WEBEXT:
                if (!PACK_METHOD_XPI.equals(packMethod) && !PACK_METHOD_ZIP.equals(packMethod)) {
                    log.error("Firefox support only xpi/zip pack methods");
                    return false;
                }
                return true;
        }
        return true;
    }

    private static String getBuildName(String buildName, Browser browser, String version, Branch branch, boolean allowRemoteScripts) {
        if (buildName == null) {
            switch (browser) {
                case CHROMIUM:
                    buildName = "chrome";
                    break;
                case OPERA:
                    buildName = "opera";
                    break;
                case EDGE:
                    buildName = "edge";
                    break;
                case SAFARI:
                    buildName = "safari";
                    break;
                case FIREFOX_LEGACY:
                    buildName = "firefox-legacy";
                    break;
                case FIREFOX_WEBEXT:
                    if (allowRemoteScripts) {
                        buildName = "firefox-standalone";
                    } else {
                        buildName = "firefox-amo";
                    }
                    break;
            }
        }
        if (branch != Branch.DEV) {
            buildName += "-" + branch.getName().toLowerCase();
        }

        String result = buildName + "-" + version;

        if ((browser == Browser.FIREFOX_WEBEXT || browser == Browser.FIREFOX_LEGACY) && branch != Branch.DEV) {
            result += "-unsigned";
        }

        if (browser == Browser.SAFARI) {
            result += ".safariextension";
        }
        return result;
    }

    private static String getParamValue(String[] args, String paramName, String defaultValue) {
        if (args == null) {
            return defaultValue;
        }
        for (String arg : args) {
            if (arg.startsWith(paramName)) {
                return arg.replaceFirst(paramName + "=", "");
            }
        }

        return defaultValue;
    }

    /**
     * Disable SSL validation (it may work wrong sometimes)
     *
     * @throws NoSuchAlgorithmException
     * @throws KeyManagementException
     */
    private static void disableSslValidation() throws NoSuchAlgorithmException, KeyManagementException {
        // Create a trust manager that does not validate certificate chains
        TrustManager[] trustAllCerts = new TrustManager[]{new X509TrustManager() {
            public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                return null;
            }

            public void checkClientTrusted(X509Certificate[] certs, String authType) {
            }

            public void checkServerTrusted(X509Certificate[] certs, String authType) {
            }
        }
        };

        // Install the all-trusting trust manager
        SSLContext sc = SSLContext.getInstance("SSL");
        sc.init(null, trustAllCerts, new java.security.SecureRandom());
        HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

        // Create all-trusting host name verifier
        HostnameVerifier allHostsValid = new HostnameVerifier() {
            public boolean verify(String hostname, SSLSession session) {
                return true;
            }
        };

        // Install the all-trusting host verifier
        HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);
    }
}
