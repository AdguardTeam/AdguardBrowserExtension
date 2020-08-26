/* eslint-disable no-console */
import { program } from 'commander';
import { downloadLocales } from './locales/download-locales';
import { uploadLocales } from './locales/upload-locales';

const download = async () => {
    try {
        await downloadLocales();
        console.log('Download was successful');
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
};

const upload = async () => {
    try {
        const result = await uploadLocales();
        console.log(`Upload was successful with response: ${JSON.stringify(result)}`);
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
};

program
    .command('download')
    .description('Downloads messages from localization service')
    .action(download);

program
    .command('upload')
    .description('Uploads base messages to the localization service')
    .action(upload);

program.parse(process.argv);
