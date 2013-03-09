test:
	@./node_modules/.bin/mocha -R spec --require ./test/support.js ./test/vm.test.js

.PHONY: test
