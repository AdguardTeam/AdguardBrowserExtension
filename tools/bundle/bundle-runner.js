/* eslint-disable no-console */
import webpack from 'webpack';

export const bundleRunner = (webpackConfig) => {
    const bundler = webpack(webpackConfig);

    return new Promise((resolve, reject) => {
        bundler.run((err, stats) => {
            if (err) {
                console.error(err.stack || err);
                if (err.details) {
                    console.error(err.details);
                }
                reject();
                return;
            }

            console.log(stats.toString({
                chunks: false,  // Makes the build much quieter
                colors: true,    // Shows colors in the console
            }));
            resolve();
        });
    });
};
