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
import org.apache.commons.lang.StringEscapeUtils;
import org.apache.commons.lang.StringUtils;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Set;

/**
 * Helper method for customizing manifest files and extension local script rules
 */
public class SettingUtils {

    private final static String LOCAL_SCRIPT_RULES_FILE_TEMPLATE = "/**\r\n" +
            " * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).\r\n" +
            " *\r\n" +
            " * Adguard Browser Extension is free software: you can redistribute it and/or modify\r\n" +
            " * it under the terms of the GNU Lesser General Public License as published by\r\n" +
            " * the Free Software Foundation, either version 3 of the License, or\r\n" +
            " * (at your option) any later version.\r\n" +
            " *\r\n" +
            " * Adguard Browser Extension is distributed in the hope that it will be useful,\r\n" +
            " * but WITHOUT ANY WARRANTY; without even the implied warranty of\r\n" +
            " * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\r\n" +
            " * GNU Lesser General Public License for more details.\r\n" +
            " *\r\n" +
            " * You should have received a copy of the GNU Lesser General Public License\r\n" +
            " * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.\r\n" +
            " */\r\n" +
            "\r\n" +
            "/**\r\n" +
            " * By the rules of AMO and addons.opera.com we cannot use remote scripts\r\n" +
            " * (and our JS injection rules could be counted as remote scripts).\r\n" +
            " *\r\n" +
            " * So what we do:\r\n" +
            " * 1. We gather all current JS rules in the DEFAULT_SCRIPT_RULES object\r\n" +
            " * 2. We disable JS rules got from remote server\r\n" +
            " * 3. We allow only custom rules got from the User filter (which user creates manually)\r\n" +
            " *    or from this DEFAULT_SCRIPT_RULES object\r\n" +
            " */\r\n" +
            "var DEFAULT_SCRIPT_RULES = Object.create(null);\r\n%s";

    private final static String MESSAGE_IDS_FILE_TEMPLATE = "/**\r\n" +
            " * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).\r\n" +
            " *\r\n" +
            " * Adguard Browser Extension is free software: you can redistribute it and/or modify\r\n" +
            " * it under the terms of the GNU Lesser General Public License as published by\r\n" +
            " * the Free Software Foundation, either version 3 of the License, or\r\n" +
            " * (at your option) any later version.\r\n" +
            " *\r\n" +
            " * Adguard Browser Extension is distributed in the hope that it will be useful,\r\n" +
            " * but WITHOUT ANY WARRANTY; without even the implied warranty of\r\n" +
            " * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\r\n" +
            " * GNU Lesser General Public License for more details.\r\n" +
            " *\r\n" +
            " * You should have received a copy of the GNU Lesser General Public License\r\n" +
            " * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.\r\n" +
            " */\r\n" +
            "\r\n" +
            "var I18N_MESSAGES = [%s];\r\n";

    public static void writeLocalScriptRulesToFile(File dest, Set<String> scriptRules) throws IOException {
        String scriptRulesText = getScriptRulesText(scriptRules);
        String settings = String.format(LOCAL_SCRIPT_RULES_FILE_TEMPLATE, scriptRulesText);
        FileUtils.writeStringToFile(getLocalScriptRulesFile(dest), settings, "utf-8");
    }

    public static void writeMessageIdsToFile(File dest, List<String> messageIds) throws IOException {
        String i18nMessages = String.format(MESSAGE_IDS_FILE_TEMPLATE, StringUtils.join(messageIds, ",\r\n"));
        FileUtils.writeStringToFile(getMessageIdsFile(dest), i18nMessages, "utf-8");
    }

    public static void updateManifestFile(File dest, Browser browser, String version, String extensionId, String updateUrl, String extensionNamePostfix) throws IOException {

        switch (browser) {
            case CHROMIUM:
            case EDGE:
                File manifestFile = new File(dest, "manifest.json");
                String content = FileUtils.readFileToString(manifestFile, "utf-8").trim();
                if (updateUrl != null) {
                    content = StringUtils.removeEnd(content, "}").trim();
                    content = content + ",\r\n\r\n";
                    content = content + "\t\"update_url\": \"" + updateUrl + "\"\r\n}";
                }
                content = StringUtils.replace(content, "${version}", version);
                FileUtils.writeStringToFile(manifestFile, content, "utf-8");
                break;
            case SAFARI:
                File infoPlistFile = new File(dest, "Info.plist");
                String contentInfoPlist = FileUtils.readFileToString(infoPlistFile, "utf-8");
                contentInfoPlist = StringUtils.replace(contentInfoPlist, "${extensionId}", extensionId);
                contentInfoPlist = StringUtils.replace(contentInfoPlist, "${version}", version);
                contentInfoPlist = StringUtils.replace(contentInfoPlist, "${updateURL}", updateUrl != null ? updateUrl : "");
                String updateFromGallery = StringUtils.contains(extensionId, "beta") ? "false" : "true";
                contentInfoPlist = StringUtils.replace(contentInfoPlist, "${updateFromGallery}", updateFromGallery);
                contentInfoPlist = StringUtils.replace(contentInfoPlist, "${extensionNamePostfix}", extensionNamePostfix);
                FileUtils.writeStringToFile(infoPlistFile, contentInfoPlist, "utf-8");
                break;
            case FIREFOX:
            case FIREFOX_LEGACY:
                File installRdf = new File(dest, "install.rdf");
                String contentRdf = FileUtils.readFileToString(installRdf, "utf-8").trim();
                //write update url link
                if (updateUrl == null) {
                    updateUrl = "";
                } else {
                    updateUrl = "<em:updateURL>" + updateUrl + "</em:updateURL>";
                }
                contentRdf = StringUtils.replace(contentRdf, "${updateUrl}", updateUrl);
                contentRdf = StringUtils.replace(contentRdf, "${version}", version);
                contentRdf = StringUtils.replace(contentRdf, "${extensionId}", extensionId);
                FileUtils.writeStringToFile(installRdf, contentRdf, "utf-8");
                //write version
                File packageJson = new File(dest, "package.json");
                String contentPackageJson = FileUtils.readFileToString(packageJson, "utf-8");
                contentPackageJson = StringUtils.replace(contentPackageJson, "${version}", version);
                contentPackageJson = StringUtils.replace(contentPackageJson, "${extensionId}", extensionId);
                contentPackageJson = StringUtils.replace(contentPackageJson, "${extensionNamePostfix}", extensionNamePostfix);
                FileUtils.writeStringToFile(packageJson, contentPackageJson, "utf-8");
                break;
        }
    }

    /**
     * By default we use "require" to be used in jpm-packed extension.
     * But in case of Legacy build we will pack it with cfx, so path should be different.
     */
//    public static void updateRequirePathForCfx(File dest) throws IOException {
//
//        Collection<File> files = FileUtils.listFiles(dest, new String[]{"js"}, true);
//
//        for (File file : files) {
//            // JPM does not allow to use absolute path
//            // So now we have rewritten everything to relative
//            // Example: utils/log --> ../../lib/utils/log
//
//            String content = FileUtils.readFileToString(file, "utf-8");
//            Matcher matcher = Pattern.compile("require\\(('|\")(..\\/)*lib\\/(.*)('|\")\\)").matcher(content);
//            String newContent = matcher.replaceAll("require('$3')");
//
//            if (!content.equals(newContent)) {
//                FileUtils.writeStringToFile(file, newContent, "utf-8");
//            }
//        }
//    }

    /**
     * By the rules of AMO and addons.opera.com we cannot use remote scripts,
     * but for beta and dev Firefox version we gonna support it.
     *
     * Look DEFAULT_SCRIPT_RULES and https://github.com/AdguardTeam/AdguardBrowserExtension/issues/388.
     *
     * In this temp solution we simply edit preload js code to allow all rules in FF
     *
     * @param dest source path
     * @param branch branch name (release/beta/dev)
     */
    public static void updatePreloadRemoteScriptRules(File dest, String branch) throws Exception {
        if ("beta".equals(branch)
                || "dev".equals(branch)
                || "legacy".equals(branch)
                || "dev-legacy".equals(branch)) {

            String replaceClauseTemplate = "if (!isFirefox && !isOpera) {";

            File file = new File(dest, "lib/content-script/preload.js");
            String content = FileUtils.readFileToString(file, "utf-8").trim();

            if (StringUtils.indexOf(content, replaceClauseTemplate) < 0) {
                throw new Exception("Invalid code working with FF remote rules");
            }

            content = StringUtils.replaceOnce(content, replaceClauseTemplate, "if (!isOpera) {");
            if (StringUtils.indexOf(content, replaceClauseTemplate) > 0) {
                throw new Exception("Invalid code working with FF remote rules");
            }

            FileUtils.writeStringToFile(file, content, "utf-8");
        }
    }


    public static String getScriptRulesText(Set<String> scriptRules) {
        StringBuilder sb = new StringBuilder();
        if (scriptRules != null) {
            for (String scriptRule : scriptRules) {
                String ruleText = StringEscapeUtils.escapeJavaScript(scriptRule);
                sb.append("DEFAULT_SCRIPT_RULES[\"").append(ruleText).append("\"] = true;\r\n");
            }
        }
        return sb.toString();
    }

    private static File getLocalScriptRulesFile(File sourcePath) {
        return new File(sourcePath, "lib/utils/local-script-rules.js");
    }

    private static File getMessageIdsFile(File sourcePath) {
        return new File(sourcePath, "lib/utils/i18n-messages.js");
    }
}
