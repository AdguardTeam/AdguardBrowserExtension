import gulp from 'gulp';

const copyExternal = () => {
    const scriptletsDist = 'Extension/lib/libs/scriptlets';
    const scriptletSources = [
        'node_modules/scriptlets/dist/scriptlets.js',
        'node_modules/scriptlets/dist/redirects.yml',
        'node_modules/scriptlets/dist/redirects.js',
    ];

    return gulp
        .src(scriptletSources)
        .pipe(gulp.dest(scriptletsDist, { allowEmpty: true }));
};

export default copyExternal;
