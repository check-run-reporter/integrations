# This Makefile has been written according to guidelines at
# https://tech.davis-hansson.com/p/make/

# Use ">" instead of "\t" for blocks to avoid surprising whitespace issues
ifeq ($(origin .RECIPEPREFIX), undefined)
  $(error "This Make does not support .RECIPEPREFIX. Please use GNU Make 4.0 or later. If you've installed an up-to-date Make with homebrew, you maye need to invoke 'gmake' instead of 'make'.")
endif
.RECIPEPREFIX = >

# Make sure we use actual bash instead of zsh or sh
SHELL := bash

# Enforce bash "strict mode"
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
.SHELLFLAGS := -euo pipefail -c

# Use one shell session per rule instead of one shell session per line
.ONESHELL:

# Indicate this Makefile is portable
.POSIX:

# Delete the target of a Make rule if the rule fails
.DELETE_ON_ERROR:

# Warn on undefined variables
MAKEFLAGS += --warn-undefined-variables

# Disable all the magical-but-unreadable bits of Make
MAKEFLAGS += --no-builtin-rules

# Wrap npx so it only uses local dependencies
NPX := npx --no-install

###############################################################################
## Constants
###############################################################################

VERSION := $(shell jq -r .version package.json)

###############################################################################
## Files
###############################################################################

SRC_FILES        := $(shell find src -name '*.ts')
DIST_CJS_FILES   := $(subst .ts,.js, $(subst src,dist/cjs,$(SRC_FILES)))
DIST_ESM_FILES   := $(subst .ts,.js, $(subst src,dist/esm,$(SRC_FILES)))
DIST_TYPES_FILES := $(subst .ts,.d.ts, $(subst src,dist/types,$(SRC_FILES)))

EXES             := dist/pkg/crr-$(VERSION)-linux dist/pkg/crr-$(VERSION)-macos dist/pkg/crr-$(VERSION)-windows.exe dist/ncc/index.js
EXE_SHAS         := $(addsuffix .sha1, $(EXES))

###############################################################################
## Default Target
###############################################################################

all: $(EXES) $(EXE_SHAS) $(DIST_CJS_FILES) $(DIST_ESM_FILES) $(DIST_TYPES_FILES) README.md

###############################################################################
## Helpers
###############################################################################

# Print any Makefile variable
# Usage: make print-USER
print-%  : ; @echo $* = $($*)
.PHONY: print-%

###############################################################################
## Rules
###############################################################################

$(DIST_CJS_FILES) &: $(SRC_FILES)
> $(NPX) rimraf dist/cjs
> BUILD_TARGET=cjs $(NPX) babel --source-maps --extensions '.js,.ts,.tsx' -d dist/cjs src

$(DIST_ESM_FILES) &: $(SRC_FILES)
> $(NPX) rimraf dist/esm
> BUILD_TARGET=esm $(NPX) babel --source-maps --extensions '.js,.ts,.tsx' -d dist/esm src

$(DIST_TYPES_FILES) &: $(SRC_FILES)
> $(NPX) rimraf dist/types
> $(NPX) tsc --emitDeclarationOnly

%.sha1: %
> sha1sum $< > $@

###############################################################################
## Targets
###############################################################################

dist/ncc/index.js: $(SRC_FILES)
> $(NPX) ncc build ./src/cli.ts --source-map --out dist/ncc

dist/pkg/crr-$(VERSION)-linux: dist/ncc/index.js
> $(NPX) pkg . --target linux --output $@

dist/pkg/crr-$(VERSION)-macos: dist/ncc/index.js
> $(NPX) pkg . --target macos --output $@

dist/pkg/crr-$(VERSION)-windows.exe: dist/ncc/index.js
> $(NPX) pkg . --target windows --output $@

README.md:
> $(NPX) markdown-toc -i --bullets='-' --maxdepth=3 README.md
> $(NPX) prettier --write README.md
.PHONY: README.md
