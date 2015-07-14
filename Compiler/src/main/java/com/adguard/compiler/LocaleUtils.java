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
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.codehaus.jackson.map.ObjectMapper;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.Map;

/**
 * Helper class for working with locales
 */
public class LocaleUtils {

	public enum SupportedLocales {

		EN("en"), // English
		RU("ru"), // Russian
		DE("de"), // German
		TR("tr"), // Turkish
		UK("uk"), // Ukrainian
		PL("pl"), // Polish
		PT_BR("pt_BR"), // Portuguese (Brazil)
		PT_PT("pt_PT"), // Portuguese (Portugal)
		KO("ko"), // Korean
		zh_CN("zh_CN"), // Chinese (China)
		SR("sr"), // Serbian
		FR("fr"), // French
		SK("sk"), // Slovak
		HY("hy"); // Armenian

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

	public static void updateExtensionNameForChromeLocales(File dest, String extensionNamePostfix) throws IOException {

		if (StringUtils.isEmpty(extensionNamePostfix)) {
			return;
		}

		File chromeLocalesDir = new File(dest, "_locales");

		for (File file : chromeLocalesDir.listFiles()) {

			File chromeLocaleFile = new File(file, "messages.json");

			StringBuilder sb = new StringBuilder();
			BufferedReader reader = null;
			try {
				reader = new BufferedReader(new FileReader(chromeLocaleFile));
				String line;
				while ((line = reader.readLine()) != null) {
					sb.append(line).append("\r\n");
					if (line.trim().startsWith("\"name\":") || line.trim().startsWith("\"short_name\":")) {
						line = reader.readLine();
						String[] parts = StringUtils.split(line, ":");
						String message = StringUtils.removeEnd(parts[1].trim(), "\"") + extensionNamePostfix + "\"";
						sb.append("\t\"message\": ").append(message).append("\r\n");
					}
				}
			} finally {
				IOUtils.closeQuietly(reader);
			}

			FileUtils.writeStringToFile(chromeLocaleFile, sb.toString());
		}
	}

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

	public static void writeLocalesToFirefoxInstallRdf(File dest, String extensionNamePostfix) throws IOException {
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
			String name = findMessage(messages, "name") + extensionNamePostfix;
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
