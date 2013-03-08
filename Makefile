test:
	@./node_modules/.bin/mocha --require ./test/support.js ./test/vm.test.js

.PHONY: test
