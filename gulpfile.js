const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('default', () => {
    return gulp.src('src/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(ts({
            'lib': ['ES2017'],
            'target': 'es6',
            'types': ['reflect-metadata', 'node'],
            'module': 'commonjs',
            'moduleResolution': 'node',
            'experimentalDecorators': true,
            'emitDecoratorMetadata': true,
            'sourceMap': true
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', () => gulp.watch('src/**/*.ts', ['default']));
