/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 * <p/>
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * <p/>
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * <p/>
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
import java.util.Set;

public class Main {

	private static Logger log = Logger.getLogger(Main.class);

	private static final String CRX_MAKE_PATH = "../scripts/chrome/crxmake.sh";
	private static final String ZIP_MAKE_PATH = "../scripts/chrome/zipmake.sh";
	private static final String XPI_MAKE_PATH = "../scripts/firefox/xpimake.sh";
	private static final File CHROME_CERT_FILE = new File("../certificate.pem");

	private static final String PACK_METHOD_ZIP = "zip";
	private static final String PACK_METHOD_CRX = "crx";
	private static final String PACK_METHOD_XPI = "xpi";

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
		String branch = getParamValue(args, "--branch", null);

		//browser
		String configBrowser = getParamValue(args, "--browser", null);
		Browser browser = Browser.getByName(configBrowser);

		//download filters before build
		boolean updateFilters = Boolean.valueOf(getParamValue(args, "--update-filters", "false"));

		//update url for extension
		String updateUrl = getParamValue(args, "--update-url", null);

		//safari extension id
		String extensionId = getParamValue(args, "--extensionId", null);

		//pack method
		String packMethod = getParamValue(args, "--pack", null);

		if (!validateParameters(sourcePath, buildName, version, extensionId, configBrowser, packMethod)) {
			System.exit(-1);
		}

		File source = new File(sourcePath);

		buildName = getBuildName(buildName, browser, version);
		File dest = new File(destPath, buildName);

		if (updateFilters) {
			FilterUtils.updateGroupsAndFiltersMetadata(source);
			FilterUtils.updateLocalFilters(source);
		}

		Set<String> scriptRules = FilterUtils.getScriptRules(source);

		File buildResult = createBuild(source, dest, scriptRules, extensionId, updateUrl, browser, version, branch);

		if (browser == Browser.SAFARI && updateFilters) {
			FilterUtils.loadEnglishFilterForSafari(new File(buildResult, "filters"));
		}

		File packedFile = null;
		if (packMethod != null) {
			if (PACK_METHOD_ZIP.equals(packMethod)) {
				packedFile = PackageUtils.createZip(ZIP_MAKE_PATH, buildResult);
				FileUtils.deleteQuietly(buildResult);
			} else if (PACK_METHOD_CRX.equals(packMethod)) {
				packedFile = PackageUtils.createCrx(CRX_MAKE_PATH, buildResult, CHROME_CERT_FILE);
				FileUtils.deleteQuietly(buildResult);
			} else if (PACK_METHOD_XPI.equals(packMethod)) {
				packedFile = PackageUtils.createXpi(XPI_MAKE_PATH, buildResult, "adguard-adblocker");
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

	private static boolean validateParameters(String sourcePath, String buildName, String version, String extensionId, String configBrowser, String packMethod) {

		if (buildName == null) {
			log.error("Name is required");
			return false;
		}

		if (version == null) {
			log.error("Version is required");
			return false;
		}

		Browser browser = Browser.getByName(configBrowser);
		if (browser == null) {
			log.error("Unknown browser: " + configBrowser);
			return false;
		}

		if (!validatePackMethod(browser, packMethod)) {
			return false;
		}

		File source = new File(sourcePath);
		if (!source.exists()) {
			log.error("Source path '" + source.getAbsolutePath() + "' not found");
			return false;
		}

		if (extensionId == null && browser == Browser.SAFARI) {
			log.error("Set --extensionId for Safari build");
			return false;
		}

		if (extensionId == null && (browser == Browser.FIREFOX || browser == Browser.FIREFOX_LEGACY)) {
			log.error("Set --extensionId for Safari build");
			return false;
		}

		return true;
	}

	/**
	 * Builds extension
	 *
	 * @param source             Source path
	 * @param dest               Destination folder
	 * @param scriptRules List of javascript injection rules.
	 *                           For AMO and addons.opera.com we embed all
	 *                           js rules into the extension and do not update them
	 *                           from remote server.
	 * @param extensionId        Extension identifier (Use for safari)
	 * @param updateUrl          Add to manifest update url.
	 *                           Otherwise - do not add it.
	 *                           All extension stores have their own update channels so
	 *                           we shouldn't add update channel to the manifest.
	 * @param browser            Browser type
	 * @param version            Build version
	 * @param branch             Build branch
	 * @return Path to build result
	 * @throws Exception
	 */
	private static File createBuild(File source, File dest,
									Set<String> scriptRules,
									String extensionId, String updateUrl, Browser browser, String version, String branch) throws Exception {

		if (dest.exists()) {
			log.debug("Removed previous build: " + dest.getName());
			FileUtils.deleteQuietly(dest);
		}

		FileUtil.copyFiles(source, dest, browser);

		SettingUtils.writeLocalScriptRulesToFile(dest, scriptRules);

		String extensionNamePostfix = "";
		if (StringUtils.isNotEmpty(branch)) {
			extensionNamePostfix = " (" + StringUtils.capitalize(branch) + ")";
		}

		SettingUtils.updateManifestFile(dest, browser, version, extensionId, updateUrl, extensionNamePostfix);

		if (browser == Browser.CHROMIUM) {
			LocaleUtils.updateExtensionNameForChromeLocales(dest, extensionNamePostfix);
		}

		if (browser == Browser.FIREFOX || browser == Browser.FIREFOX_LEGACY) {
			LocaleUtils.writeLocalesToFirefoxInstallRdf(dest, extensionNamePostfix);
		}

		return dest;
	}

	private static boolean validatePackMethod(Browser browser, String packMethod) {
		if (packMethod == null) {
			return true;
		}
		switch (browser) {
			case CHROMIUM:
				if (!PACK_METHOD_CRX.equals(packMethod) && !PACK_METHOD_ZIP.equals(packMethod)) {
					log.error("Chrome support only crx and zip pack methods");
					return false;
				}
				if (PACK_METHOD_CRX.equals(packMethod) && !CHROME_CERT_FILE.exists()) {
					log.error("Chrome cert file " + CHROME_CERT_FILE + " not found");
					return false;
				}
				return true;
			case SAFARI:
				log.error("Safari doesn't support pack methods. Pack extension manually.");
				return false;
			case FIREFOX:
			case FIREFOX_LEGACY:
				if (!PACK_METHOD_XPI.equals(packMethod)) {
					log.error("Firefox support only xpi pack methods");
					return false;
				}
				return true;
		}
		return true;
	}

	private static String getBuildName(String buildName, Browser browser, String version) {
		String result = buildName + "-" + version;
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
