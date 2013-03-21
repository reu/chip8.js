build:
	@./node_modules/.bin/uglifyjs chip8.build.js -o chip8.min.js

test:
	@./node_modules/.bin/mocha -R spec --require ./test/support.js ./test/cpu.test.js

test-browser:
	@./node_modules/.bin/serve .

documentation:
	@yuidoc .

clean-documentation:
	rm -rf out

clean: clean-documentation
	rm -f chip8.build.js
	rm -f chip8.min.js

.PHONY: test test-browser documentation clean clean-documentation
