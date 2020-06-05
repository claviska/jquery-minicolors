/* eslint-env node, es6 */
'use strict';

const gulp = require('gulp');
const del = require('del');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');

// Clean
gulp.task('clean', gulp.series(() => {
  return del('jquery.minicolors.min.js');
}));

// Minify
gulp.task('minify', gulp.series('clean', () => {
  return gulp.src('jquery.minicolors.js')
    .pipe(uglify({
      output: {
        comments: require('uglify-save-license')
      }
    }))
    .on('error', (err) => {
      console.error(err);
      this.emit('end');
    })
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(__dirname));
}));

// Watch for changes
gulp.task('watch', gulp.series(() => {
  gulp.watch('jquery.minicolors.js', ['minify']);
}));

// Default
gulp.task('default', gulp.series('minify'));
