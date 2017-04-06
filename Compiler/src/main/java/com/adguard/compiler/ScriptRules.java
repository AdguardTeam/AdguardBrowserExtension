package com.adguard.compiler;

import org.codehaus.jackson.annotate.JsonProperty;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Script rules object. For serialization into json object
 * {
 *  comment: '...',
 *  rules: [{
 *              domains: 'domain|<any>',
 *              script: '...'
 *          },
 *          ...
 *      ]
 * }
 * Created by a.tropnikov
 * 09.02.17
 */
public class ScriptRules {

    public static final String MASK_SCRIPT_RULE = "#%#";
    public static final String MASK_COMMENT_RULE = "!";

    private static final String ANY_DOMAIN = "<any>";

    @JsonProperty("comment")
    private final String comment;

    @JsonProperty("rules")
    private final List<ScriptRule> rules = new ArrayList<ScriptRule>();

    public ScriptRules(String comment) {
        this.comment = comment;
    }

    public void addRawRules(Collection<String> rulesText) {
        for (String ruleText : rulesText) {
            rules.add(ScriptRule.fromRaw(ruleText));
        }
    }

    private static class ScriptRule {

        @JsonProperty("domains")
        private final String domains;

        @JsonProperty("script")
        private final String script;

        public static ScriptRule fromRaw(String ruleText) {

            String domains = ANY_DOMAIN;

            int index = ruleText.indexOf(MASK_SCRIPT_RULE);
            if (index > 0) {
                domains = ruleText.substring(0, index);
            }

            String script = ruleText.substring(index + MASK_SCRIPT_RULE.length());

            return new ScriptRule(domains, script);
        }

        private ScriptRule(String domains, String script) {
            this.domains = domains;
            this.script = script;
        }
    }
}
