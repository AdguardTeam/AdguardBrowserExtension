/**
 * The contents of this file should be pasted to extension background console.
 */

const manifestPath = 'manifest.json';
const filtersPath = 'filters.json';

const assert = {
    ok(v) {
        if (!v) {
            console.error('Assert failed!');
        }
    },
    equal(a, b) {
        if (a != b) {
            console.error(`Assert failed: ${a} != ${b}`);
        }
    },
};

const testSettingsProvider = function (callback) {
    const before = adguard.sync.settingsProvider.loadLocalManifest();
    assert.ok(before != null);
    // assert.ok(before.timestamp);
    assert.ok(before['protocol-version']);
    assert.ok(before['min-compatible-version']);
    assert.ok(before['app-id']);
    assert.ok(before['sections'].length > 0);

    const timestamp = Date.now();
    adguard.sync.settingsProvider.syncLocalManifest(before, timestamp);

    const updated = adguard.sync.settingsProvider.loadLocalManifest();
    assert.ok(updated != null);
    assert.equal(updated.timestamp, timestamp);
    assert.equal(updated['protocol-version'], before['protocol-version']);
    assert.equal(updated['min-compatible-version'], before['min-compatible-version']);
    assert.equal(updated['app-id'], before['app-id']);
    assert.equal(updated['sections'].length, before['sections'].length);

    const onSectionUpdated = function (section) {
        assert.ok(section);
        assert.ok(section.filters['enabled-filters'].length > 0);

        const userRules = section.filters['user-filter'].rules.split('\n');
        assert.ok(userRules.length > 0);
        assert.ok(userRules.indexOf('test-add-rule') > -1);

        assert.ok(section.filters['whitelist'].domains.length > 0);
        assert.ok(section.filters['whitelist'].domains.indexOf('whitelisted-domain-two.com') > -1);
        assert.equal(section.filters['whitelist'].inverted, true);

        // Return back
        const { rules } = section.filters['user-filter'];
        section.filters['user-filter'].rules = rules.substring(rules.lastIndexOf('test-add-rule'));
        section.filters['enabled-filters'].pop();
        const i = section.filters['whitelist'].domains.indexOf('whitelisted-domain-two.com');
        section.filters['whitelist'].domains.splice(i, 1);
        section.filters['whitelist'].inverted = false;

        adguard.sync.settingsProvider.applySection(filtersPath, section, () => {
            callback('OK!');
        });
    };

    const onSectionSaved = function (result) {
        assert.ok(result);

        adguard.sync.settingsProvider.loadSection(filtersPath, onSectionUpdated);
    };

    const onSectionLoaded = function (section) {
        console.log(section);

        assert.ok(section);
        assert.ok(section.filters);
        assert.ok(section.filters['custom-filters']);
        assert.ok(section.filters['enabled-filters']);
        assert.ok(section.filters['user-filter']);
        assert.ok(section.filters['whitelist']);

        // Modify
        section.filters['user-filter'].rules += '\ntest-add-rule';
        section.filters['enabled-filters'].push(1);
        section.filters['enabled-filters'].push(2);
        section.filters['whitelist'].domains.push('whitelisted-domain-two.com');
        section.filters['whitelist'].inverted = true;

        adguard.sync.settingsProvider.applySection(filtersPath, section, onSectionSaved);
    };

    adguard.sync.settingsProvider.loadSection(filtersPath, onSectionLoaded);
};

testSettingsProvider((r) => {
    console.log(r);
});
