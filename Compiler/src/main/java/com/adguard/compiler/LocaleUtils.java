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
import org.codehaus.jackson.map.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.Map;

/**
 * Helper class for working with locales
 */
public class LocaleUtils {

	public enum SupportedLocales {

		EN("en"), RU("ru"), DE("de"), TR("tr"), UK("uk"), PL("pl"), PT_BR("pt_BR"), PT_PT("pt_PT"), KO("ko"), zh_CN("zh_CN");

		private String code;

		SupportedLocales(String code) {
			this.code = code;
		}

		public static boolean supported(String code) {
			for (SupportedLocales locale : values()) {
				if (locale.code.equalsIgnoreCase(code)) {
					return true;
				}
			}
			return false;
		}
	}

	private static ObjectMapper objectMapper = new ObjectMapper();

	public static void convertFromChromeToFirefoxLocales(File chromeLocalesDir) throws IOException {

		for (File file : chromeLocalesDir.listFiles()) {

			File chromeLocaleFile = new File(file, "messages.json");
			if (!SupportedLocales.supported(file.getName())) {
				FileUtils.deleteQuietly(file);
				continue;
			}

			String firefoxLocale = StringUtils.replace(file.getName(), "_", "-");
			File appLocaleFile = new File(chromeLocalesDir, firefoxLocale + ".properties");

			byte[] content = FileUtils.readFileToByteArray(chromeLocaleFile);
			Map map = objectMapper.readValue(content, Map.class);
			StringBuilder sb = new StringBuilder();
			for (Object key : map.keySet()) {
				String message = (String) ((Map) map.get(key)).get("message");
				message = message.replaceAll("\n", "\\\\n");
				sb.append(key).append("=").append(message);
				sb.append(System.lineSeparator());
			}
			FileUtils.writeStringToFile(appLocaleFile, sb.toString(), "utf-8");
			FileUtils.deleteQuietly(file);
		}
	}

	public static void writeLocalesToFirefoxInstallRdf(File dest) throws IOException {
//		<em:localized>
//		<Description>
//		<em:locale>en</em:locale>
//		<em:name>Adguard AdBlocker</em:name>
//		<em:description>Adguard AdBlocker</em:description>
//		</Description>
//		</em:localized>
		File installManifest = new File(dest, "install.rdf");
		if (!installManifest.exists()) {
			return;
		}

		StringBuilder sb = new StringBuilder();
		for (SupportedLocales locale : SupportedLocales.values()) {
			File localeFile = new File(dest, "locale/" + locale.code.replace("_", "-") + ".properties");
			String[] messages = StringUtils.split(FileUtils.readFileToString(localeFile), System.lineSeparator());
			String name = findMessage(messages, "name");
			String description = findMessage(messages, "description");
			sb.append("<em:localized>").append(System.lineSeparator());
			sb.append("\t<Description>").append(System.lineSeparator());
			sb.append("\t\t<em:locale>").append(locale.code).append("</em:locale>").append(System.lineSeparator());
			sb.append("\t\t<em:name>").append(name).append("</em:name>").append(System.lineSeparator());
			sb.append("\t\t<em:description>").append(description).append("</em:description>").append(System.lineSeparator());
			sb.append("\t</Description>").append(System.lineSeparator());
			sb.append("</em:localized>").append(System.lineSeparator());
		}

		String content = FileUtils.readFileToString(installManifest);
		content = StringUtils.replace(content, "${localised}", sb.toString());
		FileUtils.writeStringToFile(installManifest, content, "utf-8");
	}

	private static String findMessage(String[] messages, String key) {
		for (String message : messages) {
			if (message.startsWith(key + "=")) {
				return StringUtils.substringAfter(message, key + "=");
			}
		}
		throw new IllegalStateException("Can't find message " + key);
	}
}
