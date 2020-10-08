/* eslint-disable no-console */
import webpack from 'webpack';

export const bundleRunner = (webpackConfig, watch = false) => {
    const compiler = webpack(webpackConfig);

    const run = watch ? (cb) => compiler.watch({}, cb) : compiler.run;

    return new Promise((resolve, reject) => {
        run((err, stats) => {
            if (err) {
                console.error(err.stack || err);
                if (err.details) {
                    console.error(err.details);
                }
                reject();
                return;
            }
            if (stats.hasErrors()) {
                console.log(stats.toString({
                    colors: true,
                    all: false,
                    errors: true,
                    moduleTrace: true,
                    logging: 'error',
                }));
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
