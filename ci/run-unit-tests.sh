#!/bin/bash -x

echo "Running phantomjs processes:"
ps -elf | grep [p]hantomjs

. $(dirname $0)/lib.sh

echo "Running tests with Karma..."

PATH=$PATH:/opt/npm/node_modules/.bin:./node_modules/.bin

test_opts="--browser=PhantomJS"

coverage=0

if [[ $1 = "-c" ]]; then
    echo "Coverage enabled."
    coverage=1
fi

grunt test-ci $test_opts
