QUnit.test('exports settings in json', (assert) => {
    const done = assert.async();
    adguard.sync.settingsProvider.loadSettingsBackup((json) => {
        const settings = JSON.parse(json);

        assert.equal(settings['protocol-version'], '1.0', 'has right protocol number');
        assert.ok(settings['extension-specific-settings'], 'has extension specific settings section');
        assert.ok(settings['general-settings'], 'has general settings section');
        assert.ok(settings['filters'], 'has filters section');
        done();
    });
});

QUnit.test('updates settings from json', async (assert) => {
    const done = assert.async();
    const response = await fetch('./adg_ext_settings.json');
    const jsonText = await response.text();

    adguard.sync.settingsProvider.applySettingsBackup(jsonText, (success) => {
        assert.ok(success, 'should successfully apply');
        done();
    });
});
