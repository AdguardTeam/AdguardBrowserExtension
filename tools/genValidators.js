/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

/**
 * Precompile ajv validators for prevent ajv run cached validator function code from string
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const standaloneCode = require('ajv/dist/standalone').default;

const ajv = new Ajv({ code: { source: true } });

const moduleBanner = `/**
 * DON'T EDIT THIS FILE
 * Module was generated automatically by ajv precompiler 
 * See '/tools/bundle/genValidators.js'
 */
`;

const createValidatorFile = (schemaPath, outputPath) => {
    const schema = require(schemaPath);
    const validator = ajv.compile(schema);
    const moduleCode = standaloneCode(ajv, validator);
    fs.writeFileSync(
        outputPath,
        moduleBanner + moduleCode,
        { flag: 'w' },
    );
};

export const genValidators = () => {
    createValidatorFile(
        path.resolve(__dirname, '../Extension/src/background/settings/settings.schema.json'),
        path.resolve(__dirname, '../Extension/src/background/settings/validator.js'),
    );
};
