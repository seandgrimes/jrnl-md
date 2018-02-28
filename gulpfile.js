const gulp = require('gulp');
const ts = require('gulp-typescript');

gulp.task('default', () => {
    return gulp.src('src/**/*.ts')
        .pipe(ts({
            'lib': ['ES2017'],
            'target': 'es5',
            'types': ['reflect-metadata', 'node'],
            'module': 'commonjs',
            'moduleResolution': 'node',
            'experimentalDecorators': true,
            'emitDecoratorMetadata': true
        }))
        .pipe(gulp.dest('dist'));
});