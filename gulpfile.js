const gulp = require('gulp');
const ts = require('gulp-typescript');

gulp.task('default', () => {
    return gulp.src('src/**/*.ts')
        .pipe(ts({
            'lib': ['ES2017']
        }))
        .pipe(gulp.dest('dist'));
});