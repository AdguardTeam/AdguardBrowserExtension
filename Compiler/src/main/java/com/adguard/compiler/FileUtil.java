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

import freemarker.cache.FileTemplateLoader;
import freemarker.template.Configuration;
import freemarker.template.Template;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

import java.io.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Helper utils to work with files
 */
public class FileUtil {

	private static final String WEBKIT_FOLDER = "browser/webkit";
	private static final String CHROME_FOLDER = "browser/chrome";
	private static final String EDGE_FOLDER = "browser/edge";
	private static final String SAFARI_FOLDER = "browser/safari";
	private static final String FIREFOX_LEGACY_FOLDER = "browser/firefox";
	private static final String FIREFOX_WEBEXT_FOLDER = "browser/firefox_webext";

	public static void copyFiles(File source, File dest, Browser browser, boolean createApi) throws Exception {

		if (dest.exists()) {
			FileUtils.deleteDirectory(dest);
		}

		switch (browser) {
			case CHROMIUM:
				copyChromiumFiles(source, dest, browser);
				break;
			case OPERA:
				copyChromiumFiles(source, dest, browser);
				break;
			case EDGE:
				copyChromiumFiles(source, dest, browser);
				copyEdgeFiles(source, dest);
				break;
			case SAFARI:
				copySafariFiles(source, dest);
				break;
			case FIREFOX_LEGACY:
				copyFirefoxFiles(source, dest, Browser.FIREFOX_LEGACY);
				break;
			case FIREFOX_WEBEXT:
				copyWebExtFiles(source, dest);
				break;
		}

		if (createApi) {
			copyApiFiles(source, dest, browser);
		}
	}

	/**
	 * Filters from different browser groups (see {@link Browser#getBrowserGroup()}) have to be stored in different directories.
	 *
	 * @param parent  Parent directory
	 * @param browser Browser
	 * @return Filter directory
	 */
	public static File getFiltersDir(File parent, Browser browser) {
		return new File(parent, "filters/" + browser.getBrowserGroup());
	}

	private static void copyCommonFiles(File source, File dest, Browser browser) throws Exception {

		//copy filters and subscriptions
		File sourceFilters = FileUtil.getFiltersDir(source, browser);
		File destFilters = new File(dest, "filters");
		copyDirectory(sourceFilters, destFilters);

		//copy locales
		File sourceLocales = new File(source, "_locales");
		File destLocales = new File(dest, "_locales");
		copyDirectory(sourceLocales, destLocales);

		//copy html pages and css styles
		File sourcePages = new File(source, "pages");
		File destPages = new File(dest, "pages");
		copyDirectory(sourcePages, destPages);

		//customize html files
		File[] htmlFiles = destPages.listFiles(new FilenameFilter() {
			public boolean accept(File dir, String name) {
				return name.endsWith(".html");
			}
		});
		if (htmlFiles != null) {
			for (File htmlFile : htmlFiles) {
				processHtmlFile(htmlFile, browser);
			}
		}

		//copy lib folder
		File sourceLib = new File(source, "lib");
		File destLib = new File(dest, "lib");
		copyDirectory(sourceLib, destLib);
	}

	private static void copyChromiumFiles(File source, File dest, Browser browser) throws Exception {

		// copy base chrome/safari code
		File chromeSafariBase = new File(source, WEBKIT_FOLDER);
		copyDirectory(chromeSafariBase, dest);

		// copy base chrome code
		File chromeBase = new File(source, CHROME_FOLDER);
		copyDirectory(chromeBase, dest);

		// copy common files
		copyCommonFiles(source, dest, browser);
	}

	private static void copyEdgeFiles(File source, File dest) throws Exception {
		// copy edge files
		File edgeBase = new File(source, EDGE_FOLDER);
		copyDirectory(edgeBase, dest);
	}

	private static void copySafariFiles(File source, File dest) throws Exception {

		//copy base chrome/safari code
		File chromeSafariBase = new File(source, WEBKIT_FOLDER);
		copyDirectory(chromeSafariBase, dest);

		//copy base safari code
		File safariBase = new File(source, SAFARI_FOLDER);
		copyDirectory(safariBase, dest);

		//copy common files
		copyCommonFiles(source, dest, Browser.SAFARI);
	}

	private static void copyWebExtFiles(File source, File dest) throws Exception {

		copyChromiumFiles(source, dest, Browser.CHROMIUM);

		File webExtBase = new File(source, FIREFOX_WEBEXT_FOLDER);
		copyDirectory(webExtBase, dest);
	}

	private static void copyFirefoxFiles(File source, File dest, Browser browser) throws Exception {

		File firefoxBase = new File(source, FIREFOX_LEGACY_FOLDER);
		copyDirectory(firefoxBase, dest);

		copyCommonFiles(source, dest, browser);

		//Fix fonts file
		File fontsFile = new File(dest, "skin/fonts.css");
		File firefoxFontsFile = new File(dest, "skin/fonts_firefox.css");
		File fontsDir = new File(dest, "skin/fonts");
		FileUtils.deleteQuietly(fontsFile);
		FileUtils.moveFile(firefoxFontsFile, fontsFile);
		FileUtils.deleteQuietly(fontsDir);

		//convert chrome style locales to firefox style
		File sourceLocalesDir = new File(dest, "_locales");
		File destLocalesDir = new File(dest, "chrome/locale");
		LocaleUtils.convertFromChromeToFirefoxLocales(sourceLocalesDir);
		//rename folder
		FileUtils.moveDirectory(sourceLocalesDir, destLocalesDir);
	}

	private static void copyDirectory(File source, File dest) throws IOException {
		FileUtils.copyDirectory(source, dest, new FileFilter() {
			public boolean accept(File pathname) {
				return !pathname.getName().startsWith(".");
			}
		});
	}

	private static void processHtmlFile(File file, Browser browser) throws Exception {

		Configuration templateConfiguration = new Configuration();

		FileTemplateLoader fileTemplateLoader = new FileTemplateLoader(file.getParentFile());
		templateConfiguration.setTemplateLoader(fileTemplateLoader);

		String result;
		Writer out = null;
		try {

			out = new StringWriter();

			Map<String, Object> params = new HashMap<String, Object>();
			params.put("browser", browser);

			Template template = templateConfiguration.getTemplate(file.getName(), "utf-8");
			template.process(params, out);

			result = out.toString();
		} finally {
			IOUtils.closeQuietly(out);
		}

		FileUtils.writeStringToFile(file, result, "utf-8");
	}

	private static void copyApiFiles(File source, File dest, Browser browser) throws IOException {

		switch (browser) {
			case CHROMIUM:
				File base = new File(source, "api/chrome");
				copyDirectory(base, dest);
				FileUtils.deleteQuietly(new File(dest, "_locales"));
				FileUtils.deleteQuietly(new File(dest, "pages"));
				FileUtils.deleteQuietly(new File(dest, "icons"));
				FileUtils.deleteQuietly(new File(dest, "devtools.html"));
				break;
			default:
				throw new UnsupportedOperationException();
		}
	}
}
