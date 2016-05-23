package com.adguard.compiler;

/**
 * User: atropnikov
 * Date: 06.03.15
 */
public enum Browser {

	/**
	 * Chrome-based (Chrome, Opera, YaBrowser)
	 */
	CHROMIUM("chrome"),
	
	/**
	 * Microsoft edge
	 */
	EDGE("edge"),

	/**
	 * Safari
	 */
	SAFARI("safari"),

	/**
	 * Firefox browser
	 */
	FIREFOX("firefox"),

	/**
	 * Legacy firefox (older than v30)
	 */
	FIREFOX_LEGACY("firefox_legacy");

	private String name;

	Browser(String name) {
		this.name = name;
	}

	public static Browser getByName(String name) {
		for (Browser browser : values()) {
			if (browser.name.equals(name)) {
				return browser;
			}
		}
		return null;
	}
}
