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
var adguard;
if (window.top === window && document.documentElement instanceof HTMLElement) {

	function initAssistant(assistantOptions) {

		var selectedElement;
		if (assistantOptions) {
			selectedElement = document.querySelector(assistantOptions.cssSelector);
		}

		adguard = new Adguard();

		var ids = [
			'assistant_select_element',
			'assistant_select_element_ext',
			'assistant_select_element_cancel',
			'assistant_block_element',
			'assistant_block_element_explain',
			'assistant_slider_explain',
			'assistant_slider_min',
			'assistant_slider_max',
			'assistant_extended_settings',
			'assistant_rule_parameters',
			'assistant_apply_rule_to_all_sites',
			'assistant_block_by_reference',
			'assistant_block_similar',
			'assistant_block',
			'assistant_another_element',
			'assistant_preview',
			'assistant_preview_start',
			'assistant_preview_end'
		];
		self.port.emit('get-assistant-localization', ids);
		self.port.on('set-assistant-localization', function (localization) {
			localization.assistant_select_element_ext += ' ';
			adguard.init({
				localization: localization,
				selectedElement: selectedElement
			});
		});
	}

	function destroyAssistant() {
		if (adguard) {
			adguard.destroy();
			adguard = null;
		}
	}

	self.port.on('initAssistant', initAssistant);
	self.port.on('destroyAssistant', destroyAssistant);
}