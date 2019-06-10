import gulp from 'gulp';

const copyExternal = () => {
    const dist = 'Extension/lib/libs';
    const resources = [
        'node_modules/scriptlets/dist/scriptlets.js',
        'node_modules/scriptlets/dist/redirects.yml',
        'node_modules/scriptlets/dist/redirects.js',
    ];

    return gulp
        .src(resources)
        .pipe(gulp.dest(dist));
};

export default copyExternal;
