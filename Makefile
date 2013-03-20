build:
	@./node_modules/.bin/uglifyjs chip8.build.js -o chip8.min.js

test:
	@./node_modules/.bin/mocha -R spec --require ./test/support.js ./test/vm.test.js

test-browser:
	@./node_modules/.bin/serve .

documentation:
	@yuidoc .

.PHONY: test
