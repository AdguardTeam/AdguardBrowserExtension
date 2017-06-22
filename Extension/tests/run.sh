#!/bin/bash

# return 1 if global command line program installed, else 0
# example
# echo "node: $(program_is_installed node)"
function program_is_installed {
  # set to 1 initially
  local return_=1
  # set to 0 if not found
  type $1 >/dev/null 2>&1 || { local return_=0; }
  # return value
  echo "$return_"
}

function usage {
    echo "To use this script you first need install the following programs:"
    echo "npm"
    echo "nodejs"
    echo "npm install -g node-qunit-phantomjs"
    exit 0
}

# ============================================== Functions

if [ $(program_is_installed npm) != 1 ]; then
    usage
fi

if [ $(program_is_installed node) != 1 ]; then
    usage
fi

if [ $(program_is_installed node-qunit-phantomjs) != 1 ]; then
    usage
fi

echo "Running tests"
echo "-------------"

echo "Rule constructor tests"
node-qunit-phantomjs rule-constructor/test-rule-constructor.html || exit 1

echo "Safari converter tests"
node-qunit-phantomjs safari-converter/test-safari-converter.html || exit 1

echo "Safebrowsing filter tests"
node-qunit-phantomjs sb-filter/test-sb-filter.html || exit 1

echo "Url filter tests"
node-qunit-phantomjs url-filter/test-url-filter.html || exit 1

echo "Css filter tests"
node-qunit-phantomjs css-filter/test-css-filter.html || exit 1

echo "Css hits tests"
node-qunit-phantomjs css-filter/test-css-hits.html || exit 1

echo "Request filter tests"
node-qunit-phantomjs request-filter/test-request-filter.html || exit 1

echo "Ring buffer tests"
node-qunit-phantomjs miscellaneous/test-ring-buffer.html || exit 1