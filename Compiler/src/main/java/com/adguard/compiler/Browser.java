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
	 * Firefox browser (legacy XPCOM)
	 */
	FIREFOX_LEGACY("firefox"),

	/**
	 * Firefox WebExtensions
	 */
	FIREFOX_WEBEXT("firefox_webext");

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

	/**
	 * Divides browsers into groups.
	 * These groups are used for further work with filters
	 *
	 * @return group name
	 */
	public String getBrowserGroup() {
		switch (this) {
			case SAFARI:
				return "safari";
			case FIREFOX_LEGACY:
			case FIREFOX_WEBEXT:
				return "firefox";
			case CHROMIUM:
			case EDGE:
			default:
				return "chromium";
		}
	}
}
