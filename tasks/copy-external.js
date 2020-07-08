import gulp from 'gulp';
import rename from 'gulp-rename';

const copyExternal = () => {
    const scriptletsDist = 'Extension/lib/libs/scriptlets';
    const scriptletSources = [
        'node_modules/scriptlets/dist/redirects.yml',
        'node_modules/scriptlets/dist/redirects.js',
    ];

    const assistantDist = 'Extension/lib/content-script/assistant/js';
    const assistantSource = 'node_modules/adguard-assistant/dist/assistant.embedded.js';

    return gulp
        .src(scriptletSources)
        .pipe(gulp.dest(scriptletsDist, { allowEmpty: true }))
        .pipe(gulp.src(assistantSource))
        .pipe(rename('assistant.js'))
        .pipe(gulp.dest(assistantDist));
};

export default copyExternal;
