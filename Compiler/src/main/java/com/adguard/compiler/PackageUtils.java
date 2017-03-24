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
import org.apache.commons.lang.ArrayUtils;
import org.apache.log4j.Logger;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * Helper methods for packaging extensions
 */
public class PackageUtils {

	private static Logger log = Logger.getLogger(PackageUtils.class);

	public static File createZip(String makeZipSh, File file) throws Exception {
		execute(makeZipSh, file.getAbsolutePath());
		File zipFile = new File(file, file.getName() + ".zip");
		File destZipFile = new File(file.getParentFile(), zipFile.getName());
		FileUtils.deleteQuietly(destZipFile);
		FileUtils.moveFile(zipFile, destZipFile);
		return destZipFile;
	}

	public static File createCrx(String makeCrxSh, File file, File certificate) throws Exception {
		execute(makeCrxSh, file.getAbsolutePath(), certificate.getAbsolutePath());
		File crxFile = new File(file, file.getName() + ".crx");
		File destCrxFile = new File(file.getParentFile(), crxFile.getName());
		FileUtils.deleteQuietly(destCrxFile);
		FileUtils.moveFile(crxFile, destCrxFile);
		return destCrxFile;
	}

	public static File createXpi(String makeXpiSh, File file) throws Exception {
		String xpiName = "adguard-adblocker";
		execute(makeXpiSh, file.getAbsolutePath(), xpiName);
		File xpiFile = new File(file.getParentFile(), xpiName + ".xpi");
		File destXpiFile = new File(file.getParentFile(), file.getName() + ".xpi");
		if (destXpiFile.exists()) {
			FileUtils.deleteQuietly(destXpiFile);
		}
		FileUtils.moveFile(xpiFile, destXpiFile);
		FileUtils.deleteQuietly(file);
		return destXpiFile;
	}

	public static File createExtz(String makeExtzSh, File file) throws IOException, InterruptedException {
		execute(makeExtzSh, file.getAbsolutePath());
		return new File(file.getParentFile(), file.getName().replace("safariextension", "safariextz"));
	}

	private static void execute(String... commands) throws IOException, InterruptedException {
		ProcessBuilder pb = new ProcessBuilder(commands);
		Process p = pb.start();
		BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
		String line;
		while ((line = reader.readLine()) != null) {
			log.debug(line);
		}
		p.waitFor();
		if (p.exitValue() != 0) {
			reader = new BufferedReader(new InputStreamReader(p.getErrorStream()));
			while ((line = reader.readLine()) != null) {
				log.error(line);
			}
			throw new IOException("Command " + ArrayUtils.toString(commands) + " not success");
		}
	}
}
