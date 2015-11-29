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
	private static final String SAFARI_FOLDER = "browser/safari";
	private static final String FIREFOX_FOLDER = "browser/firefox";
	private static final String FIREFOX_LEGACY_FOLDER = "browser/firefox_legacy";

	public static void copyFiles(File source, File dest, Browser browser) throws Exception {

		if (dest.exists()) {
			FileUtils.deleteDirectory(dest);
		}

		switch (browser) {
			case CHROMIUM:
				copyChromiumFiles(source, dest);
				break;
			case SAFARI:
				copySafariFiles(source, dest);
				break;
			case FIREFOX:
				copyFirefoxFiles(source, dest, Browser.FIREFOX);
				break;
			case FIREFOX_LEGACY:
				copyFirefoxLegacyFiles(source, dest);
				break;
		}
	}

	private static void copyCommonFiles(File source, File dest, Browser browser) throws Exception {

		//copy filters and subscriptions
		File sourceFilters = new File(source, "filters");
		File destFilters = new File(dest, "filters");
		copyDirectory(sourceFilters, destFilters);

		//copy optimized filters and subscriptions
		File sourceOptimizedFilters = new File(source, "filters_mobile");
		File destOptimizedFilters = new File(dest, "filters_mobile");
		copyDirectory(sourceOptimizedFilters, destOptimizedFilters);

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

	private static void copyChromiumFiles(File source, File dest) throws Exception {

		//copy base chrome/safari code
		File chromeSafariBase = new File(source, WEBKIT_FOLDER);
		copyDirectory(chromeSafariBase, dest);

		//copy base chrome code
		File chromeBase = new File(source, CHROME_FOLDER);
		copyDirectory(chromeBase, dest);

		//copy common files
		copyCommonFiles(source, dest, Browser.CHROMIUM);
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

	private static void copyFirefoxFiles(File source, File dest, Browser browser) throws Exception {

		File firefoxBase = new File(source, FIREFOX_FOLDER);
		copyDirectory(firefoxBase, dest);

		copyCommonFiles(source, dest, browser);

		//move processed html pages to data/content folder
		File sourcePagesDir = new File(dest, "pages");
		File destPagesDir = new File(dest, "data/content");
		copyDirectory(sourcePagesDir, destPagesDir);
		FileUtils.deleteQuietly(sourcePagesDir);

		//Fix fonts file
		File fontsFile = new File(destPagesDir, "/skin/fonts.css");
		File firefoxFontsFile = new File(destPagesDir, "/skin/fonts_firefox.css");
		File fontsDir = new File(destPagesDir, "/skin/fonts");
		FileUtils.deleteQuietly(fontsFile);
		FileUtils.moveFile(firefoxFontsFile, fontsFile);
		FileUtils.deleteQuietly(fontsDir);

		//move js pages files to data/content/pages folder
		File sourceJsPagesDir = new File(dest, "lib/pages");
		File destJsPagesDir = new File(dest, "data/content/pages");
		FileUtils.moveDirectory(sourceJsPagesDir, destJsPagesDir);

		//move lib/content-script folder to data/content/content-script folder
		File sourceContentScript = new File(dest, "lib/content-script");
		File destContentScript = new File(dest, "data/content/content-script");
		copyDirectory(sourceContentScript, destContentScript);
		FileUtils.deleteQuietly(sourceContentScript);

		//move third-party js files to data/content folder
		File sourceLibsDir = new File(dest, "lib/libs");
		File destLibsDir = new File(dest, "data/content/libs");
		FileUtils.moveDirectory(sourceLibsDir, destLibsDir);
		//TODO: optimize
		//Remove deferred.min.js file, cause use only in chrome and safari extension
		FileUtils.deleteQuietly(new File(destLibsDir, "deferred.min.js"));

		//convert chrome style locales to firefox style
		File sourceLocalesDir = new File(dest, "_locales");
		File destLocalesDir = new File(dest, "locale");
		LocaleUtils.convertFromChromeToFirefoxLocales(sourceLocalesDir);
		//rename folder
		FileUtils.moveDirectory(sourceLocalesDir, destLocalesDir);

		//move filters folder to data folder
		File sourceFiltersDire = new File(dest, "filters");
		File destFiltersDir = new File(dest, "data/filters");
		FileUtils.moveDirectory(sourceFiltersDire, destFiltersDir);
	}

	private static void copyFirefoxLegacyFiles(File source, File dest) throws Exception {

		copyFirefoxFiles(source, dest, Browser.FIREFOX_LEGACY);

		//copy all files to dest folder
		File firefoxLegacyBase = new File(source, FIREFOX_LEGACY_FOLDER);
		copyDirectory(firefoxLegacyBase, dest);
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

		FileUtils.writeStringToFile(file, result);
	}
}
