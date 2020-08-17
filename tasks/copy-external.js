import gulp from 'gulp';
import rename from 'gulp-rename';

const copyExternal = () => {
    const redirectsYamlDist = 'Extension/lib/libs/scriptlets';
    const redirectsYamlSources = [
        'node_modules/scriptlets/dist/redirects.yml',
        'node_modules/scriptlets/dist/redirects.js',
    ];

    const redirectResourcesDist = 'Extension/web-accessible-resources/redirects';
    const redirectResourcesSources = 'node_modules/scriptlets/dist/redirect-files/*';

    const assistantDist = 'Extension/lib/content-script/assistant/js';
    const assistantSource = 'node_modules/adguard-assistant/dist/assistant.embedded.js';

    return gulp
        .src(redirectsYamlSources)
        .pipe(gulp.dest(redirectsYamlDist, { allowEmpty: true }))
        .pipe(gulp.src(redirectResourcesSources))
        .pipe(gulp.dest(redirectResourcesDist))
        .pipe(gulp.src(assistantSource))
        .pipe(rename('assistant.js'))
        .pipe(gulp.dest(assistantDist));
};

export default copyExternal;
